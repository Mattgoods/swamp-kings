import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Form from "../src/Form";

describe("Form Component", () => {
  test("renders input fields", () => {
    render(<Form />);
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
  });

  test("calls onSubmit with form data", () => {
    const handleSubmit = jest.fn();
    render(<Form onSubmit={handleSubmit} />);
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
    });
  });
});
