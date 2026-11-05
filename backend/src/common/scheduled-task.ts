/** Owns timer cancellation and drains work before its database dependency closes. */
export class ScheduledTask {
  private interval?: NodeJS.Timeout;
  private startup?: NodeJS.Timeout;
  private running?: Promise<void>;
  private stopped = true;

  constructor(
    private readonly work: () => Promise<void>,
    private readonly onError: (error: unknown) => void,
  ) {}

  start(intervalMs: number, startupDelayMs = 0): void {
    this.stopped = false;
    this.interval = setInterval(() => this.run(), intervalMs);
    this.interval.unref();
    if (startupDelayMs > 0) {
      this.startup = setTimeout(() => this.run(), startupDelayMs);
      this.startup.unref();
    } else this.run();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.interval) clearInterval(this.interval);
    if (this.startup) clearTimeout(this.startup);
    this.interval = undefined;
    this.startup = undefined;
    await this.running;
  }

  private run(): void {
    if (this.stopped || this.running) return;
    this.running = (async () => this.work())()
      .catch(this.onError)
      .finally(() => {
        this.running = undefined;
      });
  }
}
