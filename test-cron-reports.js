#!/usr/bin/env node

/**
 * Script de test pour les endpoints de rapports automatisés
 *
 * Usage:
 *   node test-cron-reports.js reports
 *   node test-cron-reports.js reminders
 *   node test-cron-reports.js all
 */

require('dotenv').config({ path: '.env.local' });

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in .env.local');
  console.error('Please add CRON_SECRET to your .env.local file');
  process.exit(1);
}

const testEndpoint = async (name, path) => {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`URL: ${BASE_URL}${path}`);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR`);
    console.error('Error:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Make sure your dev server is running (npm run dev)');
    }

    return false;
  }
};

const main = async () => {
  const command = process.argv[2] || 'all';

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     FoxWise ToDo - Cron Reports Test Suite                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`CRON_SECRET: ${CRON_SECRET.substring(0, 10)}...`);

  const results = [];

  if (command === 'reports' || command === 'all') {
    const success = await testEndpoint(
      'Generate Reports (Daily + Monthly)',
      '/api/cron/generate-reports'
    );
    results.push({ name: 'Generate Reports', success });
  }

  if (command === 'reminders' || command === 'all') {
    const success = await testEndpoint(
      'Send Reminders',
      '/api/send-reminders'
    );
    results.push({ name: 'Send Reminders', success });
  }

  if (!['reports', 'all', 'reminders'].includes(command)) {
    console.log(`\n❌ Invalid command: ${command}`);
    console.log('\nUsage:');
    console.log('  node test-cron-reports.js reports    - Test generate-reports endpoint');
    console.log('  node test-cron-reports.js reminders  - Test send-reminders endpoint');
    console.log('  node test-cron-reports.js all        - Test all endpoints');
    process.exit(1);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  results.forEach(({ name, success }) => {
    console.log(`${success ? '✅' : '❌'} ${name}`);
  });

  const allPassed = results.every(r => r.success);
  const passedCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`\nTotal: ${passedCount}/${totalCount} passed`);

  if (allPassed) {
    console.log('\n🎉 All tests passed!');
    console.log('\n📧 Check your email inbox for the test reports.');
    console.log('   (Don\'t forget to check spam folder)');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }

  process.exit(allPassed ? 0 : 1);
};

main();
