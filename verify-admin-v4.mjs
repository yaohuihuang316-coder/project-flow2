#!/usr/bin/env node
/**
 * Admin Panel Verification V4 - 在页面执行登录
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'https://project-flow2.vercel.app';

async function captureScreenshot(page, name) {
  await page.screenshot({ path: `verify-v4-${name}.png`, fullPage: true });
  console.log(`📸 verify-v4-${name}.png`);
}

async function main() {
  console.log('========================================');
  console.log('  后台管理验证 V4 - 执行真实登录');
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
    await captureScreenshot(page, '01-before-login');
    
    // Step 2: 在页面上下文中执行登录
    console.log('\nStep 2: 执行 Admin 登录...');
    await page.evaluate(() => {
      // 查找 Login 组件的 handleDemoLogin 函数
      // 通过触发按钮点击事件
      const adminBtn = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Admin')
      );
      if (adminBtn) {
        adminBtn.click();
        console.log('Admin button clicked from evaluate');
      }
    });
    
    // 等待登录完成
    console.log('等待 10 秒...');
    await setTimeout(10000);
    await captureScreenshot(page, '02-after-login-click');
    
    // Step 3: 检查页面状态
    console.log('\nStep 3: 检查登录状态...');
    const url = page.url();
    console.log('当前 URL:', url);
    
    // Step 4: 直接导航到后台页面
    console.log('\nStep 4: 直接访问教师管理...');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await setTimeout(5000);
    await captureScreenshot(page, '03-teachers-page');
    
    // 检查页面是否有管理内容
    const hasAdminLayout = await page.evaluate(() => {
      // 检查是否有侧边栏或管理布局
      const sidebar = document.querySelector('aside, nav, .sidebar, .admin-layout');
      const title = document.querySelector('h1, h2');
      return {
        hasSidebar: !!sidebar,
        titleText: title ? title.textContent : 'No title found',
        bodyText: document.body.innerText.substring(0, 300)
      };
    });
    
    console.log('页面分析:');
    console.log('  有侧边栏:', hasAdminLayout.hasSidebar);
    console.log('  标题:', hasAdminLayout.titleText);
    console.log('  正文前300字:', hasAdminLayout.bodyText);
    
    // Step 5: 尝试通过按钮进入
    console.log('\nStep 5: 重新尝试点击登录...');
    await page.goto(`${BASE_URL}/auth`);
    await setTimeout(3000);
    
    // 找到 Admin 按钮并点击
    const buttons = await page.locator('button').all();
    console.log(`找到 ${buttons.length} 个按钮`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`  按钮 ${i}: ${text}`);
    }
    
    // 点击最后一个按钮（通常是 Admin）
    const adminButton = buttons[buttons.length - 1];
    await adminButton.click();
    console.log('点击了最后一个按钮');
    
    await setTimeout(10000);
    await captureScreenshot(page, '05-after-second-attempt');
    
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
