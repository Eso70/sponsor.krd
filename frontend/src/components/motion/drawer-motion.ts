/** Shared drawer timing: responsive entry, a shorter exit, and a quiet backdrop. */
export const DRAWER_MOTION = {
  enter: 0.32,
  exit: 0.22,
  backdrop: 0.2,
  exitEase: [0.4, 0, 1, 1] as const,
};
