export class Queue {
  private q = new Array<{ job: () => Promise<any>; resolve: (value: any) => void; reject: (reason?: any) => void }>();
  private isRunning = false;

  run<T>(job: () => Promise<T>, replace?: boolean) {
    return new Promise<T>((resolve, reject) => {
      if (replace) {
        this.q = [];
      }
      this.q.push({ job, resolve, reject });

      if (!this.isRunning) this.start();
    });
  }

  private async start() {
    this.isRunning = true;

    let next;
    while ((next = this.q.shift())) {
      try {
        const result = await next.job();
        next.resolve(result);
      } catch (e) {
        next.reject(e);
      }
    }

    this.isRunning = false;
  }
}
