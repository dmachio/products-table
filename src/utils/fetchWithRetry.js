class FetchClientError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "FetchClientError";
    this.status = status;
  }
}

export async function fetchWithRetry(
  url,
  options = {},
  maxRetries = 3,
  initialDelay = 500
) {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // 4xx errors: do not retry, inform user
      if (response.status >= 400 && response.status < 500) {
        throw new FetchClientError(
          `Request failed with status ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      // 5xx errors: retry
      if (response.status >= 500 && response.status < 600) {
        if (attempt === maxRetries) {
          throw new Error(
            `Server error (${response.status}). Max retries reached.`
          );
        }
        const currentDelay = delay;
        await new Promise((res) => setTimeout(res, currentDelay));
        delay *= 2;
        attempt++;
        continue;
      }

    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }
      if (error instanceof FetchClientError) {
        throw error;
      }
      if (attempt === maxRetries) {
        throw new Error(
          `Network error or server unavailable. Max retries reached. Last error: ${error.message}`
        );
      }
      const currentDelay = delay;
      await new Promise((res) => setTimeout(res, currentDelay));
      delay *= 2;
      attempt++;
    }
  }
}
