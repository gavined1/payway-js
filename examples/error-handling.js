/**
 * Error Handling Example
 *
 * This example demonstrates comprehensive error handling with payway-js,
 * including validation errors, API errors, and network errors.
 */

const { PayWayClient, PayWayError, PayWayRequestError } = require("payway");

const client = new PayWayClient(
  "https://checkout-sandbox.payway.com.kh/",
  process.env.PAYWAY_MERCHANT_ID,
  process.env.PAYWAY_API_KEY
);

async function handleCreateTransaction() {
  try {
    // This will throw a validation error - missing required fields
    await client.create_transaction({
      tran_id: "test",
      // Missing payment_option, amount, currency
    });
  } catch (error) {
    if (error instanceof PayWayError) {
      console.error("PayWay API Error:");
      console.error("  Message:", error.message);
      console.error("  Error Code:", error.errorCode);
      console.error("  Status Code:", error.statusCode);
      console.error("  Details:", error.details);
    } else if (error instanceof PayWayRequestError) {
      console.error("Network/Request Error:");
      console.error("  Message:", error.message);
      console.error("  Original Error:", error.originalError);
    } else {
      // Validation error (regular Error)
      console.error("Validation Error:", error.message);
    }
  }
}

async function handleCheckTransaction() {
  try {
    // This might throw an error if transaction doesn't exist
    const response = await client.check_transaction("invalid-transaction-id");
    console.log("Transaction found:", response);
  } catch (error) {
    if (error instanceof PayWayError) {
      // API returned an error (e.g., transaction not found)
      console.error("API Error:", error.errorCode);
      console.error("Status:", error.statusCode);

      // Handle specific error codes
      if (error.errorCode === "TXN_NOT_FOUND") {
        console.log("Transaction not found - this is expected for invalid IDs");
      }
    } else if (error instanceof PayWayRequestError) {
      // Network error (no response from server)
      console.error("Network error - check your connection");
    } else {
      // Validation error
      console.error("Invalid input:", error.message);
    }
  }
}

async function handleTransactionList() {
  try {
    // Invalid date format will throw validation error
    await client.transaction_list({
      from_date: 20240101, // Should be string
      to_date: "20240131",
    });
  } catch (error) {
    if (error.message.includes("must be a string")) {
      console.error("Validation Error:", error.message);
      console.log("Fix: Use string format 'YYYYMMDD' for dates");
    }
  }
}

async function comprehensiveErrorHandling() {
  try {
    const response = await client.create_transaction({
      tran_id: `order-${Date.now()}`,
      payment_option: "abapay",
      amount: 100,
      currency: "USD",
    });

    // Success case
    console.log("Transaction created successfully:", response.tran_id);
  } catch (error) {
    // Comprehensive error handling
    if (error instanceof PayWayError) {
      // Handle API errors
      switch (error.statusCode) {
        case 400:
          console.error("Bad Request - check your parameters");
          break;
        case 401:
          console.error("Unauthorized - check your API key");
          break;
        case 404:
          console.error("Not Found - check the endpoint");
          break;
        case 500:
          console.error("Server Error - try again later");
          break;
        default:
          console.error("API Error:", error.errorCode);
      }
    } else if (error instanceof PayWayRequestError) {
      // Handle network errors
      console.error("Network error occurred");
      console.error("Original error:", error.originalError?.message);
    } else {
      // Handle validation errors
      console.error("Validation error:", error.message);
    }
  }
}

async function main() {
  console.log("=== Validation Error Example ===");
  await handleCreateTransaction();

  console.log("\n=== API Error Example ===");
  await handleCheckTransaction();

  console.log("\n=== Date Format Error Example ===");
  await handleTransactionList();

  console.log("\n=== Comprehensive Error Handling ===");
  await comprehensiveErrorHandling();
}

if (require.main === module) {
  main();
}

module.exports = {
  handleCreateTransaction,
  handleCheckTransaction,
  handleTransactionList,
  comprehensiveErrorHandling,
};
