# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :x:                |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT open a public issue

**Do not** report security vulnerabilities through public GitHub issues. This could expose users to potential attacks.

### 2. Report privately

Please report security vulnerabilities by emailing the maintainer:

- **Email**: seanghay.dev@gmail.com
- **Subject**: [SECURITY] payway-js vulnerability report

### 3. Include details

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### 4. Response timeline

We will:

- Acknowledge receipt within 48 hours
- Provide an initial assessment within 7 days
- Keep you informed of our progress
- Notify you when the vulnerability is fixed

### 5. Disclosure

We follow responsible disclosure practices:

- We will credit you for the discovery (if you wish)
- We will coordinate public disclosure after a fix is available
- We will not disclose your identity without permission

## Security Best Practices

When using payway-js:

1. **Keep dependencies updated**: Regularly update to the latest version

   ```bash
   npm update payway
   ```

2. **Use environment variables**: Never commit API keys or credentials

   ```javascript
   const apiKey = process.env.PAYWAY_API_KEY;
   ```

3. **Validate input**: Always validate user input before creating transactions

   ```javascript
   if (!tran_id || typeof tran_id !== "string") {
     throw new Error("Invalid transaction ID");
   }
   ```

4. **Handle errors securely**: Don't expose sensitive information in error messages

   ```javascript
   try {
     await client.create_transaction({ ... });
   } catch (error) {
     // Log error securely, don't expose API keys
     console.error('Transaction failed');
   }
   ```

5. **Use HTTPS**: Always use HTTPS endpoints for production
   ```javascript
   const client = new PayWayClient(
     "https://checkout.payway.com.kh/", // Use HTTPS
     merchantId,
     apiKey
   );
   ```

## Known Security Considerations

- **API Keys**: Treat API keys as sensitive credentials. Never expose them in client-side code or public repositories.
- **Transaction IDs**: Use cryptographically secure random IDs to prevent transaction ID collisions.
- **Network Security**: The library makes HTTPS requests, but ensure your network is secure when handling payment data.

## Security Updates

Security updates will be:

- Released as patch versions (e.g., 0.4.0 → 0.4.1)
- Documented in CHANGELOG.md
- Announced via GitHub releases

## Thank You

Thank you for helping keep payway-js and its users safe!
