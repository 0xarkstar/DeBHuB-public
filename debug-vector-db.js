/**
 * Debug script to find exact error location
 */

import puppeteer from 'puppeteer';

async function debugVectorDB() {
  console.log('🔍 Starting detailed error debugging...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Capture all console messages with types
    const consoleMessages = [];
    page.on('console', msg => {
      const entry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      consoleMessages.push(entry);
      console.log(`[${entry.type.toUpperCase()}] ${entry.text}`);
      if (entry.location.url) {
        console.log(`   at ${entry.location.url}:${entry.location.lineNumber}`);
      }
    });

    // Capture page errors with stack traces
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        stack: error.stack
      });
      console.log('\n❌ PAGE ERROR:');
      console.log(error.stack || error.message);
      console.log('');
    });

    // Navigate
    console.log('Navigating to test page...\n');
    await page.goto('http://localhost:3000/vector-db-test', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get detailed error info from browser
    const errorDetails = await page.evaluate(() => {
      const errors = [];

      // Check if there are any React errors
      const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
      errorBoundaries.forEach(el => {
        errors.push({
          type: 'react-error-boundary',
          content: el.textContent
        });
      });

      // Check body content
      const bodyText = document.body.textContent;

      return {
        hasContent: bodyText.length > 100,
        bodyLength: bodyText.length,
        hasHeading: !!document.querySelector('h1'),
        hasCards: document.querySelectorAll('[class*="card"]').length,
        hasButtons: document.querySelectorAll('button').length,
        errors: errors,
        bodyPreview: bodyText.substring(0, 500)
      };
    });

    console.log('\n📊 Page Analysis:');
    console.log('='.repeat(60));
    console.log(`Body length: ${errorDetails.bodyLength} characters`);
    console.log(`Has heading: ${errorDetails.hasHeading}`);
    console.log(`Card components: ${errorDetails.hasCards}`);
    console.log(`Buttons: ${errorDetails.hasButtons}`);
    console.log(`\nBody preview:\n${errorDetails.bodyPreview}`);
    console.log('='.repeat(60));

    console.log('\n📝 Error Summary:');
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`Page errors: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.log('\n🔴 Detailed Page Errors:');
      pageErrors.forEach((err, i) => {
        console.log(`\nError ${i + 1}:`);
        console.log(err.stack || err.message);
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      consoleMessages,
      pageErrors,
      pageAnalysis: errorDetails
    };

    const fs = await import('fs');
    fs.writeFileSync('error-debug-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Detailed report saved to: error-debug-report.json');

    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved to: debug-screenshot.png');

    console.log('\nKeeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('\n❌ Debug script error:', error);
  } finally {
    await browser.close();
  }
}

debugVectorDB().catch(console.error);
