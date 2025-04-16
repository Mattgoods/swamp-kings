# Testing Guide for Swamp Kings

This document provides an overview of the testing setup for the Swamp Kings project, including installation instructions, how to run tests, and explanations of the test files.

---

## Installation

1. **Install Jest and Related Dependencies**:
   Run the following command to install Jest and its related dependencies:
   ```bash
   npm install jest @testing-library/react @testing-library/jest-dom babel-jest --save-dev
   ```

2. **Install Babel Presets**:
   If not already installed, add Babel presets for transpiling modern JavaScript and React:
   ```bash
   npm install @babel/preset-env @babel/preset-react --save-dev
   ```

3. **Verify Installation**:
   Ensure the following dependencies are listed in your `devDependencies` in `package.json`:
   ```json
   "devDependencies": {
     "jest": "^29.0.0",
     "babel-jest": "^29.0.0",
     "@testing-library/react": "^14.0.0",
     "@testing-library/jest-dom": "^6.0.0",
     "@babel/preset-env": "^7.22.0",
     "@babel/preset-react": "^7.22.0"
   }
   ```

---

## Running Tests

1. **Run All Tests**:
   Use the following command to run all Jest tests:
   ```bash
   npm test
   ```

2. **Run Tests in Watch Mode**:
   To run tests in watch mode (useful during development):
   ```bash
   npm run test:watch
   ```

3. **View Test Coverage**:
   To generate a test coverage report:
   ```bash
   npx jest --coverage
   ```

---

## Test Files Overview

### Unit Tests
Unit tests verify the functionality of individual components or utility functions.

- **`App.test.js`**:
  - Tests the `App` component to ensure it renders the main heading, handles children components, and optionally renders a button.

- **`utils.test.js`**:
  - Tests utility functions like `add` and `subtract` to ensure they perform basic arithmetic correctly.

- **`utilsEdgeCases.test.js`**:
  - Tests edge cases for utility functions, such as handling zero and negative numbers.

- **`Button.test.js`**:
  - Tests the `Button` component to ensure it renders correctly and calls the `onClick` handler when clicked.

---

### Integration Tests
Integration tests verify how multiple components work together.

- **`AppIntegration.test.js`**:
  - Tests the `App` component with a `Button` to ensure they interact correctly.
  - Verifies that multiple children components render properly.

- **`ButtonIntegration.test.js`**:
  - Tests the `Button` component in a stateful parent component to ensure it updates the state correctly (e.g., incrementing a counter).

---

### Component-Specific Tests
These tests focus on individual components.

- **`Header.test.js`**:
  - Tests the `Header` component to ensure it renders the title and subtitle correctly.

- **`Footer.test.js`**:
  - Tests the `Footer` component to ensure it renders copyright text and dynamic links.

- **`Form.test.js`**:
  - Tests the `Form` component to ensure it renders input fields and calls the `onSubmit` handler with the correct data.

---

### End-to-End Tests
End-to-end tests simulate user interactions across the application.

- **`EndToEnd.test.js`**:
  - Tests the `App` component with dynamic content and user interactions.
  - Verifies that a button click triggers the correct behavior.

---

## Configuration Files

### Jest Configuration
The Jest configuration is defined in `jest.config.js`:
```javascript
// filepath: /Users/michaelsawarynski/swamp-kings/jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: ["/node_modules/"],
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/"]
};
```

### Babel Configuration
The Babel configuration is defined in `babel.config.js`:
```javascript
// filepath: /Users/michaelsawarynski/swamp-kings/babel.config.js
module.exports = {
  presets: [
    "@babel/preset-env",
    "@babel/preset-react"
  ]
};
```

### Jest Setup
The Jest setup file extends DOM assertions:
```javascript
// filepath: /Users/michaelsawarynski/swamp-kings/jest.setup.js
require("@testing-library/jest-dom");
```

---

## Adding New Tests

1. **Create a Test File**:
   Add a new test file in the `__tests__` directory. For example:
   ```bash
   touch __tests__/NewComponent.test.js
   ```

2. **Write Tests**:
   Use the following template to write new tests:
   ```javascript
   import React from "react";
   import { render, screen } from "@testing-library/react";
   import NewComponent from "../src/NewComponent";

   describe("NewComponent Tests", () => {
     test("renders correctly", () => {
       render(<NewComponent />);
       const element = screen.getByText(/example text/i);
       expect(element).toBeInTheDocument();
     });
   });
   ```

3. **Run the Tests**:
   Run the tests using:
   ```bash
   npm test
   ```

---

## Troubleshooting

1. **Tests Failing**:
   - Check the error message for details.
   - Ensure the component or function being tested is implemented correctly.
   - Verify that the selectors used in the test match the rendered DOM.

2. **Test Coverage**:
   - If coverage is low, add more tests to cover untested code paths.

3. **Debugging**:
   - Use `console.log` statements in your tests or application code to debug issues.
   - Run tests in watch mode for faster feedback.

---

This guide should help you understand and manage the testing setup for your project. Let me know if you need further clarification!
