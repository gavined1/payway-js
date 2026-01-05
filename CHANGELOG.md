# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2024-12-XX

### Added

- GitHub Actions CI/CD workflow testing on Node.js 18, 20, 22, 24 across multiple OS
- Comprehensive documentation (CHANGELOG.md, CONTRIBUTING.md, SECURITY.md)
- Example code in `examples/` directory
- `.npmignore` for clean npm package publication
- Enhanced package.json metadata for npm publication

### Changed

- Updated Node.js engine requirement from >=16.0.0 to >=18.0.0 (targeting Active LTS)
- Enhanced GitHub Actions workflow with matrix strategy for comprehensive testing

### Fixed

- Improved CI/CD reliability with proper caching and dry-run package verification

## [0.3.0] - 2024-12-XX

### Added

- **Enhanced TypeScript Definitions**:
  - Enums for `TransactionStatus` and `PaymentOption`
  - Detailed request parameter interfaces (`CreateTransactionParams`, `CheckTransactionParams`, `TransactionListParams`)
  - Enhanced response interfaces with additional fields (created_at, updated_at, pagination)
  - `DeeplinkConfig` interface for mobile app deeplinks
  - Full type safety with no `any` types in public APIs
- **Improved Error Handling**:
  - `PayWayError` now includes `errorCode` and `details` properties
  - Better error messages with API error codes
  - Parameter validation for all API methods with descriptive error messages
- **Code Quality**:
  - Added Prettier configuration for consistent formatting
  - Enhanced ESLint rules
  - Comprehensive JSDoc documentation with examples
  - Parameter validation for all API methods

### Changed

- Enhanced TypeScript definitions with enums and detailed interfaces
- Improved error handling with better error properties

## [0.2.0] - 2024-12-XX

### Added

- **Enhanced Error Handling**: Custom error classes (`PayWayError`, `PayWayRequestError`) for better error handling
- **TypeScript Improvements**: Proper response type interfaces and better type safety
- **JSDoc Documentation**: Comprehensive documentation for all public methods
- **Improved Testing**: Expanded test coverage including error scenarios

### Changed

- Updated dependencies to latest stable versions:
  - `axios`: ^1.6.2 → ^1.7.7
  - `date-fns`: ^2.30.0 → ^3.6.0
  - `formdata-node`: ^4.4.1 → ^6.0.3
  - `ava`: ^6.0.1 → ^6.1.1

### Added

- Node.js version requirement (>=16.0.0) in package.json
- ESLint configuration
- .editorconfig for code consistency

## [0.1.4] - Initial Release

### Added

- Basic PayWay API client implementation
- Support for creating transactions
- Support for checking transaction status
- Support for listing transactions
- Basic TypeScript definitions
