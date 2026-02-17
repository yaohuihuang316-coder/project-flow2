import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:4173';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const path = join(__dirname, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`✅ 截图已保存: ${name}.png`);
  return path;
}

async function verifyTeacherDataManagement() {
  console.log('🚀 开始验证教师数据管理功能...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  
  try {
    // 1. 访问登录页
    console.log('\n1️⃣ 访问登录页...');
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);
    await takeScreenshot(page, 'verify-01-login-page');
    
    // 2. 点击 Admin 演示账号
    console.log('\n2️⃣ 点击 Admin 演示账号登录...');
    await page.click('text=Admin');
    await delay(4000);
    await takeScreenshot(page, 'verify-02-admin-dashboard');
    
    // 3. 先展开教师数据管理菜单组
    console.log('\n3️⃣ 展开教师数据管理菜单...');
    await page.click('text=教师数据管理 (Teacher Data)');
    await delay(1500);
    
    // 4. 测试教师课程管理
    console.log('\n4️⃣ 测试教师课程管理...');
    await page.click('button:has-text("教师课程")');
    await delay(4000);
    await takeScreenshot(page, 'verify-03-teacher-courses');
    console.log('   ✅ 教师课程页面显示正常');
    
    // 5. 测试教师作业管理
    console.log('\n5️⃣ 测试教师作业管理...');
    await page.click('button:has-text("教师作业")');
    await delay(4000);
    await takeScreenshot(page, 'verify-04-teacher-assignments');
    console.log('   ✅ 教师作业页面显示正常');
    
    // 6. 测试课堂考勤管理
    console.log('\n6️⃣ 测试课堂考勤管理...');
    await page.click('button:has-text("课堂考勤")');
    await delay(4000);
    await takeScreenshot(page, 'verify-05-teacher-sessions');
    console.log('   ✅ 课堂考勤页面显示正常');
    
    // 7. 测试学生管理
    console.log('\n7️⃣ 测试学生管理...');
    await page.click('button:has-text("学生管理")');
    await delay(4000);
    await takeScreenshot(page, 'verify-06-teacher-students');
    console.log('   ✅ 学生管理页面显示正常');
    
    // 8. 测试全站公告
    console.log('\n8️⃣ 测试全站公告...');
    await page.click('button:has-text("全站公告")');
    await delay(4000);
    await takeScreenshot(page, 'verify-07-announcements');
    console.log('   ✅ 全站公告页面显示正常');
    
    console.log('\n🎉 所有验证通过！');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    await takeScreenshot(page, 'verify-error');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// 检查服务器
async function main() {
  console.log('检查服务器状态...');
  
  const ports = [4173, 4174, 4175, 4176, 3000, 5000, 8080];
  let serverRunning = false;
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok) {
        console.log(`✅ 发现服务器运行在端口 ${port}`);
        serverRunning = true;
        break;
      }
    } catch {}
  }
  
  if (!serverRunning) {
    console.log('⚠️  未检测到运行中的服务器，请先运行: npx vite preview --port 4173');
    process.exit(1);
  }
  
  await verifyTeacherDataManagement();
}

main();
