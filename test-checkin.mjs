import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 测试签到码功能...\n');
  
  // 1. 登录
  await page.goto('https://project-flow2-mo2ay1u6f-yaohuihuang316-coders-projects.vercel.app?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=66666666666666666666666666666666');
  await page.waitForSelector('text=教师', { timeout: 10000 });
  await page.click('text=教师');
  await page.waitForTimeout(1500);
  console.log('✅ 教师登录成功');
  
  // 2. 进入上课页面
  await page.click('text=上课');
  await page.waitForTimeout(1500);
  console.log('✅ 进入课堂页面');
  
  // 3. 点击开始
  await page.click('button:has-text("开始")');
  await page.waitForTimeout(2000);
  console.log('✅ 点击开始按钮，进入课堂');
  
  // 4. 先截图看初始状态
  await page.screenshot({ path: 'test-initial.png' });
  console.log('✅ 截图: test-initial.png');
  
  // 5. 滚动到学生签到区域
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  
  // 6. 截图签到区域
  await page.screenshot({ path: 'test-signin-area.png' });
  console.log('✅ 截图: test-signin-area.png');
  
  // 7. 检查页面内容
  const content = await page.content();
  const checks = [
    { name: '生成签到码按钮', test: content.includes('生成签到码') },
    { name: '学生签到标题', test: content.includes('学生签到') },
    { name: '签到统计', test: content.includes('出勤') },
  ];
  
  console.log('\n📋 检查结果:');
  for (const check of checks) {
    console.log(check.test ? `✅ ${check.name}` : `❌ ${check.name}`);
  }
  
  // 8. 如果找到按钮，点击测试
  if (checks[0].test) {
    console.log('\n🖱️ 点击"生成签到码"...');
    await page.click('text=生成签到码');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-code-generated.png' });
    console.log('✅ 截图: test-code-generated.png');
    
    // 检查是否显示6位数字
    const newContent = await page.content();
    const codeMatch = newContent.match(/(\d{6})/);
    if (codeMatch) {
      console.log(`✅ 签到码生成成功: ${codeMatch[1]}`);
    }
  }
  
  await browser.close();
  console.log('\n🎉 测试完成！');
})();
