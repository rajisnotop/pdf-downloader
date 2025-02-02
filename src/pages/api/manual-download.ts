import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '100mb'
    }
  },
};

async function captureManualPDF(url: string) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate and wait for viewer
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // Inject jsPDF
    await page.evaluate(() => {
      if (window.trustedTypes && trustedTypes.createPolicy) {
        const policy = trustedTypes.createPolicy('myPolicy', {
          createScriptURL: (input: string) => input
        });
        const script = document.createElement('script');
        script.src = policy.createScriptURL('https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js');
        document.body.appendChild(script);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js';
        document.body.appendChild(script);
      }
    });

    await page.waitForFunction(() => typeof window.jsPDF !== 'undefined');

    // Create PDF from visible images
    const pdfBase64 = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const elements = document.getElementsByTagName("img");
        const blobImages = Array.from(elements)
          .filter(img => /^blob:/.test(img.src))
          // Sort images by their position in the document
          .sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectA.top - rectB.top;
          });
        
        if (blobImages.length === 0) {
          throw new Error('No PDF pages found. Please make sure to scroll through all pages.');
        }

        let pdf;
        let processedImages = 0;

        for (const img of blobImages) {
          const canvasElement = document.createElement('canvas');
          const con = canvasElement.getContext("2d");
          canvasElement.width = img.width;
          canvasElement.height = img.height;
          con.drawImage(img, 0, 0, img.width, img.height);
          const imgData = canvasElement.toDataURL("image/jpeg", 1.0);

          const orientation = (img.width > img.height) ? 'landscape' : 'portrait';

          if (processedImages === 0) {
            pdf = new jsPDF(orientation);
          } else {
            pdf.addPage(orientation);
          }

          const pageWidth = pdf.internal.pageSize.width;
          const pageHeight = pdf.internal.pageSize.height;
          const imgAspect = img.width / img.height;
          const pageAspect = pageWidth / pageHeight;

          let imgWidth, imgHeight;
          if (imgAspect > pageAspect) {
            imgWidth = pageWidth;
            imgHeight = pageWidth / imgAspect;
          } else {
            imgHeight = pageHeight;
            imgWidth = pageHeight * imgAspect;
          }

          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;

          pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
          processedImages++;
        }

        if (processedImages === 0) {
          throw new Error('No pages were processed. Please make sure to scroll through all pages.');
        }

        const pdfData = pdf.output('datauristring');
        resolve(pdfData.split(',')[1]);
      });
    });

    await browser.close();
    return Buffer.from(pdfBase64, 'base64');
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Capturing manually loaded PDF...');
    const pdfBuffer = await captureManualPDF(url);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=download.pdf');
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ 
      error: 'Failed to download PDF. ' + (error.message || 'Please make sure you have scrolled through all pages.'),
      details: error.toString()
    });
  }
}
