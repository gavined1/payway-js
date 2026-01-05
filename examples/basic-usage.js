/**
 * Basic Usage Example
 *
 * This example demonstrates how to use payway-js to create and check transactions.
 */

const { PayWayClient } = require("payway");

// Initialize the client
const client = new PayWayClient(
  "https://checkout-sandbox.payway.com.kh/",
  process.env.PAYWAY_MERCHANT_ID,
  process.env.PAYWAY_API_KEY
);

async function main() {
  try {
    // Create a new transaction
    console.log("Creating transaction...");
    const transaction = await client.create_transaction({
      tran_id: `order-${Date.now()}`,
      payment_option: "abapay_deeplink",
      amount: 100,
      currency: "USD",
      return_url: "https://example.com/callback",
      firstname: "John",
      lastname: "Doe",
      email: "john.doe@example.com",
      phone: "+855123456789",
    });

    console.log("Transaction created:", transaction);
    console.log("Payment URL:", transaction.payment_url);
    console.log("Deeplink:", transaction.deeplink);

    // Check transaction status
    if (transaction.tran_id) {
      console.log("\nChecking transaction status...");
      const status = await client.check_transaction(transaction.tran_id);
      console.log("Transaction status:", status.status);
      console.log("Amount:", status.amount);
      console.log("Currency:", status.currency);
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.statusCode) {
      console.error("Status Code:", error.statusCode);
    }
  }
}

// Run the example
if (require.main === module) {
  main();
}

module.exports = { main };
