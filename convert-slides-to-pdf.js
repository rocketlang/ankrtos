#!/usr/bin/env bun

/**
 * Convert HTML slides to PDF
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertToPDF() {
    console.log('🚀 Converting HTML slides to PDF...\n');

    const htmlFile = '/root/pratham-transformation-slides.html';
    const pdfFile = '/root/pratham-transformation-slides.pdf';

    if (!fs.existsSync(htmlFile)) {
        console.error(`❌ HTML file not found: ${htmlFile}`);
        process.exit(1);
    }

    console.log(`📄 Input:  ${htmlFile}`);
    console.log(`📑 Output: ${pdfFile}\n`);

    try {
        // Launch browser
        console.log('🌐 Launching browser...');
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Load HTML file
        console.log('📖 Loading HTML...');
        const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });

        // Generate PDF
        console.log('📄 Generating PDF...');
        await page.pdf({
            path: pdfFile,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            },
            preferCSSPageSize: true
        });

        await browser.close();

        // Check file size
        const stats = fs.statSync(pdfFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('');
        console.log('✅ PDF generated successfully!');
        console.log(`📦 File size: ${fileSizeMB} MB`);
        console.log(`📍 Location: ${pdfFile}`);
        console.log('');
        console.log('🎉 Ready to present!');

    } catch (error) {
        console.error('❌ Error generating PDF:', error.message);
        process.exit(1);
    }
}

convertToPDF();
