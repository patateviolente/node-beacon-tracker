import { round } from '../utils/strings';

export type Point = [number, number];
export type Segment = [Point, Point];
export type Bound = [Point, Point];
export type Bounds = Bound[];
export type PointXY = {
  x: number,
  y: number,
};

/**
 * Handle an array of square bounds and enable to calculate nearest
 * distance to a limit
 */
export default class RunawayBounds {
  private bounds: Bounds;
  private segments: Segment[];

  constructor(bounds: Bounds) {
    this.bounds = bounds;
    this.segments = bounds.reduce((segments: Segment[], bound: Bound): Segment[] => {
      return segments.concat(boundToSegments(bound));
    }, []);
  }

  inZone(anyPoint: Point | PointXY): boolean {
    const point: Point = castPoint(anyPoint);

    return this.bounds.reduce((forbidden, bound): boolean => {
      return forbidden || inBound(bound, point);
    }, false);
  }

  distancefromZone(anyPoint: Point | PointXY): number {
    const point: Point = castPoint(anyPoint);
    const inZone = this.inZone(point);
    const borderDistance = Math.min(...this.segments.map((segment: Segment): number => {
      return distToSegment(point, segment[0], segment[1]);
    }));

    return round(borderDistance * (inZone ? -1 : 1));
  }
}

function castPoint(point: Point | PointXY): Point {
  if (point.hasOwnProperty('x') && point.hasOwnProperty('y')) {
    return [(point as PointXY).x, (point as PointXY).y];
  }

  return point as Point;
}

function inBound(bounds: Bound, position: Point): boolean {
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
 * @param z The bound
 */
function boundToSegments(z: Bound): Segment[] {
  const a: Point = [approxInfinity(z[0][0]), approxInfinity(z[0][1])];
  const c: Point = [approxInfinity(z[1][0]), approxInfinity(z[1][1])];
  const b: Point = [a[0], c[1]];
  const d: Point = [c[0], a[1]];

  return [[a, b], [b, c], [c, d], [a, d]];
}

function approxInfinity(number: number): number {
  if (number === Infinity) return 1000000;
  if (number === -Infinity) return -1000000;
  return number;
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const l2 = dist2(a, b);
  if (l2 === 0) {
    return dist2(p, a);
  }

  let t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2;
  t = Math.max(0, Math.min(1, t));

  return Math.sqrt(dist2(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]));
}

function dist2(v: Point, w: Point): number {
  return Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
}
