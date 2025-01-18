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

async function downloadProtectedPDF(url: string) {
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
    await page.waitForSelector('.ndfHFb-c4YZDc-Wrql6b', { timeout: 10000 });

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

    // Scroll through document to load all pages
    await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const container = document.querySelector('.ndfHFb-c4YZDc-Wrql6b');
      if (!container) return;

      // First scroll to bottom
      container.scrollTop = container.scrollHeight;
      await sleep(2000);

      // Then scroll back up
      container.scrollTop = 0;
      await sleep(1000);

      // Click next button multiple times to ensure all pages are loaded
      for (let i = 0; i < 30; i++) {
        const nextButton = document.querySelector('.ndfHFb-c4YZDc-MZArnb-BIzmGd-fmcmS-DARUcf') as HTMLElement;
        if (!nextButton) break;
        nextButton.click();
        await sleep(500);
      }

      // Scroll back to start
      await sleep(1000);
      while (true) {
        const prevButton = document.querySelector('.ndfHFb-c4YZDc-MZArnb-BIzmGd-fmcmS-DARUcf-LgbsSe-hvhgNd') as HTMLElement;
        if (!prevButton) break;
        prevButton.click();
        await sleep(300);
      }
    });

    // Wait for images to settle
    await page.waitForTimeout(2000);

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
