#!/usr/bin/env node
/**
 * Admin Panel Verification - 后台管理验证
 * 增加等待时间，确保正确进入后台
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'https://project-flow2.vercel.app';

async function captureScreenshot(page, name) {
  await page.screenshot({ path: `verify-${name}.png`, fullPage: true });
  console.log(`📸 verify-${name}.png`);
}

async function waitForPageLoad(page, timeout = 10000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
    await setTimeout(3000); // 额外等待3秒确保渲染完成
    return true;
  } catch (e) {
    console.log('⚠️ 页面加载超时，继续执行...');
    return false;
  }
}

async function loginAsAdmin(page) {
  console.log('\n=== 登录后台管理 ===');
  
  // 1. 访问登录页
  await page.goto(`${BASE_URL}/auth`);
  await waitForPageLoad(page);
  await captureScreenshot(page, 'admin-01-login-page');
  
  // 2. 点击 Admin 按钮
  console.log('点击 Admin 演示账号...');
  const adminButton = await page.$('button:has-text("Admin")');
  if (!adminButton) {
    throw new Error('未找到 Admin 按钮');
  }
  
  await adminButton.click();
  
  // 3. 等待更长时间让登录完成
  console.log('等待登录完成（10秒）...');
  await setTimeout(10000);
  
  // 4. 检查当前 URL
  const currentUrl = page.url();
  console.log('当前 URL:', currentUrl);
  
  // 5. 如果不是 admin 页面，手动跳转
  if (!currentUrl.includes('/admin')) {
    console.log('未自动跳转到 admin，手动导航...');
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await waitForPageLoad(page);
  }
  
  await captureScreenshot(page, 'admin-02-after-login');
  
  // 6. 检查是否已登录
  const content = await page.content();
  const isLoggedIn = content.includes('Admin') || 
                     content.includes('管理') || 
                     content.includes('Dashboard') ||
                     content.includes('仪表盘');
  
  if (!isLoggedIn) {
    console.log('⚠️ 可能未正确登录，但继续尝试...');
  } else {
    console.log('✅ 登录状态检测到');
  }
  
  return isLoggedIn;
}

async function verifyAdminTeachers(page) {
  console.log('\n=== 验证教师管理 ===');
  
  // 1. 导航到用户管理
  console.log('导航到用户管理...');
  
  // 尝试点击侧边栏菜单
  try {
    const usersLink = await page.$('text=用户管理');
    if (usersLink) {
      await usersLink.click();
      console.log('点击"用户管理"链接');
    } else {
      // 直接导航
      await page.goto(`${BASE_URL}/admin/users`);
      console.log('直接导航到 /admin/users');
    }
  } catch (e) {
    await page.goto(`${BASE_URL}/admin/users`);
    console.log('直接导航到 /admin/users');
  }
  
  await waitForPageLoad(page);
  await setTimeout(5000); // 额外等待
  await captureScreenshot(page, 'admin-03-teachers-page');
  
  // 2. 检查页面内容
  const content = await page.content();
  const url = page.url();
  console.log('当前 URL:', url);
  
  // 3. 检查关键元素
  const checks = {
    hasTeacherKeyword: content.includes('教师') || content.includes('teacher'),
    hasTable: content.includes('<table') || content.includes('table'),
    hasStats: content.includes('总数') || content.includes('统计'),
    hasList: content.includes('列表') || content.includes('List'),
    isNotLoginPage: !content.includes('请输入您的邮箱') && !content.includes('欢迎回来')
  };
  
  console.log('\n检查结果:');
  for (const [key, value] of Object.entries(checks)) {
    console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
  }
  
  if (checks.isNotLoginPage && (checks.hasTeacherKeyword || checks.hasTable)) {
    console.log('\n✅ 教师管理页面验证成功！');
    return true;
  } else {
    console.log('\n❌ 教师管理页面验证失败');
    return false;
  }
}

async function verifyAdminAnnouncements(page) {
  console.log('\n=== 验证公告管理 ===');
  
  // 1. 导航到公告管理
  console.log('导航到公告管理...');
  
  try {
    const annLink = await page.$('text=全站公告') || await page.$('text=公告');
    if (annLink) {
      await annLink.click();
      console.log('点击"公告"链接');
    } else {
      await page.goto(`${BASE_URL}/admin/announcements`);
      console.log('直接导航到 /admin/announcements');
    }
  } catch (e) {
    await page.goto(`${BASE_URL}/admin/announcements`);
    console.log('直接导航到 /admin/announcements');
  }
  
  await waitForPageLoad(page);
  await setTimeout(5000);
  await captureScreenshot(page, 'admin-04-announcements-page');
  
  // 2. 检查页面内容
  const content = await page.content();
  const url = page.url();
  console.log('当前 URL:', url);
  
  const checks = {
    hasAnnouncementKeyword: content.includes('公告') || content.includes('Announcement'),
    hasCreateButton: content.includes('发布') || content.includes('创建') || content.includes('Add'),
    hasList: content.includes('列表') || content.includes('List') || content.includes('table'),
    isNotLoginPage: !content.includes('请输入您的邮箱')
  };
  
  console.log('\n检查结果:');
  for (const [key, value] of Object.entries(checks)) {
    console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
  }
  
  if (checks.isNotLoginPage && checks.hasAnnouncementKeyword) {
    console.log('\n✅ 公告管理页面验证成功！');
    return true;
  } else {
    console.log('\n❌ 公告管理页面验证失败');
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('  后台管理验证 - 增加等待时间');
  console.log('========================================');
  console.log(`目标: ${BASE_URL}\n`);
  
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 100 // 减慢操作以便观察
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: 'videos/' } // 录制视频以便调试
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 登录
    const loggedIn = await loginAsAdmin(page);
    
    // 2. 验证教师管理
    const teachersOk = await verifyAdminTeachers(page);
    
    // 3. 验证公告管理
    const announcementsOk = await verifyAdminAnnouncements(page);
    
    // 4. 总结
    console.log('\n========================================');
    console.log('  验证总结');
    console.log('========================================');
    console.log(`教师管理: ${teachersOk ? '✅ 通过' : '❌ 失败'}`);
    console.log(`公告管理: ${announcementsOk ? '✅ 通过' : '❌ 失败'}`);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ 验证出错:', error.message);
    await captureScreenshot(page, 'admin-error');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
