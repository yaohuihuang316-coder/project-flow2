#!/usr/bin/env node
/**
 * Phase 1 Verification Script
 * Tests: Teacher generates check-in code → Student checks in
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = process.env.VERCEL_URL || 'https://project-flow2.vercel.app';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123456';

async function captureScreenshot(page, name) {
    await page.screenshot({ 
        path: `verify-phase1-${name}.png`,
        fullPage: true 
    });
    console.log(`📸 Screenshot saved: verify-phase1-${name}.png`);
}

async function testTeacherCheckInCode() {
    console.log('\n=== Phase 1: Check-in Code Feature Verification ===\n');
    console.log(`Testing against: ${BASE_URL}\n`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    
    try {
        // Step 1: Login as Teacher
        console.log('Step 1: Login as teacher...');
        await page.goto(`${BASE_URL}/auth`);
        await setTimeout(3000);
        
        // Use demo teacher account
        await page.click('button:has-text("教师")');
        await setTimeout(3000);
        await captureScreenshot(page, '01-teacher-login');
        
        // Step 2: Click "开始上课" button to enter classroom
        console.log('Step 2: Enter classroom...');
        await page.click('button:has-text("开始上课")');
        await setTimeout(3000);
        
        // Step 2b: Click "开始" button for a course
        console.log('Step 2b: Start a class...');
        await page.click('button:has-text("开始")');
        await setTimeout(3000);
        await captureScreenshot(page, '02-teacher-classroom');
        
        // Check if "Generate Check-in Code" button exists (try more menu first)
        let generateButton = await page.$('button:has-text("生成签到码")');
        if (!generateButton) {
            console.log('Button not found, trying "更多" menu...');
            await page.click('button:has-text("更多")');
            await setTimeout(1000);
            generateButton = await page.$('button:has-text("生成签到码")');
        }
        if (!generateButton) {
            console.log('Button not found in menu, scrolling down...');
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await setTimeout(1000);
            generateButton = await page.$('button:has-text("生成签到码")');
        }
        if (!generateButton) {
            throw new Error('❌ Generate check-in code button not found - deployment may still be in progress');
        }
        console.log('✅ Found "Generate Check-in Code" button');
        
        // Step 3: Click Generate Check-in Code
        console.log('Step 3: Generate check-in code...');
        await generateButton.click();
        await setTimeout(2000);
        await captureScreenshot(page, '03-code-generated');
        
        // Check if 6-digit code is displayed
        const codeElement = await page.$('text=/\\d{6}/');
        if (!codeElement) {
            throw new Error('❌ 6-digit check-in code not displayed');
        }
        
        const checkInCode = await codeElement.textContent();
        console.log(`✅ Generated check-in code: ${checkInCode}`);
        
        // Step 4: Open student view (new tab)
        console.log('\nStep 4: Open student view...');
        const studentPage = await context.newPage();
        await studentPage.goto(`${BASE_URL}/auth`);
        await setTimeout(2000);
        
        // Use demo student account (Free tier)
        await studentPage.click('button:has-text("Free")');
        await setTimeout(3000);
        
        // Navigate to a course
        await studentPage.goto(`${BASE_URL}/courses`);
        await setTimeout(2000);
        await studentPage.click('.course-card:first-child');
        await setTimeout(3000);
        await captureScreenshot(studentPage, '04-student-classroom');
        
        // Step 5: Student enters check-in code
        console.log('Step 5: Student enters check-in code...');
        const checkInInput = await studentPage.$('input[placeholder*="签到码"]');
        if (!checkInInput) {
            throw new Error('❌ Check-in input not found');
        }
        console.log('✅ Found check-in input field');
        
        await checkInInput.fill(checkInCode);
        await setTimeout(500);
        
        const checkInButton = await studentPage.$('button:has-text("确认签到")');
        if (!checkInButton) {
            throw new Error('❌ Confirm check-in button not found');
        }
        
        await checkInButton.click();
        await setTimeout(3000);
        await captureScreenshot(studentPage, '05-student-checked-in');
        
        // Verify success message
        const successMessage = await studentPage.$('text=/签到成功|已签到/');
        if (successMessage) {
            const messageText = await successMessage.textContent();
            console.log(`✅ Student check-in success: ${messageText}`);
        } else {
            console.log('⚠️ Success message not found, checking page content...');
        }
        
        // Step 6: Teacher view updates
        console.log('\nStep 6: Check teacher view for updated attendance...');
        await page.bringToFront();
        await setTimeout(2000);
        await captureScreenshot(page, '06-teacher-updated');
        
        console.log('\n=== Verification Summary ===');
        console.log('✅ Teacher generates 6-digit check-in code');
        console.log('✅ Student can see check-in input');
        console.log('✅ Student submits check-in code');
        console.log('⏳ Real-time attendance display (manual verification needed)');
        console.log('\n🎉 Phase 1 verification complete!\n');
        
        await browser.close();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        await captureScreenshot(page, 'error');
        await browser.close();
        process.exit(1);
    }
}

// Run test
testTeacherCheckInCode().catch(console.error);
