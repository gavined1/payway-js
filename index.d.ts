import type { FormData } from "formdata-node";

/**
 * Trims whitespace from a string value, or returns the value unchanged if it's not a string.
 * @param value - The value to trim
 * @returns The trimmed string or the original value
 */
export declare function trim<T = string | null | undefined>(value: T): T;

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
  APPROVED = "APPROVED",
  DECLINED = "DECLINED",
  PENDING = "PENDING",
  PRE_AUTH = "PRE-AUTH",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

/**
 * Transaction status type (string literal union)
 */
export type TransactionStatusType =
  | "APPROVED"
  | "DECLINED"
  | "PENDING"
  | "PRE-AUTH"
  | "CANCELLED"
  | "REFUNDED"
  | (string & {});

/**
 * Payment option enumeration
 */
export enum PaymentOption {
  CARDS = "cards",
  ABAPAY = "abapay",
  ABAPAY_DEEPLINK = "abapay_deeplink",
  ABAPAY_KHQR_DEEPLINK = "abapay_khqr_deeplink",
  WECHAT = "wechat",
  ALIPAY = "alipay",
  BAKONG = "bakong",
}

/**
 * Payment option type (string literal union)
 */
export type PaymentOptionType =
  | "cards"
  | "abapay"
  | "abapay_deeplink"
  | "abapay_khqr_deeplink"
  | "wechat"
  | "alipay"
  | "bakong"
  | (string & {});

/**
 * Currency codes supported by PayWay
 */
export type Currency = "USD" | "KHR";

/**
 * Deeplink configuration for mobile apps
 */
export interface DeeplinkConfig {
  /** Android app scheme */
  android_scheme: string;
  /** iOS app scheme */
  ios_scheme: string;
}

/**
 * Request parameters for create_transaction API
 */
export interface CreateTransactionParams {
  /** Transaction ID (unique identifier, required) */
  tran_id: string;
  /** Payment method option (required) */
  payment_option: PaymentOptionType;
  /** Transaction amount (required) */
  amount: number | string;
  /** Currency code (required) */
  currency: Currency;
  /** URL to redirect after payment (base64 encoded automatically) */
  return_url?: string;
  /** Deeplink for mobile apps (base64 encoded automatically) */
  return_deeplink?: string | DeeplinkConfig;
  /** URL to continue after successful payment */
  continue_success_url?: string;
  /** Payment window type */
  pwt?: string;
  /** Customer first name */
  firstname?: string;
  /** Customer last name */
  lastname?: string;
  /** Customer email address */
  email?: string;
  /** Customer phone number */
  phone?: string;
  /** Order items (base64 encoded JSON automatically) */
  items?: string | any[];
  /** Transaction type (defaults to "purchase") */
  type?: string;
  /** Custom fields */
  custom_fields?: string;
}

/**
 * Response structure for create_transaction API
 */
export interface CreateTransactionResponse {
  /** Transaction ID */
  tran_id?: string;
  /** Payment URL for web redirect */
  payment_url?: string;
  /** Payment deeplink for mobile apps */
  deeplink?: string;
  /** QR code data (if applicable) */
  qr_code?: string;
  /** Transaction status */
  status?: TransactionStatusType;
  /** Additional response data */
  [key: string]: any;
}

/**
 * Request parameters for check_transaction API
 */
export interface CheckTransactionParams {
  /** Transaction ID to check (required) */
  tran_id: string;
}

/**
 * Response structure for check_transaction API
 */
export interface CheckTransactionResponse {
  /** Transaction ID */
  tran_id?: string;
  /** Transaction status */
  status?: TransactionStatusType;
  /** Transaction amount */
  amount?: string | number;
  /** Currency code */
  currency?: Currency;
  /** Transaction creation timestamp */
  created_at?: string;
  /** Transaction update timestamp */
  updated_at?: string;
  /** Payment method used */
  payment_option?: PaymentOptionType;
  /** Additional transaction data */
  [key: string]: any;
}

/**
 * Request parameters for transaction_list API
 */
export interface TransactionListParams {
  /** Start date for filtering (format: YYYYMMDD) */
  from_date?: string;
  /** End date for filtering (format: YYYYMMDD) */
  to_date?: string;
  /** Minimum amount filter */
  from_amount?: string | number;
  /** Maximum amount filter */
  to_amount?: string | number;
  /** Transaction status filter */
  status?: TransactionStatusType;
}

/**
 * Response structure for transaction_list API
 */
export interface TransactionListResponse {
  /** Array of transactions */
  transactions?: CheckTransactionResponse[];
  /** Total count of transactions matching the filter */
  total?: number;
  /** Current page number (if paginated) */
  page?: number;
  /** Number of items per page (if paginated) */
  per_page?: number;
  /** Total number of pages (if paginated) */
  total_pages?: number;
  /** Additional response data */
  [key: string]: any;
}

/**
 * Error response structure from PayWay API
 */
export interface PayWayErrorResponse {
  /** Error message */
  message?: string;
  /** Error code from PayWay API */
  code?: string;
  /** Detailed error information */
  details?: Record<string, any>;
  /** Additional error data */
  [key: string]: any;
}

/**
 * Custom error class for PayWay API errors
 */
export declare class PayWayError extends Error {
  /** Error code from PayWay API */
  errorCode: string | null;
  /** HTTP status code */
  statusCode: number | null;
  /** Detailed error information from API response */
  details: PayWayErrorResponse | null;
  /** Full API response object (for backward compatibility) */
  response: PayWayErrorResponse | null;
  constructor(
    message: string,
    response?: PayWayErrorResponse | null,
    statusCode?: number | null
  );
}

/**
 * Custom error class for PayWay network/request errors
 */
export declare class PayWayRequestError extends PayWayError {
  /** Original error object from axios */
  originalError: Error | null;
  constructor(message: string, originalError?: Error | null);
}

/**
 * PayWay API client for creating and managing payment transactions
 */
export declare class PayWayClient {
  /** Base URL for PayWay API */
  public readonly base_url: string;
  /** Merchant ID */
  public readonly merchant_id: string;
  /** API key for authentication */
  public readonly api_key: string;

  /**
   * Creates a new PayWayClient instance
   * @param base_url - Base URL for PayWay API
   * @param merchant_id - Your merchant ID
   * @param api_key - Your API key
   * @param client_factory - Optional factory function to create custom HTTP client
   */
  constructor(
    base_url: string,
    merchant_id: string,
    api_key: string,
    client_factory?: (thisRef: PayWayClient) => any
  );

  /**
   * Creates a SHA512 HMAC hash from an array of string values
   */
  public create_hash(values: string[]): string;

  /**
   * Creates a FormData payload with required authentication fields
   */
  public create_payload(
    hash_values: string[],
    body?: any,
    date?: Date
  ): FormData;

  /**
   * Creates a new payment transaction
   */
  public create_transaction(
    args?: Partial<CreateTransactionParams>
  ): Promise<CreateTransactionResponse>;

  /**
   * Checks the status of a transaction by transaction ID
   */
  public check_transaction(tran_id: string): Promise<CheckTransactionResponse>;

  /**
   * Retrieves a list of transactions based on filter criteria
   */
  public transaction_list(
    args?: TransactionListParams
  ): Promise<TransactionListResponse>;
}
