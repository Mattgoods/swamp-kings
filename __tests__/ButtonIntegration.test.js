import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../src/Button";

function TestComponent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <Button text="Increment" onClick={() => setCount(count + 1)} />
    </div>
  );
}

describe("Button Integration Tests", () => {
  test("increments count on button click", () => {
    render(<TestComponent />);

    const button = screen.getByRole("button", { name: /increment/i });
    const countText = screen.getByText(/count: 0/i);

    expect(countText).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
});
