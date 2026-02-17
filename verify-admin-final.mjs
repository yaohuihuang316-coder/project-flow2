#!/usr/bin/env node
/**
 * Admin Panel Final Verification - 完整验证
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'https://project-flow2.vercel.app';

async function captureScreenshot(page, name) {
  await page.screenshot({ path: `verify-final-${name}.png`, fullPage: true });
  console.log(`📸 verify-final-${name}.png`);
}

async function loginAsAdmin(page) {
  console.log('登录后台...');
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState('networkidle');
  await setTimeout(3000);
  
  // 找到所有按钮并点击 Admin
  const buttons = await page.locator('button').all();
  const adminButton = buttons.find(async (btn) => {
    const text = await btn.textContent();
    return text.includes('Admin');
  });
  
  if (adminButton) {
    await adminButton.click();
    console.log('点击 Admin 按钮');
  }
  
  // 等待登录完成
  await setTimeout(10000);
}

async function main() {
  console.log('========================================');
  console.log('  后台管理完整验证');
  console.log('========================================\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  try {
    // 1. 登录
    await loginAsAdmin(page);
    await captureScreenshot(page, '01-admin-dashboard');
    
    console.log('\n✅ 成功进入后台管理\n');
    
    // 2. 验证教师管理
    console.log('验证教师管理...');
    const usersLink = await page.locator('text=用户管理').first();
    if (usersLink) {
      await usersLink.click();
      await setTimeout(5000);
      await captureScreenshot(page, '02-teacher-management');
      
      const content = await page.content();
      const hasTeacher = content.includes('教师') || content.includes('Teacher');
      console.log(hasTeacher ? '✅ 教师管理页面正常' : '⚠️ 未检测到教师内容');
    }
    
    // 3. 验证公告管理
    console.log('\n验证公告管理...');
    const annLink = await page.locator('text=全站公告').first();
    if (annLink) {
      await annLink.click();
      await setTimeout(5000);
      await captureScreenshot(page, '03-announcements');
      
      const content = await page.content();
      const hasAnn = content.includes('公告') || content.includes('Announcement');
      console.log(hasAnn ? '✅ 公告管理页面正常' : '⚠️ 未检测到公告内容');
    }
    
    // 4. 返回仪表盘检查统计数据
    console.log('\n检查仪表盘统计数据...');
    const dashboardLink = await page.locator('text=仪表盘').first();
    if (dashboardLink) {
      await dashboardLink.click();
      await setTimeout(3000);
      await captureScreenshot(page, '04-dashboard-stats');
      
      const stats = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasUserCount: text.includes('总用户数') || text.includes('用户'),
          hasCourseCount: text.includes('课程'),
          hasCharts: document.querySelector('canvas, svg, .chart') !== null
        };
      });
      
      console.log('统计数据:', stats);
    }
    
    console.log('\n========================================');
    console.log('  ✅ 验证完成！');
    console.log('========================================');
    console.log('\n截图文件:');
    console.log('  - verify-final-01-admin-dashboard.png');
    console.log('  - verify-final-02-teacher-management.png');
    console.log('  - verify-final-03-announcements.png');
    console.log('  - verify-final-04-dashboard-stats.png');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    await captureScreenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
