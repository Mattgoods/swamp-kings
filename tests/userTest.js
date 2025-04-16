const { Jumpman } = require("jumpman");

describe("User Testing with Jumpman", () => {
  let browser, page;

  beforeAll(async () => {
    browser = await Jumpman.launch({ headless: true });
    page = await browser.newPage();
    await page.goto("http://localhost:5173"); // Replace with your app's URL
  });

  afterAll(async () => {
    await browser.close();
  });

  test("User can see the main heading", async () => {
    const heading = await page.$eval("h1", (el) => el.textContent);
    expect(heading).toBe("Welcome to Swamp Kings");
  });

  test("User can interact with a button", async () => {
    await page.click("button"); // Replace with the actual button selector
    const result = await page.$eval("#result", (el) => el.textContent); // Replace with the actual result selector
    expect(result).toBe("Button Clicked!");
  });

  test("User can fill out and submit a form", async () => {
    await page.type('input[name="name"]', "John Doe");
    await page.type('input[name="email"]', "john@example.com");
    await page.click('button[type="submit"]');

    const confirmation = await page.$eval("#confirmation", (el) => el.textContent); // Replace with the actual confirmation selector
    expect(confirmation).toBe("Form submitted successfully!");
  });
});
