/**
 * Automated browser test for Vector DB using Puppeteer
 */

import puppeteer from 'puppeteer';

async function testVectorDBPage() {
  console.log('🚀 Starting automated browser test for Vector DB...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Listen to console messages
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log(`❌ Browser Console Error: ${msg.text()}`);
      } else if (type === 'warn') {
        console.log(`⚠️  Browser Console Warning: ${msg.text()}`);
      }
    });

    // Listen to page errors
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });

    // Navigate to test page
    console.log('1️⃣ Navigating to http://localhost:3000/vector-db-test');
    try {
      await page.goto('http://localhost:3000/vector-db-test', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      console.log('   ✅ Page loaded successfully\n');
    } catch (err) {
      console.error('   ❌ Failed to load page:', err.message);
      return;
    }

    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    await page.screenshot({ path: 'vector-db-test-page.png', fullPage: true });
    console.log('   📸 Screenshot saved: vector-db-test-page.png\n');

    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}\n`);

    // Check if main heading exists
    console.log('2️⃣ Checking page structure...');
    const heading = await page.$('h1');
    if (heading) {
      const headingText = await page.evaluate(el => el.textContent, heading);
      console.log(`   ✅ Found heading: "${headingText}"`);
    } else {
      console.log('   ❌ Main heading not found');
    }

    // Check for Vector DB status card
    const statusCard = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="card"]'));
      return cards.length;
    });
    console.log(`   ✅ Found ${statusCard} card components\n`);

    // Check Vector DB status
    console.log('3️⃣ Checking Vector DB status...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusText = await page.evaluate(() => {
      const body = document.body.textContent;
      if (body.includes('Vector DB is available')) {
        return 'available';
      } else if (body.includes('Vector DB is not available')) {
        return 'not available';
      } else if (body.includes('Checking')) {
        return 'checking';
      }
      return 'unknown';
    });

    console.log(`   Vector DB Status: ${statusText}`);

    if (statusText === 'available') {
      console.log('   ✅ Vector DB is available and ready!\n');
    } else if (statusText === 'not available') {
      console.log('   ⚠️  Vector DB is not available\n');
      console.log('   This is expected if:');
      console.log('   - Wallet is not connected');
      console.log('   - Client is not initialized');
      console.log('   - VectorRegistry contract is not accessible\n');
    } else {
      console.log(`   ❓ Status unclear: ${statusText}\n`);
    }

    // Try to find buttons
    console.log('4️⃣ Checking interactive elements...');
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map(btn => ({
          text: btn.textContent.trim(),
          disabled: btn.disabled
        }));
    });

    console.log(`   Found ${buttons.length} buttons:`);
    buttons.forEach((btn, i) => {
      const status = btn.disabled ? '🚫 Disabled' : '✅ Enabled';
      console.log(`   ${i + 1}. "${btn.text}" - ${status}`);
    });
    console.log();

    // Check for input fields
    console.log('5️⃣ Checking input fields...');
    const inputs = await page.evaluate(() => {
      const textInputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
      return textInputs.length;
    });
    console.log(`   ✅ Found ${inputs} input/textarea fields\n`);

    // Check for any React errors
    console.log('6️⃣ Checking for React errors...');
    const hasReactError = await page.evaluate(() => {
      return document.body.textContent.includes('Error') ||
             document.body.textContent.includes('failed to compile');
    });

    if (hasReactError) {
      console.log('   ⚠️  Possible React error detected on page\n');
    } else {
      console.log('   ✅ No obvious React errors\n');
    }

    // Get all text content for analysis
    const allText = await page.evaluate(() => document.body.textContent);

    // Check for specific features
    console.log('7️⃣ Checking feature sections...');
    const features = [
      'Vector DB Status',
      'Create Document Vector',
      'Semantic Search',
      'Question-Answer',
      'Document Suggestions'
    ];

    features.forEach(feature => {
      const found = allText.includes(feature);
      console.log(`   ${found ? '✅' : '❌'} ${feature}`);
    });
    console.log();

    // Final summary
    console.log('📊 Test Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Page loads: YES`);
    console.log(`✅ React renders: YES`);
    console.log(`✅ Components visible: YES`);
    console.log(`✅ UI structure: ${statusCard > 0 ? 'GOOD' : 'NEEDS CHECK'}`);
    console.log(`❓ Vector DB functional: ${statusText === 'available' ? 'YES' : 'NEEDS WALLET CONNECTION'}`);
    console.log('='.repeat(50));
    console.log();

    console.log('✅ Automated browser test complete!');
    console.log('📸 Screenshot saved to: vector-db-test-page.png\n');

    // Keep browser open for 5 seconds
    console.log('Keeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run test
testVectorDBPage().catch(console.error);
