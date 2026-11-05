import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { Pool, type PoolClient } from 'pg';
import { readBaselineSql } from '../src/database/baseline';
import { BusinessOnboardingService } from '../src/onboarding/business-onboarding.service';

const databaseName = `sponsor_krd_signup_test_${process.pid}`;
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('signup session transaction (PostgreSQL)', () => {
  jest.setTimeout(60_000);
  let maintenance: Pool;
  let db: Pool;
  let service: BusinessOnboardingService;
  let adminId: string;
  let code: string;
  let email: string;
  let failure: 'none' | 'write' | 'ambiguous' | 'commit';
  const cache = new Map<string, unknown>();
  beforeAll(async () => {
    if (!/^sponsor_krd_signup_test_\d+$/.test(databaseName))
      throw new Error('Unsafe fixture database');
    const connection = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
    maintenance = new Pool({
      ...connection,
      database: process.env.DB_MAINTENANCE_NAME || 'postgres',
    });
    await maintenance.query(`CREATE DATABASE "${databaseName}"`);
    db = new Pool({ ...connection, database: databaseName });
    await db.query(
      readBaselineSql(join(__dirname, '../src/database/migrations')),
    );
    for (const filename of [
      '2026-09-22_user_preferred_locale.sql',
      '2026-09-28_user_preferred_locale_english.sql',
    ]) {
      await db.query(
        readFileSync(
          join(__dirname, '../src/database/migrations', filename),
          'utf8',
        ),
      );
    }
    adminId = (
      await db.query<{ id: string }>(
        "INSERT INTO platform_admins(username,name) VALUES('signup-test','Test') RETURNING id",
      )
    ).rows[0].id;
    const adapter = {
      query: db.query.bind(db),
      transaction: async <T>(work: (client: PoolClient) => Promise<T>) => {
        const client = await db.connect();
        try {
          await client.query('BEGIN');
          const result = await work(client);
          if (failure === 'commit') throw new Error('Fixture commit failure');
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
    };
    const redis = {
      isAvailable: () => true,
      isRateLimited: async () => false,
      get: async (key: string) => cache.get(key) ?? null,
      consume: async (key: string) => {
        const value = cache.get(key);
        cache.delete(key);
        return value ?? null;
      },
      del: async (key: string) => cache.delete(key),
      set: async (key: string, value: unknown) => {
        if (key.startsWith('signup:session:') && failure === 'write')
          return false;
        cache.set(key, value);
        return !(key.startsWith('signup:session:') && failure === 'ambiguous');
      },
    };
    service = new BusinessOnboardingService(
      adapter as never,
      redis as never,
      {
        exchangeCode: async () => ({
          subject: email,
          email,
          name: 'Applicant',
          avatarUrl: null,
        }),
      } as never,
      {} as never,
      {} as never,
      new ConfigService({ SESSION_SECRET: 'signup-transaction-test-secret' }),
      {
        sendBusinessSignupCode: async (_email: string, value: string) => {
          code = value;
        },
      } as never,
    );
  });
  afterAll(async () => {
    await db?.end();
    if (maintenance) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await maintenance.end();
    }
  });

  it.each(['email', 'google'] as const)(
    'rolls back %s signup on failed/ambiguous storage and commit, then permits a new verification',
    async (provider) => {
      for (const fault of ['write', 'ambiguous', 'commit'] as const) {
        cache.clear();
        email = `${randomUUID()}@example.test`;
        failure = 'none';
        const invitation = await service.createInvitation(adminId, email);
        const inviteToken = new URL(invitation.signupUrl).searchParams.get(
          'token',
        )!;
        const verify = async () => {
          if (provider === 'email') {
            const challenge = await service.requestSignupEmailCode(
              inviteToken,
              email,
            );
            return service.verifySignupEmailCode({
              challengeId: challenge.challengeId,
              code,
              ipAddress: '127.0.0.1',
              userAgent: 'test',
            });
          }
          const state = randomUUID();
          cache.set(`oauth:state:${hash(state)}`, {
            mode: 'signup',
            invitationId: invitation.id,
            nonce: 'nonce',
            verifier: 'verifier',
          });
          return service.finishGoogleCallback('verified-code', state);
        };
        failure = fault;
        await expect(verify()).rejects.toMatchObject(
          fault === 'commit'
            ? { message: 'Fixture commit failure' }
            : { status: 503 },
        );
        expect(
          (
            await db.query<{ consumed_at: Date | null }>(
              'SELECT consumed_at FROM business_signup_invitations WHERE id=$1',
              [invitation.id],
            )
          ).rows[0].consumed_at,
        ).toBeNull();
        expect(
          (await db.query('SELECT id FROM users WHERE email=$1', [email])).rows,
        ).toHaveLength(0);
        expect(
          (
            await db.query(
              'SELECT id FROM business_signup_applications WHERE invitation_id=$1',
              [invitation.id],
            )
          ).rows,
        ).toHaveLength(0);
        expect(
          [...cache.keys()].filter((key) => key.startsWith('signup:session:')),
        ).toEqual([]);
        failure = 'none';
        const result = await verify();
        if (!('sessionToken' in result))
          throw new Error('Expected a signup session');
        expect(await service.application(result.sessionToken)).toMatchObject({
          ownerEmail: email,
          status: 'draft',
        });
        expect(
          (
            await db.query<{ consumed_at: Date | null }>(
              'SELECT consumed_at FROM business_signup_invitations WHERE id=$1',
              [invitation.id],
            )
          ).rows[0].consumed_at,
        ).not.toBeNull();
      }
    },
  );
});
