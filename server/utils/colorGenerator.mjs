import { createHash } from 'crypto';

const userColors = [
  '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#f1c40f', '#e91e63', '#009688',
  '#ff5722', '#8bc34a', '#4caf50', '#2196f3',
  '#9c27b0'
];

/**
 * Generate a consistent color for a username using MD5 hash
 * @param {string} username - The username to generate a color for
 * @returns {string} Hex color code
 */
export function getColorForUsername(username) {
  const hash = createHash('md5').update(username).digest();
  const index = hash[0] % userColors.length;
  return userColors[index];
}
