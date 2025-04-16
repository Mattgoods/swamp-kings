import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

describe("App Component", () => {
  test("renders the main heading", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { name: /welcome to swamp kings/i });
    expect(heading).toBeInTheDocument();
  });

  test("renders a button if present", () => {
    render(<App />);
    const button = screen.queryByRole("button");
    expect(button).not.toBeInTheDocument(); // Adjust if a button exists
  });

  test("renders children components", () => {
    const { container } = render(
      <App>
        <p>Test Child</p>
      </App>
    );
    expect(container).toHaveTextContent("Test Child");
  });
});
