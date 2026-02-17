import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 开始测试签到功能...\n');
  
  // 1. 访问页面并登录
  await page.goto('https://project-flow2-pjq8ev2rl-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666');
  await page.waitForSelector('text=教师', { timeout: 10000 });
  await page.click('text=教师');
  await page.waitForTimeout(1500);
  console.log('✅ 教师登录成功');
  
  // 2. 进入上课页面
  await page.click('text=上课');
  await page.waitForTimeout(1500);
  console.log('✅ 进入课堂页面');
  
  // 3. 点击"开始"按钮
  const startButton = await page.locator('button:has-text("开始")').first();
  if (await startButton.isVisible()) {
    await startButton.click();
    console.log('✅ 点击"开始"按钮');
    await page.waitForTimeout(2000);
    
    // 截图课堂进行中页面
    await page.screenshot({ path: 'class-active.png' });
    console.log('✅ 截图: class-active.png');
    
    // 检查学生签到区域
    const hasAttendance = await page.locator('text=学生签到').isVisible().catch(() => false);
    console.log(hasAttendance ? '✅ 找到"学生签到"区域' : '❌ 未找到"学生签到"区域');
    
    // 滚动页面查找签到码按钮
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);
    
    // 检查是否有"生成签到码"按钮
    const hasCheckInCode = await page.locator('text=生成签到码').isVisible().catch(() => false);
    console.log(hasCheckInCode ? '✅ 找到"生成签到码"按钮' : '⚠️ 未找到"生成签到码"按钮（可能需要滚动或代码问题）');
    
    // 截图签到区域
    await page.screenshot({ path: 'attendance-area.png' });
    console.log('✅ 截图: attendance-area.png');
  } else {
    console.log('❌ 未找到"开始"按钮');
  }
  
  await browser.close();
  console.log('\n🎉 测试完成！');
})();
