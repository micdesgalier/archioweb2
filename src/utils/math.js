/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer between min and max
 */
export function randomInt(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') throw new TypeError('Both min and max must be numbers');
  if (min > max) throw new RangeError('min must be less than or equal to max');
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') throw new TypeError('All arguments must be numbers');
  if (min > max) throw new RangeError('min must be less than or equal to max');
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  if (typeof a !== 'number' || typeof b !== 'number' || typeof t !== 'number') throw new TypeError('All arguments must be numbers');
  return a + (b - a) * t;
}

export function degToRad(degrees) {
  if (typeof degrees !== 'number') throw new TypeError('Degrees must be a number');
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
  if (typeof radians !== 'number') throw new TypeError('Radians must be a number');
  return radians * (180 / Math.PI);
}

/**
 * Generate a random float between min and max
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random float between min and max
 */
export function randomFloat(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') throw new TypeError('Both min and max must be numbers');
  if (min > max) throw new RangeError('min must be less than or equal to max');
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random HSL color string
 * @param {string} saturation - Saturation percentage (e.g., '65%')
 * @param {string} lightness - Lightness percentage (e.g., '50%')
 * @returns {string} HSL color string
 */
export function randomHSL(saturation = '50%', lightness = '50%') {
  const hue = randomInt(0, 360);
  return `hsl(${hue}, ${saturation}, ${lightness})`;
}

/**
 * Euclidean modulo operation
 * @param {number} op1 - First operand
 * @param {number} op2 - Second operand (modulus)
 * @returns {number} Euclidean modulo result
 */
export function moduloEuclidian(op1, op2) {
  return ((op1 % op2) + op2) % op2;
}