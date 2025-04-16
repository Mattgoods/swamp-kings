const { Jumpman } = require("jumpman");

describe("Navigation Tests with Jumpman", () => {
  let browser, page;

  beforeAll(async () => {
    browser = await Jumpman.launch({ hxeadless: true });
    page = await browser.newPage();
    await page.goto("http://localhost:5173"); // Replace with your app's URL
  });

  afterAll(async () => {
    await browser.close();
  });

  test("User can navigate to the About page", async () => {
    await page.click('a[href="/about"]'); // Replace with the actual selector
    const heading = await page.$eval("h1", (el) => el.textContent);
    expect(heading).toBe("About Us");
  });

  test("User can navigate to the Contact page", async () => {
    await page.click('a[href="/contact"]'); // Replace with the actual selector
    const heading = await page.$eval("h1", (el) => el.textContent);
    expect(heading).toBe("Contact Us");
  });
});
