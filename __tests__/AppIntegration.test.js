import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../src/App";
import Button from "../src/Button";

describe("App Integration Tests", () => {
  test("renders App with a Button and handles click", () => {
    const handleClick = jest.fn();
    render(
      <App>
        <Button text="Click Me" onClick={handleClick} />
      </App>
    );

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("renders App with multiple children", () => {
    render(
      <App>
        <p>Child 1</p>
        <p>Child 2</p>
      </App>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });
});
