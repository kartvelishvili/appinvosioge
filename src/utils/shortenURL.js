/**
 * Returns the original URL without shortening (TinyURL disabled as requested)
 * @param {string} url - The long URL
 * @returns {Promise<string>} The original URL
 */
export const shortenURL = async (url) => {
  // URL shortening disabled per user request
  // Returns the full direct link
  return Promise.resolve(url);
};