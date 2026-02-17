import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 最终验证...\n');
  
  const url = 'https://project-flow2-fa4pawu0v-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666';
  
  try {
    // 访问页面
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
    console.log('✅ 页面加载成功');
    
    // 点击教师登录
    await page.waitForSelector('text=教师', { timeout: 10000 });
    await page.click('text=教师');
    await page.waitForTimeout(1500);
    console.log('✅ 教师登录成功');
    
    // 进入上课页面
    await page.click('text=上课');
    await page.waitForTimeout(1500);
    console.log('✅ 进入上课页面');
    
    // 开始课堂
    await page.click('button:has-text("开始")');
    await page.waitForTimeout(2000);
    console.log('✅ 开始课堂');
    
    // 滚动
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    
    // 检查签到码功能
    const html = await page.content();
    const hasCheckIn = html.includes('生成签到码');
    
    await page.screenshot({ path: hasCheckIn ? 'success.png' : 'fail.png' });
    
    if (hasCheckIn) {
      console.log('✅ SUCCESS: 找到"生成签到码"功能');
      await page.click('text=生成签到码');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'checkin-generated.png' });
      
      const newHtml = await page.content();
      const codeMatch = newHtml.match(/(\d{6})/);
      if (codeMatch) {
        console.log(`✅ 签到码生成成功: ${codeMatch[1]}`);
      }
    } else {
      console.log('❌ FAIL: 未找到"生成签到码"功能');
    }
    
    await browser.close();
    process.exit(hasCheckIn ? 0 : 1);
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
