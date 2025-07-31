const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 3000;

// This MUST be the correct root domain of your Netlify site
const allowedOrigin = 'https://stellular-sprite-eafc19.netlify.app';

const corsOptions = { origin: allowedOrigin };
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.post('/generate-pdf', async (req, res) => {
  const { html, css } = req.body;

  if (!html) {
    return res.status(400).send('HTML content is required');
  }

  // HERE IS THE CRITICAL PART
  const fullHtmlDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        
        <!-- This tells Puppeteer where to find relative files like css/style.css -->
        <base href="${allowedOrigin}">

        <!-- This injects your <link rel="stylesheet" href="css/style.css"> tag -->
        ${css}
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  // ... (the rest of your puppeteer launch and PDF generation code is correct)
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    // Using networkidle0 gives the browser time to fetch the external CSS file
    await page.setContent(fullHtmlDoc, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=document-with-styles.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error during PDF generation:', error);
    if (browser) await browser.close();
    res.status(500).send('Error generating PDF');
  }
});

app.listen(port, () => {
  console.log(`Server is running. Listening for requests from ${allowedOrigin}`);
});
