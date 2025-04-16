const { Jumpman } = require("jumpman");

describe("Form Submission Tests with Jumpman", () => {
  let browser, page;

  beforeAll(async () => {
    browser = await Jumpman.launch({ headless: true });
    page = await browser.newPage();
    await page.goto("http://localhost:3000"); // Replace with your app's URL
  });

  afterAll(async () => {
    await browser.close();
  });

  test("User can fill out and submit the form", async () => {
    await page.type('input[name="name"]', "Jane Doe");
    await page.type('input[name="email"]', "jane@example.com");
    await page.click('button[type="submit"]');

    const confirmation = await page.$eval("#confirmation", (el) => el.textContent); // Replace with the actual confirmation selector
    expect(confirmation).toBe("Form submitted successfully!");
  });
});
