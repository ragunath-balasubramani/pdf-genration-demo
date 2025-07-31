const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 3000;

// This configuration is correct.
const allowedOrigin = 'https://stellular-sprite-eafc19.netlify.app';
const corsOptions = {
  origin: allowedOrigin,
};
app.use(cors(corsOptions));

// Increase the data limit for receiving HTML content
app.use(express.json({ limit: '10mb' }));

app.post('/generate-pdf', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send('HTML content is required');
  }

  // --- CRITICAL FIX FOR PUPPETEER ---
  // Add the '--no-sandbox' arguments for containerized environments
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    // --- END OF CRITICAL FIX ---

    const page = await browser.newPage();
    // Added waitUntil option to ensure all resources (like images) are loaded
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Ensures CSS backgrounds are included in the PDF
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=generated-document.pdf'
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error during PDF generation:', error);
    if (browser) {
      await browser.close(); // Ensure the browser closes even if there's an error
    }
    res.status(500).send('Error generating PDF');
  }
});

app.listen(port, () => {
  console.log(
    `Server is running. Listening for requests from ${allowedOrigin}`
  );
  console.log('Puppeteer is configured to run in a sandboxed environment.');
});
