/** Motion tokens — durations (ms) and easing curves. */
export const duration = {
  instant: 0,
  fast: 150,
  base: 220,
  slow: 320,
  slower: 480,
} as const;

/**
 * Cubic-bezier control points suited for RN's `Easing.bezier(...)`.
 * Consumers should call `Easing.bezier(...easing.standard)`.
 */
export const easing = {
  standard: [0.2, 0, 0, 1] as const,
  emphasized: [0.3, 0, 0, 1] as const,
  decelerate: [0, 0, 0, 1] as const,
  accelerate: [0.3, 0, 1, 1] as const,
} as const;

export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
