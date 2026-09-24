import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

const FRAME_BUDGET_MS = 8;

interface Task {
  rowIndex: number;
  reveal: () => void;
}

/**
 * Spreads the rendering of deferred cells over time, a row at a time. Rows render synchronously until
 * the current frame's budget is used up; the deferred cells of the rest show a placeholder and get
 * revealed here, visible rows first, in slices of the same budget. Slices run as separate tasks, so the browser paints and handles input
 * in between, like React's own scheduler.
 */
export class CellScheduler {
  private frameStart: number | undefined;
  private queue = new Set<Task>();
  private visible = { start: 0, end: Infinity };
  private isScheduled = false;
  private channel: MessageChannel | undefined;
  // Pessimistic until measured, so the first batch is a single row.
  private costPerRow = FRAME_BUDGET_MS;

  /** Called while rendering a row for the first time: whether it may render right away. */
  claim(): boolean {
    const now = performance.now();
    if (this.frameStart === undefined) {
      this.frameStart = now;
      requestAnimationFrame(() => {
        this.frameStart = undefined;
      });
    }
    return now - this.frameStart < FRAME_BUDGET_MS;
  }

  /** Returns a function that removes the task again, e.g. when its cell unmounts. */
  enqueue(task: Task) {
    this.queue.add(task);
    this.schedule();
    return () => {
      this.queue.delete(task);
    };
  }

  setVisibleRange(start: number, end: number) {
    this.visible = { start, end };
  }

  dispose() {
    this.queue.clear();
  }

  private schedule() {
    if (this.isScheduled) return;
    this.isScheduled = true;
    if (!this.channel) {
      this.channel = new MessageChannel();
      this.channel.port1.onmessage = this.run;
    }
    this.channel.port2.postMessage(null);
  }

  private isVisible(task: Task) {
    return task.rowIndex >= this.visible.start && task.rowIndex <= this.visible.end;
  }

  private next(count: number) {
    return [...this.queue]
      .sort(
        (a, b) => Number(this.isVisible(b)) - Number(this.isVisible(a)) || a.rowIndex - b.rowIndex,
      )
      .slice(0, count);
  }

  private run = () => {
    this.isScheduled = false;
    const start = performance.now();

    while (this.queue.size > 0) {
      const remaining = FRAME_BUDGET_MS - (performance.now() - start);
      if (remaining <= 0) break;

      const batch = this.next(Math.max(1, Math.floor(remaining / this.costPerRow)));
      const batchStart = performance.now();
      flushSync(() => {
        for (const task of batch) {
          this.queue.delete(task);
          task.reveal();
        }
      });
      const cost = (performance.now() - batchStart) / batch.length;
      this.costPerRow = this.costPerRow * 0.7 + cost * 0.3;
    }

    if (this.queue.size > 0) this.schedule();
  };
}

export const CellSchedulerContext = createContext<CellScheduler | null>(null);

export function useCellScheduler() {
  const [scheduler] = useState(() => new CellScheduler());
  useEffect(() => () => scheduler.dispose(), [scheduler]);
  return scheduler;
}

/** Whether a row with deferred cells renders them. Once revealed, it stays revealed. */
export function useReveal(deferred: boolean, rowIndex: number) {
  const scheduler = useContext(CellSchedulerContext);
  const [revealed, setRevealed] = useState(() => !deferred || !scheduler || scheduler.claim());
  const task = useRef<Task>({ rowIndex, reveal: () => setRevealed(true) });
  task.current.rowIndex = rowIndex;

  useEffect(() => {
    if (revealed || !scheduler) return;
    return scheduler.enqueue(task.current);
  }, [revealed, scheduler]);

  return revealed;
}
