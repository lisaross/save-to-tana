#!/usr/bin/env npx tsx

/**
 * Test runner for chunking fix verification
 * Runs tests that don't require environment variables
 */

import { execSync } from 'child_process';
import { join } from 'path';

async function runTest(testFile: string, testName: string): Promise<boolean> {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running ${testName}`);
    console.log(`${'='.repeat(60)}`);
    
    const testPath = join(__dirname, 'utils', testFile);
    execSync(`npx tsx "${testPath}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    console.log(`\n✅ ${testName} PASSED`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${testName} FAILED`);
    console.error(error);
    return false;
  }
}

async function main() {
  console.log('🚀 Running Chunking Fix Tests');
  console.log('This verifies that our fix eliminates "Content Container" wrapper nodes\n');
  
  const tests = [
    { file: 'testChunkingFix.ts', name: 'Chunking Fix Verification Test' }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    const passed = await runTest(test.file, test.name);
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Chunking fix is working correctly');
    console.log('✅ No more "Content Container" wrapper nodes');
    console.log('✅ Content is properly organized in Tana');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log('🚨 The chunking fix needs investigation');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
}); 