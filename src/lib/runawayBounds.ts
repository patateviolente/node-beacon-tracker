const round = require('./utils').round;

/**
 * Handle an array of square bounds and enable to calculate nearest
 * distance to a limit
 */
class RunawayBounds {
  /**
   * @param {Bound[]} bounds
   */
  constructor(bounds) {
    this.bounds = bounds;
    this.segments = bounds.reduce((segments, bound) => {
      return segments.concat(boundsToSegments(bound));
    }, []);
  }

  inZone(point) {
    return this.bounds.reduce((forbidden, bound) => {
      return forbidden || inBound(bound, stdPoint(point));
    }, false);
  }

  /**
   * Rounded distance to a zone
   * @param {Point} point
   * @return {Number} Negative distance if the point is inside a zone
   */
  distancefromZone(point) {
    const inZone = this.inZone(point);
    const borderDistance = Math.min(...this.segments.map((segment) => {
      return distToSegment(stdPoint(point), segment[0], segment[1]);
    }));

    return round(borderDistance * (inZone ? -1 : 1));
  }
}

/**
 * @param point
 * @return {Point}
 */
function stdPoint(point) {
  return (point.hasOwnProperty('x') && point.hasOwnProperty('y'))
    ? [point.x, point.y]
    : point;
}

function inBound(bounds, position) {
  const xPos = [bounds[0][0], bounds[1][0]];
  const yPos = [bounds[0][1], bounds[1][1]];

  return position[0] >= Math.min(...xPos)
    && position[0] <= Math.max(...xPos)
    && position[1] >= Math.min(...yPos)
    && position[1] <= Math.max(...yPos);
}

/**
 * Create segments from a square defined by two points.
 * Infinite values are set to a bug number
 * @param z
 * @return {*[][][]}
 */
function boundsToSegments(z) {
  const a = [approxInfinity(z[0][0]), approxInfinity(z[0][1])];
  const c = [approxInfinity(z[1][0]), approxInfinity(z[1][1])];
  const b = [a[0], c[1]];
  const d = [c[0], a[1]];
  return [[a, b], [b, c], [c, d], [a, d]]
}

function approxInfinity(number) {
  if (number === Infinity) return 1000000;
  if (number === -Infinity) return -1000000;
  return number;
}

/**
 * Distance from a point to a segment
 * @param {Point} p Point
 * @param {Point} a Segment point A
 * @param {Point} b Segment Point B
 * @return {number|*}
 */
function distToSegment(p, a, b) {
  const l2 = dist2(a, b);
  if (l2 === 0) return dist2(p, a);

  let t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2;
  t = Math.max(0, Math.min(1, t));

  return Math.sqrt(dist2(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]));
}

function dist2(v, w) {
  return Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
}

module.exports = RunawayBounds;
module.exports.inBound = inBound;

/**
 * Square bounds, defined by two opposite point
 * @typedef {[Point, Point]} Bound
 */

/**
 * Simple point
 * @typedef {[Number, Number]} Point
 */
