import Circle from './Circle.js';

export default class CircleInFlatTorus extends Circle {

  update(dt, width, height) {
    super.update(dt);

    if (this.position.x - this.radius > width) {
      this.position.x = 0 - this.radius;
    } else if (this.position.x < 0 - this.radius) {
      this.position.x = width + this.radius;
    }

    if (this.position.y - this.radius > height) {
      this.position.y = 0 - this.radius;
    } else if (this.position.y < 0 - this.radius) {
      this.position.y = height + this.radius;
    }
  }

}