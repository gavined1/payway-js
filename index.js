const { format } = require("date-fns");
const { createHmac } = require("node:crypto");
const axios = require("axios").default;
const { FormData } = require("formdata-node");

/**
 * Trims whitespace from a string value, or returns the value unchanged if it's not a string.
 * @param {string | any} value - The value to trim
 * @returns {string | any} The trimmed string or the original value
 */
function trim(value) {
  if (typeof value === "string") return value.trim();
  return value;
}

exports.trim = trim;

/**
 * Custom error class for PayWay API errors
 * @class
 * @extends Error
 * @property {string|null} errorCode - Error code from PayWay API
 * @property {number|null} statusCode - HTTP status code
 * @property {object|null} details - Detailed error information from API response
 * @property {object|null} response - Full API response object (for backward compatibility)
 */
class PayWayError extends Error {
  /**
   * @param {string} message - Error message
   * @param {object} [response] - API response object
   * @param {number} [statusCode] - HTTP status code
   */
  constructor(message, response = null, statusCode = null) {
    super(message);
    this.name = "PayWayError";
    this.errorCode = response?.code || null;
    this.statusCode = statusCode;
    this.details = response || null;
    this.response = response; // For backward compatibility
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom error class for PayWay network/request errors
 */
class PayWayRequestError extends PayWayError {
  /**
   * @param {string} message - Error message
   * @param {Error} [originalError] - Original error object
   */
  constructor(message, originalError = null) {
    super(message);
    this.name = "PayWayRequestError";
    this.originalError = originalError;
  }
}

exports.PayWayError = PayWayError;
exports.PayWayRequestError = PayWayRequestError;

class PayWayClient {
  constructor(base_url, merchant_id, api_key, client_factory) {
    this.base_url = base_url;
    this.merchant_id = merchant_id;
    this.api_key = api_key;

    if (typeof client_factory === "function") {
      this._client = client_factory(this);
    } else {
      this._client = axios.create({
        baseURL: base_url,
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
  }

  /**
   * Creates a SHA512 HMAC hash from an array of string values.
   * @param {string[]} values - Array of string values to hash
   * @returns {string} Base64-encoded hash
   */
  create_hash(values) {
    const data = values.join("");
    return createHmac("sha512", this.api_key).update(data).digest("base64");
  }

  /**
   * Creates a FormData payload with required authentication fields.
   * @param {object} [body={}] - Request body parameters
   * @param {Date} [date=new Date()] - Date to use for req_time
   * @returns {FormData} FormData object with all required fields including hash
   */
  create_payload(body = {}, date = new Date()) {
    body = Object.fromEntries(
      Object.entries(body).filter(([k, v]) => v != null)
    );

    const req_time = format(date, "yyyyMMddHHmmss");
    const merchant_id = this.merchant_id;
    const formData = new FormData();
    const entries = Object.entries(body);

    const hash = this.create_hash([
      req_time,
      merchant_id,
      ...Object.values(body),
    ]);

    formData.append("req_time", req_time);
    formData.append("merchant_id", merchant_id);

    for (const [key, value] of entries) {
      formData.append(key, value);
    }

    formData.append("hash", hash);
    return formData;
  }

  /**
   * Creates a new payment transaction.
   * @param {object} [options={}] - Transaction options
   * @param {string} options.tran_id - Transaction ID (unique identifier, required)
   * @param {string} options.payment_option - Payment method (e.g., "abapay", "cards", "abapay_deeplink", required)
   * @param {number|string} options.amount - Transaction amount (required)
   * @param {string} options.currency - Currency code ("USD" or "KHR", required)
   * @param {string} [options.return_url] - URL to redirect after payment (base64 encoded automatically)
   * @param {string|object} [options.return_deeplink] - Deeplink for mobile apps (base64 encoded automatically)
   * @param {string} [options.continue_success_url] - URL to continue after successful payment
   * @param {string} [options.pwt] - Payment window type
   * @param {string} [options.firstname] - Customer first name
   * @param {string} [options.lastname] - Customer last name
   * @param {string} [options.email] - Customer email
   * @param {string} [options.phone] - Customer phone number
   * @returns {Promise<object>} API response data with payment URL or deeplink
   * @throws {PayWayError} If the API returns an error response (e.g., invalid parameters, duplicate transaction ID)
   * @throws {PayWayRequestError} If a network or request error occurs
   * @throws {Error} If required parameters are missing
   * @example
   * ```javascript
   * const response = await client.create_transaction({
   *   tran_id: "order-123",
   *   payment_option: "abapay_deeplink",
   *   amount: 100,
   *   currency: "USD",
   *   return_url: "https://example.com/callback"
   * });
   * ```
   */
  async create_transaction({
    tran_id,
    payment_option,
    amount,
    currency,
    return_url,
    return_deeplink,
    continue_success_url,
    pwt,
    firstname,
    lastname,
    email,
    phone,
  } = {}) {
    // Parameter validation
    if (!tran_id || typeof tran_id !== "string") {
      throw new Error(
        "create_transaction: tran_id is required and must be a string"
      );
    }
    if (!payment_option || typeof payment_option !== "string") {
      throw new Error(
        "create_transaction: payment_option is required and must be a string"
      );
    }
    if (amount === undefined || amount === null) {
      throw new Error("create_transaction: amount is required");
    }
    if (!currency || (currency !== "USD" && currency !== "KHR")) {
      throw new Error(
        'create_transaction: currency is required and must be "USD" or "KHR"'
      );
    }

    try {
      function base64(d) {
        return Buffer.from(d).toString("base64");
      }

      if (typeof return_url === "string") return_url = base64(return_url);
      if (typeof return_deeplink === "string")
        return_deeplink = base64(return_deeplink);
      if (typeof return_deeplink === "object" && return_deeplink != null)
        return_deeplink = base64(JSON.stringify(return_deeplink));

      const response = await this._client.post(
        "/api/payment-gateway/v1/payments/purchase",
        // order matters here
        this.create_payload({
          tran_id,
          amount,
          pwt,
          firstname: trim(firstname),
          lastname: trim(lastname),
          email: trim(email),
          phone: trim(phone),
          payment_option,
          return_url,
          continue_success_url,
          return_deeplink,
          currency,
        })
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        // API responded with error status
        const statusCode = error.response.status;
        const errorData = error.response.data;
        throw new PayWayError(
          `PayWay API error: ${
            errorData?.message || error.message || "Unknown error"
          }`,
          errorData,
          statusCode
        );
      } else if (error.request) {
        // Request made but no response received
        throw new PayWayRequestError(
          `Network error: No response received from PayWay API`,
          error
        );
      } else {
        // Error setting up the request
        throw new PayWayRequestError(`Request error: ${error.message}`, error);
      }
    }
  }

  /**
   * Checks the status of a transaction by transaction ID.
   * @param {string} tran_id - Transaction ID to check (required)
   * @returns {Promise<object>} API response data with transaction status and details
   * @throws {PayWayError} If the API returns an error response (e.g., transaction not found)
   * @throws {PayWayRequestError} If a network or request error occurs
   * @throws {Error} If tran_id is missing or invalid
   * @example
   * ```javascript
   * const response = await client.check_transaction("order-123");
   * console.log("Status:", response.status);
   * console.log("Amount:", response.amount);
   * ```
   */
  async check_transaction(tran_id) {
    // Parameter validation
    if (!tran_id || typeof tran_id !== "string") {
      throw new Error(
        "check_transaction: tran_id is required and must be a string"
      );
    }

    try {
      const response = await this._client.post(
        "/api/payment-gateway/v1/payments/check-transaction",
        // order matters here
        this.create_payload({ tran_id })
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        // API responded with error status
        const statusCode = error.response.status;
        const errorData = error.response.data;
        throw new PayWayError(
          `PayWay API error: ${
            errorData?.message || error.message || "Unknown error"
          }`,
          errorData,
          statusCode
        );
      } else if (error.request) {
        // Request made but no response received
        throw new PayWayRequestError(
          `Network error: No response received from PayWay API`,
          error
        );
      } else {
        // Error setting up the request
        throw new PayWayRequestError(`Request error: ${error.message}`, error);
      }
    }
  }

  /**
   * Retrieves a list of transactions based on filter criteria.
   * @param {object} [options={}] - Filter options (all optional)
   * @param {string} [options.from_date] - Start date for filtering (format: YYYYMMDD)
   * @param {string} [options.to_date] - End date for filtering (format: YYYYMMDD)
   * @param {string|number} [options.from_amount] - Minimum amount filter
   * @param {string|number} [options.to_amount] - Maximum amount filter
   * @param {string} [options.status] - Transaction status filter (e.g., "APPROVED", "PENDING", "DECLINED")
   * @returns {Promise<object>} API response data with transaction list and pagination info
   * @throws {PayWayError} If the API returns an error response (e.g., invalid date format)
   * @throws {PayWayRequestError} If a network or request error occurs
   * @example
   * ```javascript
   * const response = await client.transaction_list({
   *   from_date: "20240101",
   *   to_date: "20240131",
   *   status: "APPROVED"
   * });
   * console.log("Total:", response.total);
   * ```
   */
  async transaction_list({
    from_date,
    to_date,
    from_amount,
    to_amount,
    status,
  } = {}) {
    // Optional parameter validation
    if (from_date && typeof from_date !== "string") {
      throw new Error(
        "transaction_list: from_date must be a string in YYYYMMDD format"
      );
    }
    if (to_date && typeof to_date !== "string") {
      throw new Error(
        "transaction_list: to_date must be a string in YYYYMMDD format"
      );
    }

    try {
      const response = await this._client.post(
        "/api/payment-gateway/v1/payments/transaction-list",
        this.create_payload({
          from_date,
          to_date,
          from_amount,
          to_amount,
          status,
        })
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        // API responded with error status
        const statusCode = error.response.status;
        const errorData = error.response.data;
        throw new PayWayError(
          `PayWay API error: ${
            errorData?.message || error.message || "Unknown error"
          }`,
          errorData,
          statusCode
        );
      } else if (error.request) {
        // Request made but no response received
        throw new PayWayRequestError(
          `Network error: No response received from PayWay API`,
          error
        );
      } else {
        // Error setting up the request
        throw new PayWayRequestError(`Request error: ${error.message}`, error);
      }
    }
  }
}

exports.PayWayClient = PayWayClient;
