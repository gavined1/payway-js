/**
 * TypeScript Usage Example
 *
 * This example demonstrates TypeScript usage with payway-js,
 * including enums, interfaces, and type safety.
 *
 * Note: After installing via npm, use:
 *   import { ... } from "payway";
 *
 * For local development, we use a relative import:
 */

import {
  PayWayClient,
  TransactionStatus,
  PaymentOption,
  CreateTransactionResponse,
  CheckTransactionResponse,
  PayWayError,
  PayWayRequestError,
} from "../index";

// Initialize the client
const client = new PayWayClient(
  "https://checkout-sandbox.payway.com.kh/",
  process.env.PAYWAY_MERCHANT_ID || "",
  process.env.PAYWAY_API_KEY || ""
);

async function createTransaction(): Promise<CreateTransactionResponse> {
  try {
    // Use enums for better type safety
    const response = await client.create_transaction({
      tran_id: `order-${Date.now()}`,
      payment_option: PaymentOption.ABAPAY_DEEPLINK,
      amount: 100,
      currency: "USD",
      return_url: "https://example.com/callback",
      firstname: "John",
      lastname: "Doe",
      email: "john.doe@example.com",
    });

    // TypeScript knows the response type
    console.log("Transaction ID:", response.tran_id);
    console.log("Payment URL:", response.payment_url);

    return response;
  } catch (error) {
    if (error instanceof PayWayError) {
      console.error("API Error:", error.errorCode);
      console.error("Details:", error.details);
      throw error;
    } else if (error instanceof PayWayRequestError) {
      console.error("Network Error:", error.message);
      throw error;
    }
    throw error;
  }
}

async function checkTransaction(
  tranId: string
): Promise<CheckTransactionResponse> {
  try {
    const response = await client.check_transaction(tranId);

    // Use enum for status comparison
    if (response.status === TransactionStatus.APPROVED) {
      console.log("Transaction approved!");
    } else if (response.status === TransactionStatus.PENDING) {
      console.log("Transaction pending...");
    } else if (response.status === TransactionStatus.DECLINED) {
      console.log("Transaction declined");
    }

    return response;
  } catch (error) {
    if (error instanceof PayWayError) {
      console.error("Error Code:", error.errorCode);
      console.error("Status Code:", error.statusCode);
    }
    throw error;
  }
}

async function listTransactions() {
  try {
    const response = await client.transaction_list({
      from_date: "20240101",
      to_date: "20240131",
      status: TransactionStatus.APPROVED,
      from_amount: 100,
      to_amount: 1000,
    });

    console.log(`Found ${response.total} transactions`);
    response.transactions?.forEach((txn) => {
      console.log(
        `- ${txn.tran_id}: ${txn.status} - ${txn.amount} ${txn.currency}`
      );
    });
  } catch (error) {
    if (error instanceof PayWayError) {
      console.error("Error:", error.errorCode);
    }
  }
}

// Run examples
async function main() {
  try {
    const transaction = await createTransaction();
    if (transaction.tran_id) {
      await checkTransaction(transaction.tran_id);
    }
    await listTransactions();
  } catch (error) {
    console.error("Failed:", error);
  }
}

if (require.main === module) {
  main();
}

export { createTransaction, checkTransaction, listTransactions };
