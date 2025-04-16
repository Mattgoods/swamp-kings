import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../src/Button";

describe("Button Component", () => {
  test("renders with correct text", () => {
    render(<Button text="Click Me" />);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button text="Click Me" onClick={handleClick} />);
    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
