/**
 * Test RocketLang Integration with Swayam
 *
 * Run: npx ts-node test-integration.ts
 */

import { getRocketLangExecutor } from './executor.js';

async function testCommands() {
  const executor = getRocketLangExecutor();

  console.log('\n🧪 Testing RocketLang Integration\n');
  console.log('━'.repeat(50));

  // Test 1: Hindi file read command
  console.log('\n📝 Test 1: Hindi Command "पढ़ो package.json"');
  const result1 = await executor.tryExecute('पढ़ो package.json', 'hi');
  console.log('   Result:', result1?.isCommand ? '✅ Recognized as command' : '❌ Not recognized');
  if (result1) {
    console.log('   Tool:', result1.tool);
    console.log('   Success:', result1.success);
    const formatted1 = executor.formatResult(result1, 'hi');
    console.log('   Response:', formatted1.speakText);
  }

  // Test 2: English file read command
  console.log('\n📝 Test 2: English Command "read README.md"');
  const result2 = await executor.tryExecute('read README.md', 'en');
  console.log('   Result:', result2?.isCommand ? '✅ Recognized as command' : '❌ Not recognized');
  if (result2) {
    console.log('   Tool:', result2.tool);
    console.log('   Success:', result2.success);
  }

  // Test 3: List files command
  console.log('\n📝 Test 3: Hindi Command "देखो ."');
  const result3 = await executor.tryExecute('देखो .', 'hi');
  console.log('   Result:', result3?.isCommand ? '✅ Recognized as command' : '❌ Not recognized');
  if (result3) {
    console.log('   Tool:', result3.tool);
    console.log('   Files found:', (result3.data as any[])?.length);
  }

  // Test 4: Git status
  console.log('\n📝 Test 4: Git Status');
  const result4 = await executor.tryExecute('git status', 'en');
  console.log('   Result:', result4?.isCommand ? '✅ Recognized as command' : '❌ Not recognized');
  if (result4) {
    console.log('   Output:', result4.output?.substring(0, 100));
  }

  // Test 5: Non-command (should return null)
  console.log('\n📝 Test 5: Conversation "आज मौसम कैसा है?"');
  const result5 = await executor.tryExecute('आज मौसम कैसा है?', 'hi');
  console.log('   Result:', result5 === null ? '✅ Not a command (AI will handle)' : '❌ Wrong - treated as command');

  // Test 6: Search command
  console.log('\n📝 Test 6: Hindi Search "खोजो RocketLang"');
  const result6 = await executor.tryExecute('खोजो RocketLang', 'hi');
  console.log('   Result:', result6?.isCommand ? '✅ Recognized as command' : '❌ Not recognized');
  if (result6) {
    console.log('   Tool:', result6.tool);
    console.log('   Found in files:', (result6.data as string[])?.length || 0);
  }

  // Test 7: looksLikeCommand heuristic
  console.log('\n📝 Test 7: looksLikeCommand() heuristic');
  const tests = [
    { text: 'पढ़ो config.json', expected: true },
    { text: 'read package.json', expected: true },
    { text: 'git status', expected: true },
    { text: 'namaste kaise ho', expected: false },
    { text: 'आज मौसम कैसा है', expected: false },
    { text: 'list src/', expected: true },
  ];

  for (const t of tests) {
    const result = executor.looksLikeCommand(t.text);
    const passed = result === t.expected;
    console.log(`   "${t.text}" → ${result} ${passed ? '✅' : '❌'}`);
  }

  console.log('\n' + '━'.repeat(50));
  console.log('🎉 Integration Test Complete!\n');
}

// Run tests
testCommands().catch(console.error);
