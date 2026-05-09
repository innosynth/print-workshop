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
    const isDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
    const isMac = process.platform === 'darwin';
    const isArm = process.arch === 'arm64';
    
    let executablePath;
    if (isMac || isDev) {
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      // Select the correct pack based on architecture
      const packUrl = isArm 
        ? "https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.arm64.tar"
        : "https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar";
        
      executablePath = await chromium.executablePath(process.env.CHROMIUM_PACK_URL || packUrl);
    }

    browser = await puppeteer.launch({
      args: (isMac || isDev) ? ['--no-sandbox', '--disable-setuid-sandbox'] : chromium.args,
      executablePath,
      headless: 'shell',
    });

    const page = await browser.newPage();

    if (paperSize === 'thermal') {
      await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 2 });
    } else if (paperSize === 'A5') {
      await page.setViewport({ width: 826, height: 582, deviceScaleFactor: 2 });
    } else {
      await page.setViewport({ width: 793, height: 1122, deviceScaleFactor: 2 });
    }

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

    const filename = (docTitle || 'document') + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
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
