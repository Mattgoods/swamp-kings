import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "../src/Footer";

describe("Footer Component", () => {
  test("renders copyright text", () => {
    render(<Footer />);
    const copyright = screen.getByText(/© 2023 swamp kings/i);
    expect(copyright).toBeInTheDocument();
  });

  test("renders links if provided", () => {
    const links = [
      { href: "/about", text: "About Us" },
      { href: "/contact", text: "Contact" },
    ];
    render(<Footer links={links} />);
    const aboutLink = screen.getByRole("link", { name: /about us/i });
    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(aboutLink).toBeInTheDocument();
    expect(contactLink).toBeInTheDocument();
  });
});
