import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 访问页面
  await page.goto('https://project-flow2-pjq8ev2rl-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666');
  
  console.log('✅ 页面已加载');
  
  // 等待登录页面
  await page.waitForSelector('text=演示账号', { timeout: 10000 });
  console.log('✅ 找到演示账号按钮');
  
  // 点击教师按钮
  await page.click('text=教师');
  console.log('✅ 点击教师按钮');
  
  // 等待登录完成
  await page.waitForTimeout(2000);
  
  // 截图
  await page.screenshot({ path: 'teacher-logged-in.png' });
  console.log('✅ 截图已保存: teacher-logged-in.png');
  
  // 寻找上课导航
  const hasClassroom = await page.locator('text=上课').first().isVisible().catch(() => false);
  console.log('✅ 是否有上课按钮:', hasClassroom);
  
  if (hasClassroom) {
    await page.click('text=上课');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'classroom-page.png' });
    console.log('✅ 截图已保存: classroom-page.png');
    
    // 检查是否有课程列表或空状态
    const pageContent = await page.content();
    if (pageContent.includes('暂无待开始的课程')) {
      console.log('⚠️  课堂列表为空（正常，因为没有创建课堂数据）');
    } else if (pageContent.includes('加载课程中')) {
      console.log('⏳ 正在加载课程...');
    } else {
      console.log('✅ 课堂页面已显示');
    }
  }
  
  await browser.close();
  console.log('\n🎉 测试完成！');
})();
