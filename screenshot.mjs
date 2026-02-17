const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const pages = [
    { url: 'http://localhost:5173/admin/teachers', name: 'admin-teachers' },
    { url: 'http://localhost:5173/admin/courses', name: 'admin-courses' },
    { url: 'http://localhost:5173/admin/assignments', name: 'admin-assignments' },
    { url: 'http://localhost:5173/admin/students', name: 'admin-students' },
  ];
  
  for (const p of pages) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${p.name}.png`, fullPage: false });
      console.log(`✓ ${p.name}.png`);
    } catch (e) {
      console.log(`✗ ${p.name}: ${e.message}`);
    }
  }
  
  await browser.close();
}

main();
