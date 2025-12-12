/**
 * Scheduler - RAF-based task scheduling
 *
 * Batches DOM reads and writes to prevent layout thrashing.
 * All operations execute in RAF callbacks for smooth animations.
 */

type ReadCallback<T> = () => T;
type WriteCallback = () => void;

interface SchedulerInstance {
  read<T>(fn: ReadCallback<T>): Promise<T>;
  write(fn: WriteCallback): void;
  measure<T>(read: ReadCallback<T>, write: (value: T) => void): void;
  nextFrame(fn: () => void): () => void;
  idle(fn: () => void, timeout?: number): () => void;
  flush(): void;
}

interface ReadTask<T> {
  fn: ReadCallback<T>;
  resolve: (value: T) => void;
}

const createScheduler = (): SchedulerInstance => {
  const reads: Array<ReadTask<unknown>> = [];
  const writes: WriteCallback[] = [];
  let scheduled = false;
  let rafId: number | null = null;

  const flush = (): void => {
    scheduled = false;
    rafId = null;

    // Execute all reads first (measure phase)
    const currentReads = reads.splice(0);
    for (const { fn, resolve } of currentReads) {
      try {
        resolve(fn());
      } catch (e) {
        console.error('[Scheduler] Read error:', e);
      }
    }

    // Then execute all writes (mutate phase)
    const currentWrites = writes.splice(0);
    for (const write of currentWrites) {
      try {
        write();
      } catch (e) {
        console.error('[Scheduler] Write error:', e);
      }
    }
  };

  const schedule = (): void => {
    if (scheduled) return;
    scheduled = true;
    rafId = requestAnimationFrame(flush);
  };

  return {
    /**
     * Schedule a DOM read operation.
     * Returns a promise that resolves with the read value.
     */
    read<T>(fn: ReadCallback<T>): Promise<T> {
      return new Promise((resolve) => {
        reads.push({ fn, resolve } as ReadTask<unknown>);
        schedule();
      });
    },

    /**
     * Schedule a DOM write operation.
     * Writes are batched and executed after all reads.
     */
    write(fn: WriteCallback): void {
      writes.push(fn);
      schedule();
    },

    /**
     * Combined read-then-write operation.
     * Reads in the read phase, then writes in the write phase.
     */
    measure<T>(read: ReadCallback<T>, write: (value: T) => void): void {
      this.read(read).then(write);
    },

    /**
     * Schedule callback for next animation frame.
     * Returns a cleanup function to cancel.
     */
    nextFrame(fn: () => void): () => void {
      const id = requestAnimationFrame(fn);
      return () => cancelAnimationFrame(id);
    },

    /**
     * Schedule callback for browser idle time.
     * Falls back to setTimeout if requestIdleCallback unavailable.
     */
    idle(fn: () => void, timeout = 1000): () => void {
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(fn, { timeout });
        return () => cancelIdleCallback(id);
      }
      const id = setTimeout(fn, timeout);
      return () => clearTimeout(id);
    },

    /**
     * Immediately flush all pending operations.
     * Useful for testing or forcing immediate updates.
     */
    flush(): void {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      flush();
    },
  };
};

export const scheduler = createScheduler();
export type { SchedulerInstance };
