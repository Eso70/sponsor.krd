import { ExecutionContext, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { BusinessFormsController } from './business-forms.controller';
import { PlatformFormsController } from './platform-forms.controller';
import { FormsService } from './forms.service';
import { StorageService } from '../storage/storage.service';
import { BusinessGuard } from '../auth/business.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { RequestBoundaryPipe } from '../common/request-boundary.pipe';

describe('form response HTTP pagination', () => {
  let app: NestFastifyApplication;
  const id = 'b010aa10-cc32-4eb4-91db-2d27315e0831';
  const forms = {
    titleAvailability: jest
      .fn()
      .mockResolvedValue({ slug: 'new-title', available: true }),
    deleteSubmissions: jest.fn().mockResolvedValue({ deleted: 2 }),
    submissions: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    platformOwner: jest.fn().mockResolvedValue('platform-owner'),
  };
  beforeAll(async () => {
    const guard = {
      canActivate(context: ExecutionContext) {
        context.switchToHttp().getRequest<{ user: { id: string } }>().user = {
          id: 'business-owner',
        };
        return true;
      },
    };
    const module = await Test.createTestingModule({
      controllers: [BusinessFormsController, PlatformFormsController],
      providers: [
        { provide: FormsService, useValue: forms },
        { provide: StorageService, useValue: {} },
      ],
    })
      .overrideGuard(BusinessGuard)
      .useValue(guard)
      .overrideGuard(PlatformAdminGuard)
      .useValue(guard)
      .overrideGuard(AuthorizationGuard)
      .useValue(guard)
      .compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(
      new RequestBoundaryPipe(),
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());
  it.each([
    ['/api/forms', 'business-owner'],
    ['/api/platform/forms', 'platform-owner'],
  ])(
    'checks title availability using the resolved owner in %s',
    async (base, owner) => {
      const response = await app.inject({
        method: 'GET',
        url: `${base}/title-availability?title=New%20title&excludeId=${id}`,
      });
      expect(response.statusCode).toBe(200);
      expect(forms.titleAvailability).toHaveBeenLastCalledWith(
        owner,
        'New title',
        id,
      );
      forms.titleAvailability.mockClear();
      for (const query of [
        'title=',
        'title=' + 'x'.repeat(101),
        'title=Hello&excludeId=bad',
        'title=Hello&owner=foreign',
      ]) {
        const invalid = await app.inject({
          method: 'GET',
          url: `${base}/title-availability?${query}`,
        });
        expect(invalid.statusCode).toBe(400);
        expect(forms.titleAvailability).not.toHaveBeenCalled();
      }
    },
  );
  it.each(['/api/forms', '/api/platform/forms'])(
    'validates and forwards search, dates and bounded sizes for %s',
    async (base) => {
      const valid = await app.inject({
        method: 'GET',
        url: `${base}/${id}/submissions?page=1&pageSize=100&q=customer&from=2026-10-01&to=2026-10-10&before=2026-10-10T12%3A00%3A00Z`,
      });
      expect(valid.statusCode).toBe(200);
      expect(forms.submissions).toHaveBeenLastCalledWith(
        expect.any(String),
        id,
        1,
        expect.objectContaining({
          pageSize: 100,
          q: 'customer',
          from: '2026-10-01',
          to: '2026-10-10',
          before: '2026-10-10T12:00:00Z',
        }),
      );
      forms.submissions.mockClear();
      for (const query of [
        'pageSize=500',
        'from=2026-02-30',
        'to=bad',
        'before=bad',
        'q=' + 'x'.repeat(101),
        'owner=foreign',
      ]) {
        const invalid = await app.inject({
          method: 'GET',
          url: `${base}/${id}/submissions?${query}`,
        });
        expect(invalid.statusCode).toBe(400);
        expect(forms.submissions).not.toHaveBeenCalled();
      }
    },
  );
  it.each([
    ['/api/forms', 'business-owner'],
    ['/api/platform/forms', 'platform-owner'],
  ])(
    'accepts default, first and subsequent response pages in %s',
    async (base, owner) => {
      for (const [query, page] of [
        ['', 0],
        ['?page=0', 0],
        ['?page=1', 1],
      ] as const) {
        const response = await app.inject({
          method: 'GET',
          url: `${base}/${id}/submissions${query}`,
        });
        expect(response.statusCode).toBe(200);
        expect(forms.submissions).toHaveBeenLastCalledWith(
          owner,
          id,
          page,
          expect.objectContaining({ q: '', pageSize: 20 }),
        );
      }
    },
  );
  it.each(['-1', 'abc', '1.5', '1000000', '0&page=1'])(
    'rejects invalid response page %s before querying',
    async (page) => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/forms/${id}/submissions?page=${page}`,
      });
      expect(response.statusCode).toBe(400);
      expect(forms.submissions).not.toHaveBeenCalled();
    },
  );
  it.each(['/api/forms', '/api/platform/forms'])(
    'deletes only through a valid owner-scoped form route: %s',
    async (base) => {
      const result = await app.inject({
        method: 'DELETE',
        url: `${base}/${id}/submissions`,
      });
      expect(result.statusCode).toBe(200);
      expect(forms.deleteSubmissions).toHaveBeenLastCalledWith(
        base.includes('platform') ? 'platform-owner' : 'business-owner',
        id,
      );
      forms.deleteSubmissions.mockClear();
      const invalid = await app.inject({
        method: 'DELETE',
        url: `${base}/not-a-uuid/submissions`,
      });
      expect(invalid.statusCode).toBe(400);
      expect(forms.deleteSubmissions).not.toHaveBeenCalled();
    },
  );
});
