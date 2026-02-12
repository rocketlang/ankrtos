const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon'
});

// List of files that failed
const failedFiles = [
  'fees107', 'fees1gl', 'gemh108', 'gemh112', 'gemh1an',
  'gesc111', 'hemh109', 'hemh111', 'hemh1an',
  'hesc108', 'hesc109', 'hesc111', 'hesc112',
  'iesc108', 'jemh102', 'jemh105', 'jemh1ps',
  'jesc104', 'jesc108', 'kemh101', 'kemh108',
  'kemh112', 'lemh102', 'lemh106'
];

async function extractPDF(filename) {
  const pdfPath = `/root/data/ncert-extracted/${filename}.pdf`;
  const jsonPath = `./extracted-data/${filename}.json`;
  
  // Skip if already extracted
  if (fs.existsSync(jsonPath)) {
    console.log(`⏭️  Skip: ${filename} (already exists)`);
    return { status: 'skipped', filename };
  }
  
  if (!fs.existsSync(pdfPath)) {
    console.log(`❌ Missing: ${filename}.pdf`);
    return { status: 'missing', filename };
  }
  
  console.log(`📄 Processing: ${filename}...`);
  
  try {
    // Extract text from PDF
    const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`);
    
    // Call AI to extract exercises
    const response = await fetch('http://localhost:4444/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Extract ALL exercises from this NCERT chapter. Return JSON array with {exerciseNumber, question, difficulty, topics}.

${stdout.substring(0, 100000)}`
        }],
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 16000
      })
    });
    
    const result = await response.json();
    let exercises = [];
    
    // Parse AI response
    const content = result.content?.[0]?.text || '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      exercises = JSON.parse(jsonMatch[0]);
    }
    
    if (exercises.length === 0) {
      console.log(`⚠️  No exercises found in ${filename}`);
      return { status: 'no_exercises', filename };
    }
    
    // Save JSON
    fs.writeFileSync(jsonPath, JSON.stringify(exercises, null, 2));
    console.log(`✅ Extracted: ${filename} (${exercises.length} exercises)`);
    
    return { status: 'success', filename, count: exercises.length };
  } catch (err) {
    console.error(`❌ Failed: ${filename} - ${err.message}`);
    return { status: 'error', filename, error: err.message };
  }
}

async function main() {
  console.log(`🚀 Re-extracting ${failedFiles.length} failed PDFs...\n`);
  
  const results = [];
  for (const file of failedFiles) {
    const result = await extractPDF(file);
    results.push(result);
    await new Promise(r => setTimeout(r, 2000)); // Rate limit
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`   Skipped: ${results.filter(r => r.status === 'skipped').length}`);
  console.log(`   No exercises: ${results.filter(r => r.status === 'no_exercises').length}`);
  console.log(`   Errors: ${results.filter(r => r.status === 'error').length}`);
  
  await pool.end();
}

main().catch(console.error);
