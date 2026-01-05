# Contributing to payway-js

Thank you for your interest in contributing to payway-js! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Node.js version and operating system
- Any relevant error messages or stack traces

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:

- A clear description of the feature
- Use cases and examples
- Any potential implementation considerations

### Pull Requests

1. **Fork the repository** and create a branch from `main`
2. **Make your changes** following the project's coding standards
3. **Add tests** for any new functionality
4. **Update documentation** if needed
5. **Ensure all tests pass** (`npm test`)
6. **Run linting** and fix any issues
7. **Submit a pull request** with a clear description

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/seanghay/payway-js.git
   cd payway-js
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Coding Standards

### Code Style

- Follow the existing code style
- Use ESLint and Prettier (configurations are provided)
- Use meaningful variable and function names
- Add JSDoc comments for public methods

### TypeScript

- Maintain type safety
- Use proper interfaces and types
- Avoid `any` types in public APIs
- Keep TypeScript definitions in sync with JavaScript code

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for high test coverage
- Test error scenarios and edge cases

### Commit Messages

Use clear, descriptive commit messages:

- Use present tense ("Add feature" not "Added feature")
- Reference issues when applicable
- Keep commits focused and atomic

Example:

```
Add parameter validation for create_transaction

- Validate required parameters before API calls
- Add descriptive error messages
- Add tests for validation scenarios

Fixes #123
```

## Project Structure

```
payway-js/
├── index.js          # Main library code
├── index.d.ts        # TypeScript definitions
├── index.test.mjs    # Test suite
├── package.json      # Package configuration
├── README.md         # Main documentation
├── CHANGELOG.md      # Version history
├── CONTRIBUTING.md   # This file
├── SECURITY.md       # Security policy
├── examples/         # Usage examples
└── .github/          # GitHub workflows
```

## Testing

Run the test suite:

```bash
npm test
```

Tests use AVA and should cover:

- Happy path scenarios
- Error handling
- Parameter validation
- Edge cases

## Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md for all changes
- Add JSDoc comments for new public methods
- Update TypeScript definitions

## Questions?

Feel free to open an issue for questions or clarifications. We're happy to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
