const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 访问页面
  await page.goto('https://project-flow2-pjq8ev2rl-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666');
  
  console.log('页面已加载');
  
  // 等待登录页面
  await page.waitForSelector('text=演示账号', { timeout: 10000 });
  console.log('找到演示账号按钮');
  
  // 点击教师按钮
  await page.click('text=教师');
  console.log('点击教师按钮');
  
  // 等待登录完成
  await page.waitForTimeout(2000);
  
  // 截图
  await page.screenshot({ path: 'teacher-logged-in.png' });
  console.log('截图已保存: teacher-logged-in.png');
  
  // 寻找上课导航
  const hasClassroom = await page.locator('text=上课').first().isVisible().catch(() => false);
  console.log('是否有上课按钮:', hasClassroom);
  
  if (hasClassroom) {
    await page.click('text=上课');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'classroom-page.png' });
    console.log('截图已保存: classroom-page.png');
  }
  
  await browser.close();
})();
