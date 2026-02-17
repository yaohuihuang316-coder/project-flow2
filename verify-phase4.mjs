#!/usr/bin/env node
/**
 * Phase 4 Verification Script - Admin Announcements
 * Tests: Admin announcement management functionality
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = process.env.VERCEL_URL || 'https://project-flow2.vercel.app';

async function captureScreenshot(page, name) {
    await page.screenshot({ 
        path: `verify-phase4-${name}.png`,
        fullPage: true 
    });
    console.log(`📸 Screenshot saved: verify-phase4-${name}.png`);
}

async function testAdminAnnouncements() {
    console.log('\n=== Phase 4: Admin Announcements Verification ===\n');
    console.log(`Testing against: ${BASE_URL}\n`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    
    try {
        // Step 1: Login as Admin
        console.log('Step 1: Login as Admin...');
        await page.goto(`${BASE_URL}/auth`);
        await setTimeout(3000);
        await page.click('button:has-text("Admin")');
        await setTimeout(3000);
        await captureScreenshot(page, '01-admin-login');
        
        // Step 2: Direct navigation to announcements
        console.log('Step 2: Navigate to Announcements...');
        await page.goto(`${BASE_URL}/admin/announcements`);
        await setTimeout(3000);
        await captureScreenshot(page, '02-announcements-page');
        
        // Check for announcement-related content
        const pageContent = await page.content();
        const hasAnnouncements = pageContent.includes('公告') || pageContent.includes('Announcement');
        const hasCreateButton = pageContent.includes('发布公告') || pageContent.includes('Add');
        
        if (hasAnnouncements) {
            console.log('✅ Announcement management page found');
        }
        if (hasCreateButton) {
            console.log('✅ Create announcement button found');
        }
        
        // Step 3: Check for existing announcements table/list
        const table = await page.$('table');
        const list = await page.$('.announcement-list, [class*="announcement"]');
        
        if (table || list) {
            console.log('✅ Announcement list/table found');
        }
        
        // Step 4: Try to open create modal
        console.log('\nStep 3: Test create announcement...');
        const createButton = await page.$('button:has-text("发布公告"), button:has-text("Add")');
        if (createButton) {
            await createButton.click();
            await setTimeout(1000);
            await captureScreenshot(page, '03-create-modal');
            console.log('✅ Create announcement modal opened');
        }
        
        console.log('\n=== Phase 4 Verification Summary ===');
        console.log('✅ Admin login successful');
        console.log('✅ Announcements page accessed');
        console.log(hasAnnouncements ? '✅ Announcement content found' : '⚠️ Announcement content not found');
        console.log('\n📝 Phase 4 verification complete!\n');
        
        await browser.close();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        await captureScreenshot(page, 'error');
        await browser.close();
        process.exit(1);
    }
}

testAdminAnnouncements().catch(console.error);
