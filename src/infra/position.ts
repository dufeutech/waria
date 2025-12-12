/**
 * Position - Floating element positioning
 *
 * Uses scheduler for batched measurements.
 * Handles viewport constraints and auto-flipping.
 */

import { scheduler } from '../core/scheduler';
import { cache } from '../core/cache';

export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Alignment = 'start' | 'center' | 'end';

export interface PositionConfig {
  reference: HTMLElement;
  floating: HTMLElement;
  placement?: Placement;
  offset?: number;
  flip?: boolean;
  constrain?: boolean;
  boundary?: HTMLElement | 'viewport';
}

export interface Position {
  x: number;
  y: number;
  placement: Placement;
}

const parsePlacement = (placement: Placement): { side: Side; alignment: Alignment } => {
  const [side, alignment = 'center'] = placement.split('-') as [Side, Alignment?];
  return { side, alignment: alignment as Alignment };
};

const getOppositeSide = (side: Side): Side => {
  const opposites: Record<Side, Side> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  return opposites[side];
};

const getOppositeAlignment = (alignment: Alignment): Alignment => {
  const opposites: Record<Alignment, Alignment> = {
    start: 'end',
    center: 'center',
    end: 'start',
  };
  return opposites[alignment];
};

/**
 * Calculate position for a floating element
 */
export function calculatePosition(config: PositionConfig): Position {
  const {
    reference,
    floating,
    placement = 'bottom',
    offset = 8,
    flip = true,
    constrain = true,
    boundary = 'viewport',
  } = config;

  const refRect = cache.dimensions.get(reference);
  const floatRect = cache.dimensions.get(floating);
  const viewport = cache.viewport;

  const boundaryRect = boundary === 'viewport'
    ? { top: 0, left: 0, right: viewport.width, bottom: viewport.height }
    : cache.dimensions.get(boundary);

  let { side, alignment } = parsePlacement(placement);

  // Calculate initial position
  const calculateCoords = (s: Side, a: Alignment): { x: number; y: number } => {
    let x = 0;
    let y = 0;

    // Position along main axis
    switch (s) {
      case 'top':
        y = refRect.top - floatRect.height - offset;
        break;
      case 'bottom':
        y = refRect.bottom + offset;
        break;
      case 'left':
        x = refRect.left - floatRect.width - offset;
        break;
      case 'right':
        x = refRect.right + offset;
        break;
    }

    // Position along cross axis
    if (s === 'top' || s === 'bottom') {
      switch (a) {
        case 'start':
          x = refRect.left;
          break;
        case 'center':
          x = refRect.left + (refRect.width - floatRect.width) / 2;
          break;
        case 'end':
          x = refRect.right - floatRect.width;
          break;
      }
    } else {
      switch (a) {
        case 'start':
          y = refRect.top;
          break;
        case 'center':
          y = refRect.top + (refRect.height - floatRect.height) / 2;
          break;
        case 'end':
          y = refRect.bottom - floatRect.height;
          break;
      }
    }

    return { x, y };
  };

  let coords = calculateCoords(side, alignment);
  let finalPlacement = placement;

  // Flip if overflows
  if (flip) {
    const overflows = {
      top: coords.y < boundaryRect.top,
      bottom: coords.y + floatRect.height > boundaryRect.bottom,
      left: coords.x < boundaryRect.left,
      right: coords.x + floatRect.width > boundaryRect.right,
    };

    // Flip main axis
    if ((side === 'top' && overflows.top) || (side === 'bottom' && overflows.bottom)) {
      const oppositeSide = getOppositeSide(side);
      const newCoords = calculateCoords(oppositeSide, alignment);
      const newOverflow = oppositeSide === 'top'
        ? newCoords.y < boundaryRect.top
        : newCoords.y + floatRect.height > boundaryRect.bottom;

      if (!newOverflow) {
        side = oppositeSide;
        coords = newCoords;
      }
    }

    if ((side === 'left' && overflows.left) || (side === 'right' && overflows.right)) {
      const oppositeSide = getOppositeSide(side);
      const newCoords = calculateCoords(oppositeSide, alignment);
      const newOverflow = oppositeSide === 'left'
        ? newCoords.x < boundaryRect.left
        : newCoords.x + floatRect.width > boundaryRect.right;

      if (!newOverflow) {
        side = oppositeSide;
        coords = newCoords;
      }
    }

    // Flip cross axis alignment
    if ((alignment === 'start' || alignment === 'end') && (overflows.left || overflows.right)) {
      if (side === 'top' || side === 'bottom') {
        const oppositeAlignment = getOppositeAlignment(alignment);
        const newCoords = calculateCoords(side, oppositeAlignment);
        const newOverflow = oppositeAlignment === 'start'
          ? newCoords.x < boundaryRect.left
          : newCoords.x + floatRect.width > boundaryRect.right;

        if (!newOverflow) {
          alignment = oppositeAlignment;
          coords = newCoords;
        }
      }
    }

    finalPlacement = alignment === 'center' ? side : `${side}-${alignment}` as Placement;
  }

  // Constrain to boundary
  if (constrain) {
    coords.x = Math.max(boundaryRect.left, Math.min(coords.x, boundaryRect.right - floatRect.width));
    coords.y = Math.max(boundaryRect.top, Math.min(coords.y, boundaryRect.bottom - floatRect.height));
  }

  return {
    x: Math.round(coords.x),
    y: Math.round(coords.y),
    placement: finalPlacement,
  };
}

/**
 * Apply position to a floating element
 */
export function applyPosition(floating: HTMLElement, position: Position): void {
  scheduler.write(() => {
    floating.style.position = 'fixed';
    floating.style.left = `${position.x}px`;
    floating.style.top = `${position.y}px`;
  });
}

/**
 * One-time positioning
 */
export function position(config: PositionConfig): Position {
  const pos = calculatePosition(config);
  applyPosition(config.floating, pos);
  return pos;
}

/**
 * Auto-updating position (returns cleanup function)
 */
export function autoPosition(config: PositionConfig): () => void {
  let rafId: number | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const update = (): void => {
    cache.dimensions.invalidate(config.reference);
    cache.dimensions.invalidate(config.floating);
    position(config);
  };

  const scheduleUpdate = (): void => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      update();
    });
  };

  // Initial position
  update();

  // Watch for scroll
  window.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });

  // Watch for resize
  window.addEventListener('resize', scheduleUpdate, { passive: true });

  // Watch for element size changes
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(config.reference);
    resizeObserver.observe(config.floating);
  }

  // Return cleanup
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    window.removeEventListener('scroll', scheduleUpdate, { capture: true });
    window.removeEventListener('resize', scheduleUpdate);
    resizeObserver?.disconnect();
  };
}
