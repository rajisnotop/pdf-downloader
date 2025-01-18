import type { NextApiRequest, NextApiResponse } from 'next';
import type { Browser, Page } from 'puppeteer';
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
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
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

    // Wait for jsPDF to load
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
      const container = document.querySelector('.ndfHFb-c4YZDc-Wrql6b');
      if (!container) throw new Error('PDF container not found');

      // Get all pages
      const pages = container.querySelectorAll('.ndfHFb-c4YZDc-cYSp0e-DARUcf');
      if (!pages.length) throw new Error('No pages found');

      // Convert pages to images
      const images: string[] = [];
      for (const page of pages) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        const img = page.querySelector('img');
        if (!img) continue;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        images.push(canvas.toDataURL('image/jpeg', 0.95));
      }

      // Create PDF
      let pdf: any;
      let processedImages = 0;

      for (const imgData of images) {
        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => img.onload = resolve);

        const orientation = (img.width > img.height) ? 'landscape' : 'portrait';

        if (processedImages === 0) {
          // @ts-ignore
          pdf = new window.jsPDF(orientation);
        } else {
          // @ts-ignore
          pdf.addPage(orientation);
        }

        // Calculate dimensions to fit page
        const pageWidth = orientation === 'landscape' ? 297 : 210;
        const pageHeight = orientation === 'landscape' ? 210 : 297;

        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;

        let imgWidth = pageWidth - 20;
        let imgHeight = imgWidth / imgRatio;

        if (imgHeight > pageHeight - 20) {
          imgHeight = pageHeight - 20;
          imgWidth = imgHeight * imgRatio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        // @ts-ignore
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
        processedImages++;
      }

      // @ts-ignore
      return pdf.output('arraybuffer');
    });

    return Buffer.from(pdfBase64);
  } catch (error) {
    console.error('Error in downloadProtectedPDF:', error);
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
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
    const pdf = await downloadProtectedPDF(url);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=download.pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
