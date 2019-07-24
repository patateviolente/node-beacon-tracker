import * as config from '../config';

export function isAllowed(xNew, yNew) {
  const runawayBounds = config.runawayBounds;
  return runawayBounds.reduce((allowed, runawayBound) => {
    if (!allowed) {
      return false;
    }

    return !inBounds(runawayBound, xNew, yNew);
  }, true);
}

function inBounds(bounds, x, y) {
  return bounds[0][0] <= x
    && bounds[0][1] <= y
    && bounds[1][0] >= x
    && bounds[1][1] >= y
}
