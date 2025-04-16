import React from "react";

function Footer({ links = [] }) {
  return (
    <footer>
      <p>© 2023 Swamp Kings</p>
      <nav>
        {links.map((link, index) => (
          <a key={index} href={link.href}>
            {link.text}
          </a>
        ))}
      </nav>
    </footer>
  );
}

export default Footer;
