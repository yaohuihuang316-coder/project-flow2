import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 检查页面 HTML...\n');
  
  // 登录并进入课堂
  await page.goto('https://project-flow2-mo2ay1u6f-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666');
  await page.click('text=教师');
  await page.waitForTimeout(1500);
  await page.click('text=上课');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("开始")');
  await page.waitForTimeout(2000);
  
  // 滚动到签到区域
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  
  // 获取页面 HTML
  const html = await page.content();
  
  // 检查关键内容
  console.log('📋 HTML 内容检查:');
  console.log('- 包含"签到码区域":', html.includes('签到码区域'));
  console.log('- 包含"生成签到码":', html.includes('生成签到码'));
  console.log('- 包含"localStorage":', html.includes('localStorage'));
  console.log('- 包含"checkin_code":', html.includes('checkin_code'));
  
  // 检查是否有蓝色签到码区域样式
  console.log('- 包含"from-blue-50":', html.includes('from-blue-50'));
  
  await browser.close();
})();
