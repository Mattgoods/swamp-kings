import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../src/App";
import Button from "../src/Button";

describe("End-to-End Tests", () => {
  test("renders App and interacts with Button", () => {
    const handleClick = jest.fn();
    render(
      <App>
        <Button text="Submit" onClick={handleClick} />
      </App>
    );

    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("renders App with dynamic content", () => {
    render(
      <App>
        <p>Dynamic Content</p>
      </App>
    );

    expect(screen.getByText("Dynamic Content")).toBeInTheDocument();
  });
});
