import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 最终验证签到码功能...\n');
  
  const url = 'https://project-flow2-2zy9zdqhz-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666';
  
  try {
    await page.goto(url, { timeout: 60000 });
    await page.click('text=教师');
    await page.waitForTimeout(1500);
    await page.click('text=上课');
    await page.waitForTimeout(1500);
    await page.click('button:has-text("开始")');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    
    const html = await page.content();
    const hasCheckIn = html.includes('生成签到码');
    
    console.log(hasCheckIn ? '✅ SUCCESS: 找到"生成签到码"功能' : '❌ FAIL: 未找到');
    await page.screenshot({ path: hasCheckIn ? 'verify-success.png' : 'verify-fail.png' });
    
    if (hasCheckIn) {
      await page.click('text=生成签到码');
      await page.waitForTimeout(2000);
      const newHtml = await page.content();
      const codeMatch = newHtml.match(/(\d{6})/);
      if (codeMatch) console.log(`✅ 签到码: ${codeMatch[1]}`);
    }
    
    await browser.close();
    process.exit(hasCheckIn ? 0 : 1);
  } catch (err) {
    console.error('❌ 错误:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
