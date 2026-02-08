#!/usr/bin/env tsx
/**
 * Test Question Generation
 *
 * Tests all AI services with existing Chapter 12 (Electricity) content
 */

import { promises as fs } from 'fs';
import path from 'path';

const API_URL = 'http://localhost:4090';
const CH12_PATH =
  '/root/apps/ncert-intelligent-viewer/content/class-10/science/chapters/ch12-electricity.md';

async function testQuestionGeneration() {
  console.log(`\n🧪 Testing Question Generation\n`);

  // Check if backend is running
  try {
    const health = await fetch(`${API_URL}/health`);
    const healthData = await health.json();
    console.log(`✓ Backend Status:`, healthData);
  } catch (error) {
    console.error(`✗ Backend not accessible. Start it with: pm2 restart ncert-backend`);
    process.exit(1);
  }

  // Load Chapter 12 content
  let content: string;
  try {
    content = await fs.readFile(CH12_PATH, 'utf-8');
    console.log(`\n✓ Loaded: ${CH12_PATH}`);
    console.log(`  Length: ${content.length} characters\n`);
  } catch (error) {
    console.error(`✗ Could not load chapter file: ${CH12_PATH}`);
    process.exit(1);
  }

  const context = content.substring(0, 2000);
  const chapterId = 'class10-science-ch12';
  const concept = 'Electricity and Ohms Law';

  console.log(`${'='.repeat(60)}\n`);

  // Test 1: Fermi Questions
  console.log(`🔬 Test 1: Fermi Question Generation`);
  try {
    const response = await fetch(`${API_URL}/api/ncert/questions/fermi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId,
        section: 'Electric Current and Circuits',
        content: context,
        difficulty: 'medium',
        count: 2,
      }),
    });

    const data = await response.json();

    if (data.success && data.questions) {
      console.log(`✓ Generated ${data.questions.length} Fermi questions:\n`);
      data.questions.forEach((q: any, i: number) => {
        console.log(`   ${i + 1}. ${q.question}`);
        console.log(`      Order of magnitude: 10^${q.orderOfMagnitude} ${q.unit || ''}`);
        if (q.hints && q.hints.length > 0) {
          console.log(`      Hints: ${q.hints.length}`);
        }
      });
    } else {
      console.log(`✗ Failed:`, data);
    }
  } catch (error: any) {
    console.log(`✗ Error:`, error.message);
  }

  console.log(`\n${'='.repeat(60)}\n`);

  // Test 2: Socratic Dialogue
  console.log(`💬 Test 2: Socratic Tutor`);
  try {
    const sessionId = `test-${Date.now()}`;

    // Start conversation
    const startResponse = await fetch(`${API_URL}/api/ncert/questions/socratic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        chapterId,
        concept,
        action: 'start',
      }),
    });

    const startData = await startResponse.json();

    if (startData.success && startData.response) {
      console.log(`✓ Opening Question:\n`);
      console.log(`   "${startData.response.message}"\n`);
      console.log(`   Type: ${startData.response.questionType}`);

      // Continue conversation
      const continueResponse = await fetch(`${API_URL}/api/ncert/questions/socratic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          chapterId,
          concept,
          userMessage: 'Voltage makes current flow through a wire',
          action: 'continue',
        }),
      });

      const continueData = await continueResponse.json();

      if (continueData.success && continueData.response) {
        console.log(`\n✓ Follow-up Question:\n`);
        console.log(`   "${continueData.response.message}"\n`);
        console.log(`   Type: ${continueData.response.questionType}`);
      }
    } else {
      console.log(`✗ Failed:`, startData);
    }
  } catch (error: any) {
    console.log(`✗ Error:`, error.message);
  }

  console.log(`\n${'='.repeat(60)}\n`);

  // Test 3: Logic Challenges
  console.log(`🧩 Test 3: Logic Challenge Generation`);
  try {
    const response = await fetch(`${API_URL}/api/ncert/questions/logic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId,
        concept,
        content: context,
        difficulty: 'medium',
        count: 2,
      }),
    });

    const data = await response.json();

    if (data.success && data.challenges) {
      console.log(`✓ Generated ${data.challenges.length} logic challenges:\n`);
      data.challenges.forEach((c: any, i: number) => {
        console.log(`   ${i + 1}. [${c.type.toUpperCase()}] ${c.question}`);
        console.log(`      Options:`);
        c.options.forEach((opt: string, j: number) => {
          const marker = j === c.correctAnswer ? '✓' : ' ';
          console.log(`      ${marker} ${String.fromCharCode(65 + j)}. ${opt}`);
        });
        console.log(`      Explanation: ${c.explanation.substring(0, 100)}...`);
      });
    } else {
      console.log(`✗ Failed:`, data);
    }
  } catch (error: any) {
    console.log(`✗ Error:`, error.message);
  }

  console.log(`\n${'='.repeat(60)}\n`);

  // Test 4: Translation
  console.log(`🌐 Test 4: Translation (English → Hindi)`);
  try {
    const textToTranslate = content.substring(0, 500);

    const response = await fetch(`${API_URL}/api/ncert/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textToTranslate,
        from: 'en',
        to: 'hi',
      }),
    });

    const data = await response.json();

    if (data.success && data.translatedText) {
      console.log(`✓ Translated ${textToTranslate.length} characters in ${data.duration}ms\n`);
      console.log(`   Original (first 100 chars):`);
      console.log(`   "${textToTranslate.substring(0, 100)}..."\n`);
      console.log(`   Translated (first 150 chars):`);
      console.log(`   "${data.translatedText.substring(0, 150)}..."\n`);
    } else {
      console.log(`✗ Failed:`, data);
    }
  } catch (error: any) {
    console.log(`✗ Error:`, error.message);
  }

  console.log(`${'='.repeat(60)}\n`);
  console.log(`✨ Test Complete!\n`);
}

testQuestionGeneration().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
