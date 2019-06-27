class RunawayBounds {
  constructor(bounds) {
    this.bounds = bounds;
  }

  positionAllowed(position) {
    return !this.bounds.reduce((forbidden, bound) => {
      return forbidden || inBound(bound, position);
    }, false);
  }
}

function inBound(bounds, position) {
  return position.x >= bounds[0][0]
    && position.x <= bounds[1][0]
    && position.y >= bounds[0][1]
    && position.y <= bounds[1][1];
}

module.exports = RunawayBounds;
module.exports.inBound = inBound;
