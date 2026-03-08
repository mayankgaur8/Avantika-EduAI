"use strict";

const puppeteer = require("puppeteer");
const { buildPdfHtml } = require("./template");

/**
 * Generates a PDF buffer from a quiz object.
 *
 * @param {Object} quiz              - Quiz JSON (from Claude or DB)
 * @param {Object} options
 * @param {boolean} options.includeAnswers - true = answer key edition
 * @param {string}  options.schoolName    - Printed in the header
 * @returns {Promise<Buffer>}         - Raw PDF bytes
 */
async function generateQuizPdf(quiz, options = {}) {
  const html = buildPdfHtml(quiz, options);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // required on Azure / Docker
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0px",
        bottom: "20px",
        left: "0px",
        right: "0px",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generateQuizPdf };
