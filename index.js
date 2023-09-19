const puppeteer = require("puppeteer");

module.exports = async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://www.antena1.com.br/ouvir-radio-online");

    await page.waitForSelector(".Artist", { timeout: 180000 });
    await page.waitForSelector(".nowPlayingLink");

    const artistText = await page.$eval(".Artist", (element) => element.textContent.trim());
    const songText = await page.$eval(".nowPlayingLink", (element) => element.textContent.trim());

    await browser.close();

    const nowPlayingInfo = `${artistText} - ${songText}`.trim();

    res.status(200).json({ nowPlayingInfo });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error" });
  }
};
