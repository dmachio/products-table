/**
 * Formats a number as a USD currency string.
 * @param {number} price - The price to format.
 * @returns {string} The formatted price string.
 */
export function formatPrice(price) {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Gets a query parameter from URLSearchParams, or returns a fallback value if not present.
 * @param {URLSearchParams} searchParams - The URLSearchParams object.
 * @param {string} key - The parameter key to retrieve.
 * @param {any} fallback - The fallback value if the key is not present.
 * @returns {string|any} The parameter value or the fallback.
 */
export function getQueryParam(searchParams, key, fallback) {
  const value = searchParams.get(key);
  return value !== null ? value : fallback;
} 