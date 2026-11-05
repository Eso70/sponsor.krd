import { BadRequestException, Global, Logger, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { DataRetentionService } from './data-retention.service';

describe('DataRetentionService', () => {
  const policy = {
    communication_history_days: 365,
    automatic_cleanup: false,
    cleanup_hour_utc: 2,
    batch_size: 1000,
    updated_at: new Date().toISOString(),
  };

  it('returns the stored policy, eligible counts, and latest run', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [policy] })
      .mockResolvedValueOnce({
        rows: [{ communications: '5' }],
      })
      .mockResolvedValueOnce({ rows: [] });
    const service = new DataRetentionService({
      query,
    } as unknown as DatabaseService);

    await expect(service.getStatus()).resolves.toMatchObject({
      policy,
      eligible: {
        communications: 5,
      },
      last_run: null,
    });
  });

  it('requires explicit confirmation before a manual cleanup', async () => {
    const service = new DataRetentionService({} as DatabaseService);
    await expect(service.runManual('admin-id', false)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  describe('scheduler lifecycle', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('cancels the delayed startup and recurring checks when closed before startup', async () => {
      const query = jest.fn().mockResolvedValue({ rows: [policy] });
      const service = new DataRetentionService({
        query,
      } as unknown as DatabaseService);
      service.onModuleInit();
      await service.onModuleDestroy();
      await jest.advanceTimersByTimeAsync(30 * 60_000);
      expect(query).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('keeps the startup delay and recurring cadence while running', async () => {
      const query = jest.fn().mockResolvedValue({ rows: [policy] });
      const service = new DataRetentionService({
        query,
      } as unknown as DatabaseService);
      service.onModuleInit();
      await jest.advanceTimersByTimeAsync(9_999);
      expect(query).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      expect(query).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(15 * 60_000 - 10_000);
      expect(query).toHaveBeenCalledTimes(2);
      await service.onModuleDestroy();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('waits for an active scheduled check before Nest closes its database dependency', async () => {
      let release!: () => void;
      let poolClosed = false;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const query = jest.fn(async () => {
        await gate;
        if (poolClosed)
          throw new Error('Cannot use a pool after calling end on the pool');
        return { rows: [policy] };
      });
      const database = {
        query,
        onModuleDestroy: jest.fn(() => {
          poolClosed = true;
        }),
      };
      @Global()
      @Module({
        providers: [{ provide: DatabaseService, useValue: database }],
        exports: [DatabaseService],
      })
      class RetentionDatabaseModule {}
      const module = await Test.createTestingModule({
        imports: [RetentionDatabaseModule],
        providers: [DataRetentionService],
      }).compile();
      await module.init();
      await jest.advanceTimersByTimeAsync(10_000);
      expect(query).toHaveBeenCalledTimes(1);
      // Another interval must not overlap a check that has not finished.
      await jest.advanceTimersByTimeAsync(15 * 60_000);
      expect(query).toHaveBeenCalledTimes(1);
      const error = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const closing = module.close();
      await jest.advanceTimersByTimeAsync(0);
      expect(database.onModuleDestroy).not.toHaveBeenCalled();
      release();
      await closing;
      expect(poolClosed).toBe(true);
      await jest.advanceTimersByTimeAsync(30 * 60_000);
      expect(query).toHaveBeenCalledTimes(1);
      expect(error).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('finishes an active cleanup and records completion before shutdown resolves', async () => {
      jest.setSystemTime(new Date('2026-11-03T12:00:00Z'));
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let firstDeletion = true;
      const query = jest.fn(async (sql: string) => {
        if (sql.includes('FROM platform_data_retention_settings'))
          return {
            rows: [{ ...policy, automatic_cleanup: true, cleanup_hour_utc: 0 }],
          };
        if (sql.includes('INSERT INTO platform_data_retention_runs'))
          return { rows: [{ id: 'run-id' }] };
        if (sql.startsWith('DELETE') && firstDeletion) {
          firstDeletion = false;
          await gate;
        }
        return { rows: [], rowCount: 0 };
      });
      const service = new DataRetentionService({
        query,
      } as unknown as DatabaseService);
      service.onModuleInit();
      await jest.advanceTimersByTimeAsync(10_000);
      expect(firstDeletion).toBe(false);
      let closed = false;
      const closing = service.onModuleDestroy().then(() => {
        closed = true;
      });
      await jest.advanceTimersByTimeAsync(0);
      expect(closed).toBe(false);
      release();
      await closing;
      expect(query).toHaveBeenLastCalledWith(
        expect.stringContaining("SET status='completed'"),
        ['run-id', JSON.stringify({ communications: 0 })],
      );
      const calls = query.mock.calls.length;
      await jest.advanceTimersByTimeAsync(30 * 60_000);
      expect(query).toHaveBeenCalledTimes(calls);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('logs a failed scheduled check and retries at the next interval', async () => {
      const failure = new Error('Temporary database failure');
      const query = jest
        .fn()
        .mockRejectedValueOnce(failure)
        .mockResolvedValue({ rows: [policy] });
      const error = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const service = new DataRetentionService({
        query,
      } as unknown as DatabaseService);
      service.onModuleInit();
      await jest.advanceTimersByTimeAsync(10_000);
      expect(error).toHaveBeenCalledWith(
        'Scheduled data retention failed',
        failure,
      );
      await jest.advanceTimersByTimeAsync(15 * 60_000 - 10_000);
      expect(query).toHaveBeenCalledTimes(2);
      expect(error).toHaveBeenCalledTimes(1);
      await service.onModuleDestroy();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
