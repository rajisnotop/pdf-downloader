import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import axios from 'axios';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '100mb'
    }
  },
};

async function downloadProtectedPDF(url: string): Promise<Buffer> {
  let browser: puppeteer.Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate and wait for viewer
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.ndfHFb-c4YZDc-Wrql6b', { timeout: 10000 });

    // Inject jsPDF
    await page.evaluate(() => {
      // @ts-ignore - trustedTypes is not in all browser types yet
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        // @ts-ignore
        const policy = window.trustedTypes.createPolicy('myPolicy', {
          createScriptURL: (input: string) => input
        });
        const script = document.createElement('script');
        script.src = policy.createScriptURL('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        document.head.appendChild(script);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
      }
    });

    await page.waitForFunction(() => {
      // @ts-ignore
      return typeof window.jsPDF !== 'undefined';
    });

    // Scroll through document to load all pages
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Create PDF
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
          throw new Error('No PDF pages found');
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
            // @ts-ignore
            pdf = new window.jsPDF(orientation);
          } else {
            // @ts-ignore
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

          // @ts-ignore
          pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
          processedImages++;
        }

        if (processedImages === 0) {
          throw new Error('No pages were processed');
        }

        const pdfData = pdf.output('datauristring');
        resolve(pdfData.split(',')[1]);
      });
    });

    return Buffer.from(pdfBase64, 'base64');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Try direct download first for non-Google Drive PDFs
    if (!url.includes('drive.google.com')) {
      try {
        console.log('Attempting direct download...');
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        const contentType = response.headers['content-type'];
        if (contentType?.includes('application/pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=download.pdf');
          return res.send(response.data);
        }
      } catch (error) {
        console.error('Direct download failed:', error);
      }
    }

    // For Google Drive or if direct download failed, use protected PDF method
    console.log('Using protected PDF download method...');
    const pdfBuffer = await downloadProtectedPDF(url);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=download.pdf');

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ 
      error: 'Failed to download PDF. ' + (error.message || 'Please make sure the URL is correct and the PDF is accessible.'),
      details: error.toString()
    });
  }
}
