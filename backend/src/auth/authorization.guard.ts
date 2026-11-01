import { validateLinktreeUpdate } from '../linktrees/validate-linktree-update';
import { PAGE_PIN_MUTATION, validatePagePin } from '../common/page-pin.dto';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import {
  isPermissionKey,
  PERMISSION_BY_KEY,
  type Capability,
  type PermissionKey,
} from './capabilities';
import { ApprovalService } from './approval.service';
import { AuthorizationService } from './authorization.service';
import { REQUIRED_CAPABILITIES } from './require-capabilities.decorator';
import type { AuthorizationDecision } from '@linktree/types';
import type { SessionUser } from './session.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
    @Optional() private readonly approvals?: ApprovalService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Capability[]>(
      REQUIRED_CAPABILITIES,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: SessionUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
    if (user.role === 'platform-admin') return true;

    const params = (request.params || {}) as Record<string, unknown>;
    const body =
      request.body &&
      typeof request.body === 'object' &&
      !Array.isArray(request.body)
        ? (request.body as Record<string, unknown>)
        : {};
    if (
      request.method === 'PATCH' &&
      required.includes('business:linktrees:update')
    ) {
      const handler = context.getHandler();
      if (handler && Reflect.getMetadata(PAGE_PIN_MUTATION, handler) === true)
        validatePagePin(body);
      else validateLinktreeUpdate(body);
    }
    const permissions = [...required];
    const completeLinktreeEdit =
      request.method === 'PATCH' &&
      permissions.includes('business:linktrees:update') &&
      body.links !== undefined;
    if (completeLinktreeEdit && !permissions.includes('business:links:sync'))
      permissions.push('business:links:sync');
    let pending:
      | { permission: PermissionKey; decision: AuthorizationDecision }
      | undefined;
    for (const permission of permissions) {
      if (!isPermissionKey(permission)) {
        throw new ForbiddenException(
          'You do not have permission to perform this action',
        );
      }
      const definition = PERMISSION_BY_KEY.get(permission);
      const resourceId = this.resourceId(params);
      const changedFields =
        user.role === 'business' &&
        definition?.fields &&
        ['PATCH', 'PUT'].includes(request.method)
          ? Object.keys(body).filter(
              (field) =>
                field !== 'section' &&
                !(
                  completeLinktreeEdit &&
                  permission === 'business:linktrees:update' &&
                  ['links', 'linkMetadata', 'platforms'].includes(field)
                ),
            )
          : undefined;
      const decision =
        typeof (
          this.authorization as AuthorizationService & {
            authorize?: AuthorizationService['authorize'];
          }
        ).authorize === 'function'
          ? await this.authorization.authorize({
              principal: {
                id: user.id,
                type: user.role === 'business' ? 'business' : 'platform-admin',
              },
              businessId: user.role === 'business' ? user.id : undefined,
              permission,
              resource: resourceId
                ? {
                    type: completeLinktreeEdit
                      ? 'linktree'
                      : this.resourceType(permission),
                    id: resourceId,
                    ownerBusinessId:
                      user.role === 'business' ? user.id : undefined,
                  }
                : undefined,
              changedFields,
              context: {
                ipAddress: this.clientIp(request) || undefined,
                now: new Date(),
                requestId: this.header(request, 'x-request-id') || undefined,
              },
            })
          : {
              outcome: (await this.authorization.hasAll(user, [permission], {
                scopeType: user.role === 'business' ? 'business' : 'platform',
                scopeId: user.role === 'business' ? user.id : null,
                ipAddress: this.clientIp(request),
              }))
                ? ('allow' as const)
                : ('deny' as const),
              reasonCode: 'NO_PERMISSION' as const,
              deniedFields: [],
              approvalFields: [],
              source:
                user.role === 'business'
                  ? ('plan' as const)
                  : ('platform-role' as const),
            };
      if (decision.outcome === 'approval') {
        pending ??= { permission, decision };
        continue;
      }
      if (decision.outcome !== 'allow') {
        throw new ForbiddenException({
          code: decision.reasonCode,
          message: 'You do not have permission to perform this action',
          decision,
        });
      }
    }

    if (pending) {
      if (!this.approvals)
        throw new ForbiddenException('Approval service is unavailable');
      const resourceId = this.resourceId(params);
      const permission = completeLinktreeEdit
        ? 'business:linktrees:update'
        : pending.permission;
      const approval = await this.approvals.create({
        businessId: user.id,
        permission,
        action: `${request.method} ${request.url}`,
        resource: resourceId
          ? { type: this.resourceType(permission), id: resourceId }
          : undefined,
        changes: body,
        decision: pending.decision,
      });
      throw new HttpException(
        {
          statusCode: HttpStatus.ACCEPTED,
          code: 'APPROVAL_REQUIRED',
          message: 'This mutation was submitted for platform approval',
          approval,
          decision: pending.decision,
        },
        HttpStatus.ACCEPTED,
      );
    }

    return true;
  }

  private clientIp(request: FastifyRequest): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(',')[0].trim() || request.ip || null;
  }

  private resourceId(params: Record<string, unknown>): string | undefined {
    for (const key of ['id', 'linktreeId', 'businessId']) {
      const value = params[key];
      if (typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value)) {
        return value;
      }
    }
    return undefined;
  }

  private resourceType(permission: Capability): string {
    const segment = permission.split(':')[1];
    return segment === 'analytics' ? 'linktree' : segment.replace(/s$/, '');
  }

  private header(request: FastifyRequest, name: string): string {
    const value = request.headers[name];
    const first = Array.isArray(value) ? value[0] : value;
    return typeof first === 'string' ? first.split(',')[0].trim() : '';
  }
}
