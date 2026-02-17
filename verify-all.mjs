#!/usr/bin/env node
/**
 * Complete Verification Script - All Phases
 * Following workflow: Check Status → Code → Local Commit → Verify
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'https://project-flow2.vercel.app';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(type, message) {
  const color = colors[type] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

async function captureScreenshot(page, name) {
  const path = `verify-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  log('cyan', `📸 ${path}`);
  return path;
}

async function verifyAll() {
  log('blue', '\n========================================');
  log('blue', '  COMPLETE VERIFICATION - ALL PHASES');
  log('blue', '========================================\n');
  log('yellow', `Testing: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = {
    phase1: { name: '签到码功能', status: 'pending', screenshots: [] },
    phase2: { name: 'UI响应式布局', status: 'pending', screenshots: [] },
    phase3: { name: '后台教师管理', status: 'pending', screenshots: [] },
    phase4: { name: '公告管理', status: 'pending', screenshots: [] },
    phaseB: { name: '作业批改系统', status: 'pending', screenshots: [] }
  };

  try {
    // ==================== PHASE 2: UI Responsive ====================
    log('blue', '\n--- Phase 2: UI Responsive Layout ---');
    
    log('yellow', 'Step 2.1: Teacher Login...');
    await page.goto(`${BASE_URL}/auth`);
    await setTimeout(3000);
    await page.click('button:has-text("教师")');
    await setTimeout(3000);
    results.phase2.screenshots.push(await captureScreenshot(page, 'phase2-01-teacher-login'));
    
    log('yellow', 'Step 2.2: Check Dashboard Layout...');
    await page.goto(`${BASE_URL}/teacher/dashboard`);
    await setTimeout(3000);
    results.phase2.screenshots.push(await captureScreenshot(page, 'phase2-02-dashboard'));
    
    log('yellow', 'Step 2.3: Check Classroom Layout...');
    await page.goto(`${BASE_URL}/teacher/classroom`);
    await setTimeout(3000);
    results.phase2.screenshots.push(await captureScreenshot(page, 'phase2-03-classroom'));
    
    const hasSidebar = await page.$('aside') !== null || await page.$('nav') !== null;
    const pageContent = await page.content();
    const hasResponsive = pageContent.includes('lg:') || pageContent.includes('md:');
    
    if (hasSidebar) {
      log('green', '✅ Sidebar/Navigation found');
      results.phase2.status = 'passed';
    } else {
      log('red', '❌ Sidebar not found');
      results.phase2.status = 'failed';
    }

    // ==================== PHASE 3: Admin Teachers ====================
    log('blue', '\n--- Phase 3: Admin Teacher Management ---');
    
    log('yellow', 'Step 3.1: Admin Login...');
    await page.goto(`${BASE_URL}/auth`);
    await setTimeout(3000);
    await page.click('button:has-text("Admin")');
    await setTimeout(3000);
    results.phase3.screenshots.push(await captureScreenshot(page, 'phase3-01-admin-login'));
    
    log('yellow', 'Step 3.2: Navigate to Users...');
    await page.goto(`${BASE_URL}/admin/users`);
    await setTimeout(3000);
    results.phase3.screenshots.push(await captureScreenshot(page, 'phase3-02-users-page'));
    
    const usersContent = await page.content();
    const hasTeacherTable = usersContent.includes('教师') || usersContent.includes('teacher') || usersContent.includes('table');
    const hasStats = usersContent.includes('总数') || usersContent.includes('统计');
    
    if (hasTeacherTable) {
      log('green', '✅ Teacher management content found');
      results.phase3.status = 'passed';
    } else {
      log('red', '❌ Teacher management not found');
      log('yellow', '⚠️  Page URL: ' + page.url());
      results.phase3.status = 'failed';
    }

    // ==================== PHASE 4: Admin Announcements ====================
    log('blue', '\n--- Phase 4: Admin Announcements ---');
    
    log('yellow', 'Step 4.1: Navigate to Announcements...');
    await page.goto(`${BASE_URL}/admin/announcements`);
    await setTimeout(3000);
    results.phase4.screenshots.push(await captureScreenshot(page, 'phase4-01-announcements'));
    
    const announcementContent = await page.content();
    const hasAnnouncements = announcementContent.includes('公告') || announcementContent.includes('announcement');
    const hasCreateButton = announcementContent.includes('发布') || announcementContent.includes('创建');
    
    if (hasAnnouncements && hasCreateButton) {
      log('green', '✅ Announcement management found');
      results.phase4.status = 'passed';
    } else {
      log('red', '❌ Announcement management not found');
      log('yellow', '⚠️  Page URL: ' + page.url());
      results.phase4.status = 'failed';
    }

    // ==================== PHASE B: Assignment Grading ====================
    log('blue', '\n--- Phase B: Assignment Grading System ---');
    
    log('yellow', 'Step B.1: Teacher Login...');
    await page.goto(`${BASE_URL}/auth`);
    await setTimeout(3000);
    await page.click('button:has-text("教师")');
    await setTimeout(3000);
    
    log('yellow', 'Step B.2: Navigate to Assignments...');
    await page.goto(`${BASE_URL}/teacher/assignments`);
    await setTimeout(3000);
    results.phaseB.screenshots.push(await captureScreenshot(page, 'phaseB-01-assignments'));
    
    const assignmentContent = await page.content();
    const hasAssignments = assignmentContent.includes('作业') || assignmentContent.includes('assignment');
    
    if (hasAssignments) {
      log('green', '✅ Assignment page found');
      
      // Try to open detail
      const detailBtn = await page.$('button:has-text("查看"), button:has-text("详情")');
      if (detailBtn) {
        await detailBtn.click();
        await setTimeout(2000);
        results.phaseB.screenshots.push(await captureScreenshot(page, 'phaseB-02-detail'));
        
        const detailContent = await page.content();
        const hasGradeStats = detailContent.includes('平均分') || detailContent.includes('及格率');
        
        if (hasGradeStats) {
          log('green', '✅ GradeStats component found');
          results.phaseB.status = 'passed';
        } else {
          log('yellow', '⚠️  GradeStats not visible');
          results.phaseB.status = 'partial';
        }
      } else {
        log('yellow', '⚠️  No assignment detail button found');
        results.phaseB.status = 'partial';
      }
    } else {
      log('red', '❌ Assignment page not found');
      results.phaseB.status = 'failed';
    }

    // ==================== PHASE 1: Check-in Code ====================
    log('blue', '\n--- Phase 1: Check-in Code ---');
    
    log('yellow', 'Step 1.1: Teacher Login...');
    await page.goto(`${BASE_URL}/auth`);
    await setTimeout(3000);
    await page.click('button:has-text("教师")');
    await setTimeout(3000);
    
    log('yellow', 'Step 1.2: Enter Classroom...');
    await page.goto(`${BASE_URL}/teacher/classroom`);
    await setTimeout(3000);
    results.phase1.screenshots.push(await captureScreenshot(page, 'phase1-01-classroom'));
    
    // Check if "开始上课" button exists
    const startBtn = await page.$('button:has-text("开始")');
    if (startBtn) {
      await startBtn.click();
      await setTimeout(3000);
      results.phase1.screenshots.push(await captureScreenshot(page, 'phase1-02-active-class'));
      
      const classContent = await page.content();
      const hasCheckIn = classContent.includes('签到') || classContent.includes('签到码');
      
      if (hasCheckIn) {
        log('green', '✅ Check-in feature found');
        results.phase1.status = 'passed';
      } else {
        log('red', '❌ Check-in feature not found');
        results.phase1.status = 'failed';
      }
    } else {
      log('yellow', '⚠️  No start class button found');
      results.phase1.status = 'failed';
    }

    // ==================== SUMMARY ====================
    log('blue', '\n========================================');
    log('blue', '  VERIFICATION SUMMARY');
    log('blue', '========================================\n');
    
    for (const [key, result] of Object.entries(results)) {
      const icon = result.status === 'passed' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
      log(result.status === 'passed' ? 'green' : result.status === 'partial' ? 'yellow' : 'red', 
        `${icon} ${result.name}: ${result.status.toUpperCase()}`);
      log('cyan', `   Screenshots: ${result.screenshots.join(', ')}`);
    }
    
    const passed = Object.values(results).filter(r => r.status === 'passed').length;
    const total = Object.keys(results).length;
    
    log('blue', '\n----------------------------------------');
    log('green', `Passed: ${passed}/${total}`);
    log('blue', '========================================\n');

    await browser.close();
    process.exit(0);
    
  } catch (error) {
    log('red', '\n❌ Verification failed: ' + error.message);
    await captureScreenshot(page, 'error');
    await browser.close();
    process.exit(1);
  }
}

verifyAll().catch(console.error);
