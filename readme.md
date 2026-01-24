## (Unofficial) Node.js Client for ABA PayWay

The implementation is based on https://www.payway.com.kh/developers/

[![test](https://github.com/seanghay/payway-js/actions/workflows/node-test.yml/badge.svg)](https://github.com/seanghay/payway-js/actions/workflows/node-test.yml)

> [!WARNING]  
> This is not a product of ABA Bank.

```shell
npm install payway
```

## Requirements

- Node.js >= 18.0.0 (LTS)

## Get Started

```javascript
import { PayWayClient } from "payway";

const client = new PayWayClient(
  "https://checkout-sandbox.payway.com.kh/",
  "your_merchant_id",
  "your_api_key"
);
```

## API Methods

### 1. Create Transaction

Creates a new payment transaction and returns payment URL or deeplink.

```javascript
try {
  const data = await client.create_transaction({
    tran_id: "example-01",
    payment_option: "abapay_deeplink",
    amount: 100,
    currency: "USD",
    return_url: "https://example.com/callback",
    firstname: "John",
    lastname: "Doe",
    email: "john.doe@example.com",
    phone: "+855123456789",
    items: [
      { name: "Product A", quantity: 1, amount: 50 },
      { name: "Product B", quantity: 1, amount: 50 }
    ],
    custom_fields: "my-internal-id"
  });

  console.log("Payment URL:", data.payment_url);
  console.log("Deeplink:", data.deeplink);
} catch (error) {
  if (error instanceof PayWayError) {
    console.error("API Error:", error.message);
  } else if (error instanceof PayWayRequestError) {
    console.error("Request Error:", error.message);
  }
}
```

**Response Structure:**

```typescript
{
  tran_id?: string;
  payment_url?: string;
  deeplink?: string;
  qr_code?: string;
  [key: string]: any;
}
```

### 2. Check Transaction

Checks the status of a transaction by transaction ID.

```javascript
try {
  const data = await client.check_transaction("example-01");

  console.log("Status:", data.status);
  console.log("Amount:", data.amount);
  console.log("Currency:", data.currency);
} catch (error) {
  if (error instanceof PayWayError) {
    console.error("API Error:", error.message);
  }
}
```

**Response Structure:**

```typescript
{
  tran_id?: string;
  status?: "APPROVED" | "DECLINED" | "PENDING" | "CANCELLED";
  amount?: string | number;
  currency?: string;
  [key: string]: any;
}
```

### 3. List Transactions

Retrieves a list of transactions based on filter criteria.

```javascript
try {
  const data = await client.transaction_list({
    from_date: "20240101",
    to_date: "20240131",
    status: "APPROVED",
    from_amount: 100,
    to_amount: 1000,
  });

  console.log("Total transactions:", data.total);
  console.log("Transactions:", data.transactions);
} catch (error) {
  if (error instanceof PayWayError) {
    console.error("API Error:", error.message);
  }
}
```

**Response Structure:**

```typescript
{
  transactions?: CheckTransactionResponse[];
  total?: number;
  [key: string]: any;
}
```

## Error Handling

The library provides custom error classes for better error handling:

### PayWayError

Thrown when the API returns an error response (4xx, 5xx status codes).

```javascript
import { PayWayClient, PayWayError } from "payway";

try {
  await client.create_transaction({
    /* ... */
  });
} catch (error) {
  if (error instanceof PayWayError) {
    console.error("Status Code:", error.statusCode);
    console.error("Error Response:", error.response);
    // error.response contains the API error details
  }
}
```

**Properties:**

- `message`: Error message
- `errorCode`: Error code from PayWay API (e.g., "INVALID_TXN_ID")
- `statusCode`: HTTP status code
- `details`: Detailed error information from API response
- `response`: Full API response object (for backward compatibility)

### PayWayRequestError

Thrown when a network error occurs or the request cannot be completed.

```javascript
import { PayWayClient, PayWayRequestError } from "payway";

try {
  await client.check_transaction("example-01");
} catch (error) {
  if (error instanceof PayWayRequestError) {
    console.error("Request failed:", error.message);
    console.error("Original error:", error.originalError);
  }
}
```

**Properties:**

- `message`: Error message
- `originalError`: Original error object from axios

## TypeScript Support

The package includes comprehensive TypeScript definitions with enums, interfaces, and full type safety:

```typescript
import {
  PayWayClient,
  TransactionStatus,
  PaymentOption,
  CreateTransactionResponse,
  CheckTransactionResponse,
  TransactionListResponse,
  PayWayError,
  PayWayRequestError,
} from "payway";

const client = new PayWayClient(
  "https://checkout-sandbox.payway.com.kh/",
  "merchant_id",
  "api_key"
);

// Use enums for better type safety
const transaction: CreateTransactionResponse = await client.create_transaction({
  tran_id: "example-01",
  payment_option: PaymentOption.ABAPAY_DEEPLINK,
  amount: 100,
  currency: "USD",
});

// Check transaction status with enum
const status = await client.check_transaction("example-01");
if (status.status === TransactionStatus.APPROVED) {
  console.log("Transaction approved!");
}
```

### Available Enums

- **TransactionStatus**: `APPROVED`, `DECLINED`, `PENDING`, `PRE_AUTH`, `CANCELLED`, `REFUNDED`
- **PaymentOption**: `CARDS`, `ABAPAY`, `ABAPAY_DEEPLINK`, `ABAPAY_KHQR_DEEPLINK`, `WECHAT`, `ALIPAY`, `BAKONG`

### Type Interfaces

- **CreateTransactionParams**: Request parameters for creating transactions
- **CheckTransactionParams**: Request parameters for checking transactions
- **TransactionListParams**: Request parameters for listing transactions
- **CreateTransactionResponse**: Response structure from create_transaction
- **CheckTransactionResponse**: Response structure from check_transaction
- **TransactionListResponse**: Response structure from transaction_list
- **PayWayErrorResponse**: Error response structure from API

## Supported Features

- [x] Create Transaction (with Hashing order fix)
- [x] Check Transaction
- [x] List Transactions
- [x] Support for Order Items
- [x] Support for Custom Fields
- [ ] Refund Transaction (Planned)
- [ ] Pre-Authorization (Planned)
- [ ] Account-On-File (AOF)
- [ ] Card-On-File (COF)
- [ ] Create Payment Link

## Upgrade Notes

### v0.3.0 → v0.4.0

#### Breaking Changes

- **Internal API**: The `create_payload` method now requires `hash_values` as the first argument. If you were using this internal method directly, you will need to update your code.
- **Scope Refinement**: Removed temporary/unsupported `refund` and `pre-auth` helpers to focus on making the core ecommerce checkout flow robust and correctly hashed.

#### New Features

- **Robust Hashing**: Fixed the hash generation order for all methods to strictly follow ABA PayWay's requirements.
- **Support for `items`**: You can now pass an array of items to `create_transaction`. The library handles base64 encoding automatically.
- **Support for `custom_fields`**: Easily pass supplementary data to transactions.
- **Improved Validation**: Enhanced parameter validation for all API calls.

#### Migration Guide

**Create Transaction Updates:**

```javascript
// New support for items and custom_fields
const response = await client.create_transaction({
  tran_id: "order-123",
  amount: 100,
  currency: "USD",
  items: [{ name: "Item 1", quantity: 1, amount: 100 }], // Now supported!
  custom_fields: "my-custom-data" // Now supported!
});
```

### v0.2.0 → v0.3.0

#### Breaking Changes

None. This version maintains full backward compatibility with v0.2.0.

#### New Features

- **Enhanced TypeScript Definitions**:
  - Enums for `TransactionStatus` and `PaymentOption`
  - Detailed request parameter interfaces (`CreateTransactionParams`, `CheckTransactionParams`, `TransactionListParams`)
  - Enhanced response interfaces with additional fields
  - Full type safety with no `any` types in public APIs
- **Improved Error Handling**:
  - `PayWayError` now includes `errorCode` and `details` properties
  - Better error messages with API error codes
  - Parameter validation with descriptive error messages
- **Code Quality**:
  - Added Prettier configuration for consistent formatting
  - Enhanced ESLint rules
  - Comprehensive JSDoc documentation with examples
  - Parameter validation for all API methods

#### Migration Guide

**No code changes required!** The API remains backward compatible. However, you can now take advantage of:

1. **Enhanced TypeScript Types:**

   ```typescript
   import {
     PayWayClient,
     TransactionStatus,
     PaymentOption,
     CreateTransactionParams,
   } from "payway";

   // Use enums for better type safety
   const params: CreateTransactionParams = {
     tran_id: "order-123",
     payment_option: PaymentOption.ABAPAY_DEEPLINK,
     amount: 100,
     currency: "USD",
   };
   ```

2. **Better Error Handling:**

   ```typescript
   try {
     await client.create_transaction({ ... });
   } catch (error) {
     if (error instanceof PayWayError) {
       console.error('Error Code:', error.errorCode);
       console.error('Details:', error.details);
     }
   }
   ```

3. **Parameter Validation:**
   The library now validates required parameters before making API calls, providing clearer error messages.

### v0.1.4 → v0.2.0

#### Breaking Changes

None. This version maintains full backward compatibility with v0.1.4.

#### New Features

- **Enhanced Error Handling**: Custom error classes (`PayWayError`, `PayWayRequestError`) for better error handling
- **TypeScript Improvements**: Proper response type interfaces and better type safety
- **JSDoc Documentation**: Comprehensive documentation for all public methods
- **Improved Testing**: Expanded test coverage including error scenarios

#### Dependency Updates

- `axios`: ^1.6.2 → ^1.7.7
- `date-fns`: ^2.30.0 → ^3.6.0
- `formdata-node`: ^4.4.1 → ^6.0.3
- `ava`: ^6.0.1 → ^6.1.1

#### Code Quality

- Added Node.js version requirement (>=16.0.0)
- Added ESLint configuration
- Added .editorconfig for code consistency

### Migration Guide

**No code changes required!** The API remains the same. However, you can now take advantage of:

1. **Better Error Handling:**

   ```javascript
   // Old way (still works)
   try {
     await client.create_transaction({
       /* ... */
     });
   } catch (error) {
     console.error(error);
   }

   // New way (recommended)
   import { PayWayError, PayWayRequestError } from "payway";

   try {
     await client.create_transaction({
       /* ... */
     });
   } catch (error) {
     if (error instanceof PayWayError) {
       // Handle API errors
     } else if (error instanceof PayWayRequestError) {
       // Handle network errors
     }
   }
   ```

2. **TypeScript Types:**
   ```typescript
   // Now you get proper types instead of Promise<any>
   const response: CreateTransactionResponse = await client.create_transaction({
     /* ... */
   });
   ```

---

### License

MIT
