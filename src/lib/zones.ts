import { config } from '../config';

import { Bound } from './RunawayBounds';

export function isAllowed(xNew: number, yNew: number): boolean {
  const runawayBounds = config.runawayBounds;
  return runawayBounds.reduce((allowed, runawayBound) => {
    if (!allowed) {
      return false;
    }

    return !inBounds(runawayBound, xNew, yNew);
  }, true);
}

function inBounds(bound: Bound, x: number, y: number): boolean {
  return bound[0][0] <= x
    && bound[0][1] <= y
    && bound[1][0] >= x
    && bound[1][1] >= y;
}
