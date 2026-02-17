import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 验证签到码功能...\n');
  
  const url = 'https://project-flow2-fa4pawu0v-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666';
  
  // 登录并进入课堂
  await page.goto(url);
  await page.click('text=教师');
  await page.waitForTimeout(1500);
  await page.click('text=上课');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("开始")');
  await page.waitForTimeout(2000);
  
  // 滚动
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  
  // 检查 HTML
  const html = await page.content();
  
  console.log('📋 验证结果:');
  const hasCheckIn = html.includes('生成签到码');
  console.log(hasCheckIn ? '✅ 找到"生成签到码"功能' : '❌ 仍未找到"生成签到码"功能');
  
  if (hasCheckIn) {
    await page.click('text=生成签到码');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'success-checkin.png' });
    console.log('✅ 签到码生成截图: success-checkin.png');
    
    const newHtml = await page.content();
    const codeMatch = newHtml.match(/(\d{6})/);
    if (codeMatch) {
      console.log(`✅ 签到码显示成功: ${codeMatch[1]}`);
    }
  } else {
    await page.screenshot({ path: 'fail-checkin.png' });
    console.log('❌ 截图: fail-checkin.png');
  }
  
  await browser.close();
  
  // 返回结果供流程判断
  process.exit(hasCheckIn ? 0 : 1);
})();
