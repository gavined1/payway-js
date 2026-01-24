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
   * @param {string[]} hash_values - Array of values to be used for hash generation in correct order
   * @param {object} [body={}] - Request body parameters
   * @param {Date} [date=new Date()] - Date to use for req_time
   * @returns {FormData} FormData object with all required fields including hash
   */
  create_payload(hash_values, body = {}, date = new Date()) {
    body = Object.fromEntries(
      Object.entries(body).filter(([k, v]) => v != null)
    );

    const req_time = format(date, "yyyyMMddHHmmss");
    const merchant_id = this.merchant_id;
    const formData = new FormData();

    const hash = this.create_hash([req_time, merchant_id, ...hash_values]);

    formData.append("req_time", req_time);
    formData.append("merchant_id", merchant_id);

    for (const [key, value] of Object.entries(body)) {
      formData.append(key, value);
    }

    formData.append("hash", hash);
    return formData;
  }

  /**
   * Creates a new payment transaction.
   * @param {object} [options={}] - Transaction options
   * @param {string} options.tran_id - Transaction ID (unique identifier, required)
   * @param {string} options.payment_option - Payment method (e.g., "abapay", "cards", required)
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
   * @param {string|object} [options.items] - Order items (will be base64 encoded JSON)
   * @param {string} [options.type="purchase"] - Transaction type
   * @param {string} [options.custom_fields] - Custom fields
   * @returns {Promise<object>} API response data with payment URL or deeplink
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
    items,
    type = "purchase",
    custom_fields,
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

      let encoded_return_url = return_url;
      if (typeof return_url === "string")
        encoded_return_url = base64(return_url);

      let encoded_return_deeplink = return_deeplink;
      if (typeof return_deeplink === "string")
        encoded_return_deeplink = base64(return_deeplink);
      if (typeof return_deeplink === "object" && return_deeplink != null)
        encoded_return_deeplink = base64(JSON.stringify(return_deeplink));

      let encoded_items = items;
      if (typeof items === "object" && items != null)
        encoded_items = base64(JSON.stringify(items));
      else if (typeof items === "string") encoded_items = base64(items);

      const payloadData = {
        tran_id,
        amount,
        pwt,
        firstname: trim(firstname),
        lastname: trim(lastname),
        email: trim(email),
        phone: trim(phone),
        items: encoded_items,
        type,
        payment_option,
        return_url: encoded_return_url,
        continue_success_url,
        return_deeplink: encoded_return_deeplink,
        currency,
        custom_fields,
      };

      const hashValues = [
        payloadData.tran_id,
        payloadData.amount,
        payloadData.items ?? "",
        payloadData.firstname ?? "",
        payloadData.lastname ?? "",
        payloadData.email ?? "",
        payloadData.phone ?? "",
        payloadData.type ?? "",
        payloadData.payment_option ?? "",
        payloadData.continue_success_url ?? "",
        payloadData.return_url ?? "",
        payloadData.return_deeplink ?? "",
        payloadData.currency ?? "",
        payloadData.custom_fields ?? "",
        payloadData.pwt ?? "",
      ].map((v) => (v == null ? "" : String(v)));

      const response = await this._client.post(
        "/api/payment-gateway/v1/payments/purchase",
        this.create_payload(hashValues, payloadData)
      );

      return response.data;
    } catch (error) {
      this._handle_error(error);
    }
  }

  /**
   * Checks the status of a transaction by transaction ID.
   * @param {string} tran_id - Transaction ID to check (required)
   * @returns {Promise<object>} API response data with transaction status and details
   */
  async check_transaction(tran_id) {
    if (!tran_id || typeof tran_id !== "string") {
      throw new Error(
        "check_transaction: tran_id is required and must be a string"
      );
    }

    try {
      const response = await this._client.post(
        "/api/payment-gateway/v1/payments/check-transaction",
        this.create_payload([String(tran_id)], { tran_id })
      );
      return response.data;
    } catch (error) {
      this._handle_error(error);
    }
  }

  /**
   * Retrieves a list of transactions based on filter criteria.
   * @param {object} [options={}] - Filter options (all optional)
   * @returns {Promise<object>} API response data with transaction list and pagination info
   */
  async transaction_list({
    from_date,
    to_date,
    from_amount,
    to_amount,
    status,
  } = {}) {
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
      const payloadData = {
        from_date,
        to_date,
        from_amount,
        to_amount,
        status,
      };

      const hashValues = [
        payloadData.from_date ?? "",
        payloadData.to_date ?? "",
        payloadData.from_amount ?? "",
        payloadData.to_amount ?? "",
        payloadData.status ?? "",
      ].map((v) => (v == null ? "" : String(v)));

      const response = await this._client.post(
        "/api/payment-gateway/v1/payments/transaction-list",
        this.create_payload(hashValues, payloadData)
      );
      return response.data;
    } catch (error) {
      this._handle_error(error);
    }
  }

  /**
   * Internal error handler to reduce duplication
   * @private
   */
  _handle_error(error) {
    if (error.response) {
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
      throw new PayWayRequestError(
        `Network error: No response received from PayWay API`,
        error
      );
    } else {
      throw new PayWayRequestError(`Request error: ${error.message}`, error);
    }
  }
}

exports.PayWayClient = PayWayClient;
