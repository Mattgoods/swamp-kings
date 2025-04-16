import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../src/Header";

describe("Header Component", () => {
  test("renders the title", () => {
    render(<Header title="Swamp Kings" />);
    const title = screen.getByRole("heading", { name: /swamp kings/i });
    expect(title).toBeInTheDocument();
  });

  test("renders a subtitle if provided", () => {
    render(<Header title="Swamp Kings" subtitle="The best team" />);
    const subtitle = screen.getByText(/the best team/i);
    expect(subtitle).toBeInTheDocument();
  });

  test("does not render a subtitle if not provided", () => {
    render(<Header title="Swamp Kings" />);
    const subtitle = screen.queryByText(/the best team/i);
    expect(subtitle).not.toBeInTheDocument();
  });
});
