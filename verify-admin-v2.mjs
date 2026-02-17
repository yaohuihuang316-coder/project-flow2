#!/usr/bin/env node
/**
 * Admin Panel Verification V2 - 修复登录问题
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'https://project-flow2.vercel.app';

async function captureScreenshot(page, name) {
  await page.screenshot({ path: `verify-v2-${name}.png`, fullPage: true });
  console.log(`📸 verify-v2-${name}.png`);
}

async function main() {
  console.log('========================================');
  console.log('  后台管理验证 V2 - 修复登录');
  console.log('========================================\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  try {
    // Step 1: 访问登录页
    console.log('Step 1: 访问登录页...');
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    await setTimeout(3000);
    await captureScreenshot(page, '01-login');
    
    // Step 2: 找到并点击 Admin 按钮
    console.log('\nStep 2: 点击 Admin 演示账号...');
    
    // 使用更精确的选择器
    const adminButton = await page.locator('button:has-text("Admin")').first();
    
    if (!adminButton) {
      throw new Error('未找到 Admin 按钮');
    }
    
    // 等待按钮可点击
    await adminButton.waitFor({ state: 'visible' });
    
    // 点击按钮
    await adminButton.click();
    
    // 等待更长时间让登录完成
    console.log('等待登录完成...');
    await setTimeout(8000);
    
    await captureScreenshot(page, '02-after-click');
    
    // Step 3: 检查当前状态
    console.log('\nStep 3: 检查登录状态...');
    const url = page.url();
    console.log('当前 URL:', url);
    
    const content = await page.content();
    const isLoggedIn = !content.includes('欢迎回来') && !content.includes('请输入您的邮箱');
    
    if (isLoggedIn) {
      console.log('✅ 登录成功！');
    } else {
      console.log('⚠️ 可能未登录，继续尝试访问后台...');
    }
    
    // Step 4: 访问教师管理
    console.log('\nStep 4: 访问教师管理页面...');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await setTimeout(5000);
    await captureScreenshot(page, '03-teachers');
    
    const teacherContent = await page.content();
    console.log('页面内容包含"教师":', teacherContent.includes('教师'));
    console.log('页面内容包含"table":', teacherContent.includes('table'));
    console.log('当前 URL:', page.url());
    
    // Step 5: 访问公告管理
    console.log('\nStep 5: 访问公告管理页面...');
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForLoadState('networkidle');
    await setTimeout(5000);
    await captureScreenshot(page, '04-announcements');
    
    const annContent = await page.content();
    console.log('页面内容包含"公告":', annContent.includes('公告'));
    console.log('当前 URL:', page.url());
    
    console.log('\n========================================');
    console.log('  验证完成');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    await captureScreenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
