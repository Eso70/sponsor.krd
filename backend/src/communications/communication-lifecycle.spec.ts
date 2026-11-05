import { Global, Logger, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommunicationService } from './communication.service';
import { DatabaseService } from '../database/database.service';

describe('communications scheduler lifecycle', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('finishes startup work before its database closes and cancels future ticks', async () => {
    jest.useFakeTimers();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let closed = false;
    const query = jest.fn(async () => {
      await gate;
      if (closed) throw new Error('Pool closed');
      return { rows: [] };
    });
    const database = {
      query,
      onModuleDestroy: jest.fn(() => {
        closed = true;
      }),
    };
    @Global()
    @Module({
      providers: [{ provide: DatabaseService, useValue: database }],
      exports: [DatabaseService],
    })
    class FixtureDatabaseModule {}
    const metrics = {
      registerWorker: jest.fn(),
      recordWorkerRun: jest.fn(),
      recordWorkerJob: jest.fn(),
    };
    const module = await Test.createTestingModule({
      imports: [FixtureDatabaseModule],
      providers: [
        {
          provide: CommunicationService,
          inject: [DatabaseService],
          useFactory: (db: DatabaseService) =>
            new CommunicationService(db, {} as never, metrics as never),
        },
      ],
    }).compile();
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    await module.init();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(query).toHaveBeenCalledTimes(1);
    const closing = module.close();
    await jest.advanceTimersByTimeAsync(0);
    expect(closed).toBe(false);
    release();
    await closing;
    expect(closed).toBe(true);
    expect(query).toHaveBeenCalledTimes(2);
    expect(metrics.recordWorkerRun).toHaveBeenCalledWith(
      'communication-scheduler',
      expect.any(Number),
      true,
    );
    await jest.advanceTimersByTimeAsync(120_000);
    expect(query).toHaveBeenCalledTimes(2);
    expect(warn).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
