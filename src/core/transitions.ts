/**
 * Transitions - State machine for CSS transitions with proper cancellation
 *
 * Manages enter/leave transitions with cancellation.
 * Prevents timer conflicts on rapid state changes.
 */

type TransitionState = 'idle' | 'entering' | 'entered' | 'leaving' | 'left';

interface TransitionConfig {
  duration?: number;
  enterClass?: string;
  enterFromClass?: string;
  enterToClass?: string;
  leaveClass?: string;
  leaveFromClass?: string;
  leaveToClass?: string;
  onEnter?: () => void;
  onEntered?: () => void;
  onLeave?: () => void;
  onLeft?: () => void;
}

interface Transition {
  readonly state: TransitionState;
  enter(): Promise<void>;
  leave(): Promise<void>;
  toggle(show?: boolean): Promise<void>;
  cancel(): void;
  destroy(): void;
}

const getTransitionDuration = (element: HTMLElement): number => {
  const style = getComputedStyle(element);
  const duration = style.transitionDuration || '0s';
  const delay = style.transitionDelay || '0s';

  const parseDuration = (value: string): number => {
    const num = parseFloat(value);
    return value.endsWith('ms') ? num : num * 1000;
  };

  // Handle multiple values (e.g., "0.3s, 0.2s")
  const durations = duration.split(',').map((d) => parseDuration(d.trim()));
  const delays = delay.split(',').map((d) => parseDuration(d.trim()));

  const maxDuration = Math.max(...durations);
  const maxDelay = Math.max(...delays);

  return maxDuration + maxDelay;
};

export function createTransition(
  element: HTMLElement,
  config: TransitionConfig = {}
): Transition {
  const {
    duration,
    enterClass = 'enter',
    enterFromClass = 'enter-from',
    enterToClass = 'enter-to',
    leaveClass = 'leave',
    leaveFromClass = 'leave-from',
    leaveToClass = 'leave-to',
    onEnter,
    onEntered,
    onLeave,
    onLeft,
  } = config;

  let currentState: TransitionState = 'idle';
  let abortController: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  const cleanup = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Remove all transition classes
    element.classList.remove(
      enterClass,
      enterFromClass,
      enterToClass,
      leaveClass,
      leaveFromClass,
      leaveToClass
    );
  };

  const cancelCurrentTransition = (): void => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    cleanup();
  };

  const waitForTransition = (signal: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transitionDuration = duration ?? getTransitionDuration(element);

      if (transitionDuration === 0) {
        resolve();
        return;
      }

      const handleAbort = (): void => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        reject(new DOMException('Transition aborted', 'AbortError'));
      };

      if (signal.aborted) {
        handleAbort();
        return;
      }

      signal.addEventListener('abort', handleAbort, { once: true });

      timeoutId = setTimeout(() => {
        timeoutId = null;
        signal.removeEventListener('abort', handleAbort);
        resolve();
      }, transitionDuration);
    });
  };

  const transition: Transition = {
    get state(): TransitionState {
      return currentState;
    },

    async enter(): Promise<void> {
      if (destroyed) return;

      // Cancel any in-progress transition
      cancelCurrentTransition();

      abortController = new AbortController();
      const { signal } = abortController;

      currentState = 'entering';
      onEnter?.();

      // Setup enter transition
      element.classList.add(enterClass, enterFromClass);

      // Force reflow to ensure transition starts
      void element.offsetHeight;

      // Start transition
      element.classList.remove(enterFromClass);
      element.classList.add(enterToClass);

      try {
        await waitForTransition(signal);

        if (!signal.aborted) {
          currentState = 'entered';
          cleanup();
          onEntered?.();
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          // Transition was cancelled, this is expected
          return;
        }
        throw e;
      } finally {
        if (abortController?.signal === signal) {
          abortController = null;
        }
      }
    },

    async leave(): Promise<void> {
      if (destroyed) return;

      // Cancel any in-progress transition
      cancelCurrentTransition();

      abortController = new AbortController();
      const { signal } = abortController;

      currentState = 'leaving';
      onLeave?.();

      // Setup leave transition
      element.classList.add(leaveClass, leaveFromClass);

      // Force reflow
      void element.offsetHeight;

      // Start transition
      element.classList.remove(leaveFromClass);
      element.classList.add(leaveToClass);

      try {
        await waitForTransition(signal);

        if (!signal.aborted) {
          currentState = 'left';
          cleanup();
          onLeft?.();
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return;
        }
        throw e;
      } finally {
        if (abortController?.signal === signal) {
          abortController = null;
        }
      }
    },

    async toggle(show?: boolean): Promise<void> {
      const shouldShow = show ?? (currentState === 'idle' || currentState === 'left' || currentState === 'leaving');
      return shouldShow ? this.enter() : this.leave();
    },

    cancel(): void {
      cancelCurrentTransition();
      currentState = 'idle';
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      cancelCurrentTransition();
      currentState = 'idle';
    },
  };

  return transition;
}

export type { Transition, TransitionConfig, TransitionState };
