import test from "ava";
import {
  PayWayClient,
  trim,
  PayWayError,
  PayWayRequestError,
} from "./index.js";

test("should trim", (t) => {
  t.is(trim("abc "), "abc");
  t.is(trim(" abc "), "abc");
  t.is(trim(), undefined);
  t.is(trim(null), null);
  t.is(trim(1), 1);
  t.is(trim(NaN), NaN);
});

test("should hash", (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");
  const hash = client.create_hash(["a", "b", "c"]);
  t.is(
    hash,
    "JcTO3d5PoVoVRPIWjUg9bTRrSTpFhu9JXOLm+nLjrmDatGZuSz9eDv323DX05K1r/BYx60AQVZ+GOWbTS4XUvw=="
  );
});

test("should create formdata", (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");
  const date = new Date(0);
  const data = client.create_payload(
    {
      a: "a-value",
      b: "b-value",
      c: null,
      d: undefined,
    },
    date
  );
  t.true(data.has("req_time"));
  t.is(data.get("merchant_id"), "1");
  t.true(data.has("hash"));
  t.is(data.get("a"), "a-value");
  t.is(data.get("b"), "b-value");
  t.false(data.has("c"));
  t.false(data.has("d"));
});

test("client factory", (t) => {
  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    (thisRef) => thisRef.base_url
  );
  t.is(client._client, "http://example.com");
});

test("default factory", (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");
  t.true("get" in client._client);
  t.true("post" in client._client);
});

// Error handling tests
test("create_transaction should throw PayWayError on API error", async (t) => {
  const mockClient = {
    post: async () => {
      const error = new Error("Request failed");
      error.response = {
        status: 400,
        data: { message: "Invalid transaction ID", code: "INVALID_TXN_ID" },
      };
      throw error;
    },
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  await t.throwsAsync(
    async () =>
      await client.create_transaction({
        tran_id: "test",
        payment_option: "abapay",
        amount: 100,
        currency: "USD",
      }),
    { instanceOf: PayWayError }
  );
});

test("create_transaction should throw PayWayRequestError on network error", async (t) => {
  const mockClient = {
    post: async () => {
      const error = new Error("Network error");
      error.request = {};
      throw error;
    },
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  await t.throwsAsync(
    async () =>
      await client.create_transaction({
        tran_id: "test",
        payment_option: "abapay",
        amount: 100,
        currency: "USD",
      }),
    { instanceOf: PayWayRequestError }
  );
});

test("create_transaction should return response data on success", async (t) => {
  const mockResponse = {
    tran_id: "test-123",
    payment_url: "https://payway.com.kh/pay/test-123",
    deeplink: "abapay://payment/test-123",
  };

  const mockClient = {
    post: async () => ({ data: mockResponse }),
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  const result = await client.create_transaction({
    tran_id: "test-123",
    payment_option: "abapay",
    amount: 100,
    currency: "USD",
  });

  t.deepEqual(result, mockResponse);
});

test("check_transaction should throw PayWayError on API error", async (t) => {
  const mockClient = {
    post: async () => {
      const error = new Error("Request failed");
      error.response = {
        status: 404,
        data: { message: "Transaction not found", code: "TXN_NOT_FOUND" },
      };
      throw error;
    },
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  await t.throwsAsync(
    async () => await client.check_transaction("invalid-id"),
    { instanceOf: PayWayError }
  );
});

test("check_transaction should return response data on success", async (t) => {
  const mockResponse = {
    tran_id: "test-123",
    status: "APPROVED",
    amount: "100.00",
    currency: "USD",
  };

  const mockClient = {
    post: async () => ({ data: mockResponse }),
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  const result = await client.check_transaction("test-123");

  t.deepEqual(result, mockResponse);
  t.is(result.status, "APPROVED");
});

test("transaction_list should throw PayWayError on API error", async (t) => {
  const mockClient = {
    post: async () => {
      const error = new Error("Request failed");
      error.response = {
        status: 400,
        data: { message: "Invalid date format", code: "INVALID_DATE" },
      };
      throw error;
    },
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  await t.throwsAsync(
    async () => await client.transaction_list({ from_date: "invalid" }),
    { instanceOf: PayWayError }
  );
});

test("transaction_list should return response data on success", async (t) => {
  const mockResponse = {
    transactions: [
      { tran_id: "test-1", status: "APPROVED", amount: "100.00" },
      { tran_id: "test-2", status: "PENDING", amount: "200.00" },
    ],
    total: 2,
  };

  const mockClient = {
    post: async () => ({ data: mockResponse }),
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  const result = await client.transaction_list({ status: "APPROVED" });

  t.deepEqual(result, mockResponse);
  t.is(result.transactions.length, 2);
  t.is(result.total, 2);
});

test("create_transaction should handle base64 encoding of return_url and return_deeplink", async (t) => {
  const mockClient = {
    post: async (url, formData) => {
      // Verify that return_url and return_deeplink are base64 encoded
      const returnUrl = formData.get("return_url");
      const returnDeeplink = formData.get("return_deeplink");

      t.truthy(returnUrl);
      t.truthy(returnDeeplink);

      // Verify they are base64 encoded (not the original URLs)
      t.not(returnUrl, "https://example.com/callback");
      t.not(returnDeeplink, "abapay://payment");

      return {
        data: {
          tran_id: "test",
          payment_url: "https://payway.com.kh/pay/test",
        },
      };
    },
  };

  const client = new PayWayClient(
    "http://example.com",
    "1",
    "1",
    () => mockClient
  );

  await client.create_transaction({
    tran_id: "test",
    payment_option: "abapay",
    amount: 100,
    currency: "USD",
    return_url: "https://example.com/callback",
    return_deeplink: "abapay://payment",
  });

  t.pass();
});

test("PayWayError should contain response and statusCode", (t) => {
  const errorData = { message: "Test error", code: "TEST_ERROR" };
  const error = new PayWayError("Test", errorData, 400);

  t.is(error.message, "Test");
  t.is(error.name, "PayWayError");
  t.deepEqual(error.response, errorData);
  t.is(error.statusCode, 400);
  t.true(error instanceof Error);
});

test("PayWayRequestError should contain originalError", (t) => {
  const originalError = new Error("Network failed");
  const error = new PayWayRequestError("Request failed", originalError);

  t.is(error.message, "Request failed");
  t.is(error.name, "PayWayRequestError");
  t.is(error.originalError, originalError);
  t.true(error instanceof PayWayError);
  t.true(error instanceof Error);
});

// Parameter validation tests
test("create_transaction should throw error if tran_id is missing", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(async () => await client.create_transaction({}), {
    message: /tran_id is required/,
  });
});

test("create_transaction should throw error if payment_option is missing", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(
    async () =>
      await client.create_transaction({
        tran_id: "test",
      }),
    {
      message: /payment_option is required/,
    }
  );
});

test("create_transaction should throw error if amount is missing", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(
    async () =>
      await client.create_transaction({
        tran_id: "test",
        payment_option: "abapay",
      }),
    {
      message: /amount is required/,
    }
  );
});

test("create_transaction should throw error if currency is missing", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(
    async () =>
      await client.create_transaction({
        tran_id: "test",
        payment_option: "abapay",
        amount: 100,
      }),
    {
      message: /currency is required/,
    }
  );
});

test("create_transaction should throw error if currency is invalid", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(
    async () =>
      await client.create_transaction({
        tran_id: "test",
        payment_option: "abapay",
        amount: 100,
        currency: "EUR",
      }),
    {
      message: /currency.*must be.*USD.*or.*KHR/,
    }
  );
});

test("check_transaction should throw error if tran_id is missing", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(async () => await client.check_transaction(""), {
    message: /tran_id is required/,
  });
});

test("check_transaction should throw error if tran_id is not a string", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(async () => await client.check_transaction(null), {
    message: /tran_id is required/,
  });
});

test("transaction_list should throw error if from_date is invalid type", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(
    async () =>
      await client.transaction_list({
        from_date: 20240101,
      }),
    {
      message: /from_date must be a string/,
    }
  );
});

test("transaction_list should throw error if to_date is invalid type", async (t) => {
  const client = new PayWayClient("http://example.com", "1", "1");

  await t.throwsAsync(
    async () =>
      await client.transaction_list({
        to_date: 20240131,
      }),
    {
      message: /to_date must be a string/,
    }
  );
});

test("PayWayError should contain errorCode from response", (t) => {
  const errorData = {
    message: "Test error",
    code: "INVALID_TXN_ID",
    details: { field: "tran_id" },
  };
  const error = new PayWayError("Test", errorData, 400);

  t.is(error.errorCode, "INVALID_TXN_ID");
  t.is(error.statusCode, 400);
  t.deepEqual(error.details, errorData);
  t.deepEqual(error.response, errorData);
});

test("PayWayError should handle null response", (t) => {
  const error = new PayWayError("Test", null, 500);

  t.is(error.errorCode, null);
  t.is(error.statusCode, 500);
  t.is(error.details, null);
  t.is(error.response, null);
});
