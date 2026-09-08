import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generatePDF() {
  console.log('📄 Generating PDF from SUBMISSION-DOCUMENT.html...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Load the HTML file
  const htmlPath = path.join(__dirname, 'SUBMISSION-DOCUMENT.html');
  await page.goto(`file://${htmlPath}`, { 
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  
  // Generate PDF
  const pdfPath = path.join(__dirname, 'PranaAI-iQOO-Submission.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; text-align: center; font-size: 10px; color: #94a3b8;">
        <span>PranaAI — iQOO Hackathon Submission</span>
        <span style="margin: 0 20px;">|</span>
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `
  });
  
  await browser.close();
  
  console.log(`✅ PDF generated successfully!`);
  console.log(`📁 Location: ${pdfPath}`);
  console.log(`📄 File size: ${(await import('fs')).statSync(pdfPath).size / 1024} KB`);
}

generatePDF().catch(console.error);
