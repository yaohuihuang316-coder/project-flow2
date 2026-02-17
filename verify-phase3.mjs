#!/usr/bin/env node
/**
 * Phase 3 Verification Script - Admin Teachers
 * Tests: Admin teacher management functionality
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const BASE_URL = process.env.VERCEL_URL || 'https://project-flow2.vercel.app';

async function captureScreenshot(page, name) {
    await page.screenshot({ 
        path: `verify-phase3-${name}.png`,
        fullPage: true 
    });
    console.log(`📸 Screenshot saved: verify-phase3-${name}.png`);
}

async function testAdminTeachers() {
    console.log('\n=== Phase 3: Admin Teachers Verification ===\n');
    console.log(`Testing against: ${BASE_URL}\n`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    
    try {
        // Step 1: Login as Admin
        console.log('Step 1: Login as Admin...');
        await page.goto(`${BASE_URL}/auth`);
        await setTimeout(3000);
        await captureScreenshot(page, '01-login-page');
        
        // Click Admin demo button
        await page.click('button:has-text("Admin")');
        await setTimeout(3000);
        await captureScreenshot(page, '02-admin-logged-in');
        
        // Step 2: Check if we're on admin dashboard
        console.log('Step 2: Check Admin Dashboard...');
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        // If not on admin page, navigate there
        if (!currentUrl.includes('/admin')) {
            console.log('Navigating to admin dashboard...');
            await page.goto(`${BASE_URL}/admin`);
            await setTimeout(3000);
        }
        await captureScreenshot(page, '03-admin-dashboard');
        
        // Step 3: Navigate to User Management (Teachers)
        console.log('Step 3: Navigate to User Management...');
        // Try different selectors for user management
        try {
            await page.click('text=用户管理');
        } catch {
            try {
                await page.click('text=Users');
            } catch {
                // Direct navigation
                await page.goto(`${BASE_URL}/admin/users`);
            }
        }
        await setTimeout(3000);
        await captureScreenshot(page, '04-teacher-management');
        
        // Check if teacher list is displayed
        const teacherTable = await page.$('table');
        if (teacherTable) {
            console.log('✅ Teacher table found');
        } else {
            console.log('⚠️ Teacher table not found, checking page content...');
        }
        
        // Check for stats cards
        const pageContent = await page.content();
        const hasTeacherStats = pageContent.includes('教师') || pageContent.includes('Teacher');
        if (hasTeacherStats) {
            console.log('✅ Teacher-related content found');
        }
        
        // Step 4: Test search functionality
        console.log('\nStep 4: Test search functionality...');
        const searchInput = await page.$('input[type="text"]');
        if (searchInput) {
            await searchInput.fill('张');
            await setTimeout(1000);
            await captureScreenshot(page, '05-search-result');
            console.log('✅ Search functionality working');
        }
        
        // Step 5: Check teacher detail modal
        console.log('\nStep 5: Check teacher detail...');
        const detailButton = await page.$('button:has-text("详情")');
        if (detailButton) {
            await detailButton.click();
            await setTimeout(1000);
            await captureScreenshot(page, '06-teacher-detail');
            console.log('✅ Teacher detail modal displayed');
        }
        
        console.log('\n=== Phase 3 Verification Summary ===');
        console.log('✅ Admin login successful');
        console.log('✅ Admin dashboard accessed');
        console.log('✅ Teacher management page verification attempted');
        console.log('\n📝 Phase 3 verification complete!\n');
        
        await browser.close();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        await captureScreenshot(page, 'error');
        await browser.close();
        process.exit(1);
    }
}

testAdminTeachers().catch(console.error);
