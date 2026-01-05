# Production Deployment Tips

This document provides best practices for using payway-js in production environments.

## Environment Configuration

### Use Environment Variables

Never hardcode API credentials in your code:

```javascript
// ❌ Bad
const client = new PayWayClient(
  "https://checkout.payway.com.kh/",
  "hardcoded-merchant-id",
  "hardcoded-api-key"
);

// ✅ Good
const client = new PayWayClient(
  process.env.PAYWAY_BASE_URL || "https://checkout.payway.com.kh/",
  process.env.PAYWAY_MERCHANT_ID,
  process.env.PAYWAY_API_KEY
);
```

### Use Production Endpoints

Always use production endpoints in production:

```javascript
// Sandbox (for testing)
const sandboxClient = new PayWayClient(
  "https://checkout-sandbox.payway.com.kh/",
  merchantId,
  apiKey
);

// Production
const productionClient = new PayWayClient(
  "https://checkout.payway.com.kh/",
  merchantId,
  apiKey
);
```

## Error Handling

### Comprehensive Error Handling

Always handle all error types:

```javascript
try {
  const response = await client.create_transaction({ ... });
} catch (error) {
  if (error instanceof PayWayError) {
    // API errors - log for monitoring
    logger.error("PayWay API error", {
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      details: error.details,
    });
    
    // Handle specific error codes
    if (error.errorCode === "DUPLICATE_TXN_ID") {
      // Retry with different transaction ID
    }
  } else if (error instanceof PayWayRequestError) {
    // Network errors - may be retryable
    logger.error("Network error", {
      message: error.message,
      originalError: error.originalError,
    });
    
    // Implement retry logic for network errors
  } else {
    // Validation errors - should not happen in production
    logger.error("Validation error", { message: error.message });
  }
}
```

### Retry Logic

Implement retry logic for transient errors:

```javascript
async function createTransactionWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.create_transaction(params);
    } catch (error) {
      if (error instanceof PayWayRequestError && attempt < maxRetries) {
        // Network error - retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      if (error instanceof PayWayError && error.statusCode >= 500 && attempt < maxRetries) {
        // Server error - retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // Don't retry for client errors (4xx) or validation errors
      throw error;
    }
  }
}
```

## Transaction ID Generation

### Use Cryptographically Secure IDs

```javascript
const crypto = require("crypto");

function generateTransactionId(prefix = "order") {
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${prefix}-${timestamp}-${randomBytes}`;
}

// Usage
const tranId = generateTransactionId("order");
```

### Prevent Duplicate Transaction IDs

```javascript
// Store used transaction IDs (in database or cache)
const usedTransactionIds = new Set();

function generateUniqueTransactionId() {
  let tranId;
  do {
    tranId = generateTransactionId();
  } while (usedTransactionIds.has(tranId));
  
  usedTransactionIds.add(tranId);
  return tranId;
}
```

## Logging and Monitoring

### Structured Logging

```javascript
const logger = {
  info: (message, data) => console.log(JSON.stringify({ level: "info", message, ...data })),
  error: (message, data) => console.error(JSON.stringify({ level: "error", message, ...data })),
};

async function createTransaction(params) {
  const startTime = Date.now();
  
  try {
    const response = await client.create_transaction(params);
    const duration = Date.now() - startTime;
    
    logger.info("Transaction created", {
      tranId: response.tran_id,
      duration,
      success: true,
    });
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error("Transaction creation failed", {
      tranId: params.tran_id,
      duration,
      error: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
    });
    
    throw error;
  }
}
```

## Security Best Practices

### Never Log Sensitive Data

```javascript
// ❌ Bad - logs API keys
console.log("API Key:", apiKey);

// ✅ Good - sanitize logs
logger.info("Client initialized", {
  merchantId: merchantId,
  // Don't log API key
});
```

### Validate Input

Always validate user input before creating transactions:

```javascript
function validateTransactionParams(params) {
  if (!params.tran_id || typeof params.tran_id !== "string") {
    throw new Error("Invalid transaction ID");
  }
  
  if (!params.amount || params.amount <= 0) {
    throw new Error("Invalid amount");
  }
  
  if (!["USD", "KHR"].includes(params.currency)) {
    throw new Error("Invalid currency");
  }
  
  // Validate email format
  if (params.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
    throw new Error("Invalid email format");
  }
  
  return true;
}
```

## Performance Optimization

### Connection Pooling

The axios client can be reused across requests:

```javascript
// Create client once and reuse
const client = new PayWayClient(baseUrl, merchantId, apiKey);

// Reuse for multiple requests
const transaction1 = await client.create_transaction({ ... });
const transaction2 = await client.create_transaction({ ... });
```

### Batch Operations

For listing transactions, use appropriate date ranges:

```javascript
// ✅ Good - reasonable date range
const transactions = await client.transaction_list({
  from_date: "20240101",
  to_date: "20240131", // One month
});

// ❌ Bad - too large date range
const transactions = await client.transaction_list({
  from_date: "20200101",
  to_date: "20241231", // Multiple years
});
```

## Testing in Production

### Use Webhooks for Status Updates

Instead of polling, use webhooks for transaction status updates:

```javascript
// In your webhook handler
app.post("/payway-webhook", async (req, res) => {
  const { tran_id, status } = req.body;
  
  // Verify webhook signature (implement this)
  if (!verifyWebhookSignature(req)) {
    return res.status(401).send("Unauthorized");
  }
  
  // Update transaction status in your database
  await updateTransactionStatus(tran_id, status);
  
  res.status(200).send("OK");
});
```

### Health Checks

Implement health checks for your payment integration:

```javascript
async function healthCheck() {
  try {
    // Try to check a known transaction or use a lightweight endpoint
    await client.check_transaction("health-check-test");
    return { status: "healthy" };
  } catch (error) {
    if (error instanceof PayWayRequestError) {
      return { status: "unhealthy", reason: "network_error" };
    }
    return { status: "healthy" }; // API errors are OK for health check
  }
}
```

## Rate Limiting

Be aware of PayWay API rate limits and implement appropriate throttling:

```javascript
const rateLimiter = {
  requests: [],
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  
  async check() {
    const now = Date.now();
    this.requests = this.requests.filter(
      (time) => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.requests[0]);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  },
};

async function createTransactionWithRateLimit(params) {
  await rateLimiter.check();
  return await client.create_transaction(params);
}
```

## Summary

- ✅ Use environment variables for credentials
- ✅ Implement comprehensive error handling
- ✅ Use secure transaction ID generation
- ✅ Log appropriately (don't log sensitive data)
- ✅ Validate all input
- ✅ Implement retry logic for transient errors
- ✅ Monitor and track transaction creation
- ✅ Respect rate limits
- ✅ Use webhooks for status updates when possible
