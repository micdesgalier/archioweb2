export default class Vector2 {

  constructor({x = 0, y = 0} = {}) {
    this.x = x;
    this.y = y;
  }

  static isVector2(value) {
    return value instanceof Vector2;
  }

  static add(a, b) {
    if (!Vector2.isVector2(a) || !Vector2.isVector2(b)) throw new TypeError('Both arguments must be Vector2 instances');
    return new Vector2({ x: a.x + b.x, y: a.y + b.y });
  }

  static multiply(vector, scalar) {
    if (!Vector2.isVector2(vector)) throw new TypeError('First argument must be a Vector2 instance');
    if (typeof scalar !== 'number') throw new TypeError('Second argument must be a number');
    return new Vector2({ x: vector.x * scalar, y: vector.y * scalar });
  }

  static subtract(a, b) {
    if (!Vector2.isVector2(a) || !Vector2.isVector2(b)) throw new TypeError('Both arguments must be Vector2 instances');
    return new Vector2({ x: a.x - b.x, y: a.y - b.y });
  }

  static distance(a, b) {
    if (!Vector2.isVector2(a) || !Vector2.isVector2(b)) throw new TypeError('Both arguments must be Vector2 instances');
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  static normalize(vector) {
    if (!Vector2.isVector2(vector)) throw new TypeError('Argument must be a Vector2 instance');
    const len = Math.hypot(vector.x, vector.y);
    if (len > 0) {
      return new Vector2({ x: vector.x / len, y: vector.y / len });
    }
    return new Vector2({ x: 0, y: 0 });
  }

  static fromAngle(angle = 0, length = 1) {
    if (typeof angle !== 'number') throw new TypeError('Angle must be a number');
    if (typeof length !== 'number') throw new TypeError('Length must be a number');
    return new Vector2({
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length
    });
  }

  static angleBetween(a, b) {
    if (!Vector2.isVector2(a) || !Vector2.isVector2(b)) throw new TypeError('Both arguments must be Vector2 instances');
    const dotProduct = a.x * b.x + a.y * b.y;
    const lengthA = Math.hypot(a.x, a.y);
    const lengthB = Math.hypot(b.x, b.y);

    if (lengthA === 0 || lengthB === 0) return 0;
    const cosTheta = dotProduct / (lengthA * lengthB);
    const clampedCos = Math.max(-1, Math.min(1, cosTheta));
    return Math.acos(clampedCos);
  }

  static signedAngleBetween(a, b) {
    if (!Vector2.isVector2(a) || !Vector2.isVector2(b)) throw new TypeError('Both arguments must be Vector2 instances');
    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);
    let diff = angleB - angleA;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return diff;
  }

  static angleTowards(from, to) {
    if (!Vector2.isVector2(from) || !Vector2.isVector2(to)) throw new TypeError('Both arguments must be Vector2 instances');
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.atan2(dy, dx);
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  setAngle(angle) {
    if (typeof angle !== 'number') throw new TypeError('Angle must be a number');
    const currentLength = this.length();
    this.x = Math.cos(angle) * currentLength;
    this.y = Math.sin(angle) * currentLength;
    return this;
  }

  #applyResult(result) {
    this.x = result.x;
    this.y = result.y;
    return this;
  }

  add(other) {
    return this.#applyResult(this.constructor.add(this, other));
  }

  multiply(scalar) {
    return this.#applyResult(this.constructor.multiply(this, scalar));
  }

  subtract(other) {
    return this.#applyResult(this.constructor.subtract(this, other));
  }

  normalize() {
    return this.#applyResult(this.constructor.normalize(this));
  }

  toString() {
    return `Vector2(${this.x}, ${this.y})`;
  }

}