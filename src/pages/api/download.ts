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

async function downloadProtectedPDF(url: string): Promise<Buffer> {
  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Navigate and wait for viewer
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await page.waitForSelector('.ndfHFb-c4YZDc-Wrql6b', { timeout: 10000 });

    // Inject jsPDF
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      type: 'text/javascript'
    });

    // Wait for jsPDF to load
    await page.waitForFunction(() => {
      // @ts-ignore
      return typeof window.jsPDF !== 'undefined';
    });

    // Generate PDF from page content
    const pdfBuffer = await page.evaluate(async () => {
      const container = document.querySelector('.ndfHFb-c4YZDc-Wrql6b');
      if (!container) throw new Error('PDF container not found');

      // Get all pages
      const pages = Array.from(container.querySelectorAll('.ndfHFb-c4YZDc-cYSp0e-DARUcf'));
      if (!pages.length) throw new Error('No pages found');

      // Convert pages to images
      const images: string[] = [];
      
      for (const page of pages) {
        const img = page.querySelector('img');
        if (!img) continue;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        images.push(canvas.toDataURL('image/jpeg', 0.95));
      }

      // Create PDF
      // @ts-ignore
      const pdf = new window.jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        const imgData = images[i];
        
        if (i > 0) {
          // @ts-ignore
          pdf.addPage();
        }

        // @ts-ignore
        pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), '', 'FAST');
      }

      // @ts-ignore
      return pdf.output('arraybuffer');
    });

    return Buffer.from(pdfBuffer);
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

    const pdf = await downloadProtectedPDF(url);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=download.pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
