/**
 * Parse cookies from a cookie header string
 * @param {string} cookieHeader - The cookie header string
 * @returns {Object} - Object with cookie key-value pairs
 */
export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}
