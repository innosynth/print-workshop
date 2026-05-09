import { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, paperSize, docTitle } = req.body;

  if (!html || !paperSize) {
    return res.status(400).json({ error: 'html and paperSize are required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    if (paperSize === 'thermal') {
      await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 2 });
    } else if (paperSize === 'A5') {
      await page.setViewport({ width: 826, height: 582, deviceScaleFactor: 2 });
    } else {
      await page.setViewport({ width: 793, height: 1122, deviceScaleFactor: 2 });
    }

    // Build a self-contained HTML page with the preview content
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: white; }
    body { font-family: Arial, sans-serif; }
    img { max-width: 100%; }
    table { border-collapse: collapse; }
    @page {
      size: ${paperSize === 'A4' ? 'A4 portrait' : paperSize === 'A5' ? 'A5 landscape' : '80mm auto'};
      margin: ${paperSize === 'thermal' ? '0' : '4mm'};
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

    await page.setContent(fullHtml, {
      waitUntil: ['load', 'networkidle0'],
    });

    // Wait for images to load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.querySelectorAll('img'))
          .map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
      );
    });

    const pdfBuffer = await page.pdf({
      format: paperSize === 'thermal' ? undefined : (paperSize === 'A4' ? 'A4' : 'A5'),
      printBackground: true,
      preferCSSPageSize: true,
      width: paperSize === 'thermal' ? '80mm' : undefined,
      margin: paperSize === 'thermal'
        ? { top: '2mm', right: '2mm', bottom: '2mm', left: '2mm' }
        : { top: '4mm', right: '4mm', bottom: '4mm', left: '4mm' },
    });

    await page.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${docTitle || 'document'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
  }
}
