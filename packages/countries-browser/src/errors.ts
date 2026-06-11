/**
 * Error classes for @countrystatecity/countries-browser
 */

export class NetworkError extends Error {
  public readonly url: string;
  public readonly statusCode?: number;

  /**
   * Creates a NetworkError for failed HTTP requests.
   * @param message - Human-readable error description
   * @param url - The URL that caused the failure
   * @param statusCode - Optional HTTP status code
   */
  constructor(message: string, url: string, statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
    this.url = url;
    this.statusCode = statusCode;
  }
}

export class TimeoutError extends Error {
  public readonly timeout: number;

  /**
   * Creates a TimeoutError for requests that exceeded the time limit.
   * @param message - Human-readable error description
   * @param timeout - The timeout duration in milliseconds
   */
  constructor(message: string, timeout: number) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}
