#!/usr/bin/env node
/**
 * Admin Panel Verification V3 - 使用直接登录
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'https://project-flow2.vercel.app';

async function captureScreenshot(page, name) {
  await page.screenshot({ path: `verify-v3-${name}.png`, fullPage: true });
  console.log(`📸 verify-v3-${name}.png`);
}

async function main() {
  console.log('========================================');
  console.log('  后台管理验证 V3 - 直接设置登录状态');
  console.log('========================================\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  try {
    // Step 1: 访问首页并设置登录状态
    console.log('Step 1: 设置 Admin 登录状态...');
    await page.goto(`${BASE_URL}/auth`);
    
    // 直接在 localStorage 设置登录信息
    await page.evaluate(() => {
      const adminUser = {
        id: 'test-admin-001',
        email: 'admin@test.com',
        name: '管理员',
        role: 'SuperAdmin',
        avatar: 'https://i.pravatar.cc/150?u=admin001',
        membershipTier: 'pro_plus',
        isLifetimeMember: true
      };
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
    });
    
    console.log('✅ 登录状态已设置');
    
    // Step 2: 刷新页面并访问后台
    console.log('\nStep 2: 访问后台仪表盘...');
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    await setTimeout(5000);
    await captureScreenshot(page, '01-admin-dashboard');
    
    const dashContent = await page.content();
    console.log('页面包含"管理":', dashContent.includes('管理'));
    console.log('页面包含"Dashboard":', dashContent.includes('Dashboard'));
    console.log('当前 URL:', page.url());
    
    // Step 3: 访问教师管理
    console.log('\nStep 3: 访问教师管理...');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await setTimeout(5000);
    await captureScreenshot(page, '02-teacher-management');
    
    const teacherContent = await page.content();
    console.log('页面包含"教师":', teacherContent.includes('教师'));
    console.log('页面包含"table":', teacherContent.includes('table'));
    console.log('当前 URL:', page.url());
    
    // Step 4: 访问公告管理
    console.log('\nStep 4: 访问公告管理...');
    await page.goto(`${BASE_URL}/admin/announcements`);
    await page.waitForLoadState('networkidle');
    await setTimeout(5000);
    await captureScreenshot(page, '03-announcements');
    
    const annContent = await page.content();
    console.log('页面包含"公告":', annContent.includes('公告'));
    console.log('页面包含"发布":', annContent.includes('发布'));
    console.log('当前 URL:', page.url());
    
    // Step 5: 尝试获取页面实际内容片段
    console.log('\nStep 5: 检查页面实际内容...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('页面文本前200字:', bodyText.substring(0, 200));
    
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
