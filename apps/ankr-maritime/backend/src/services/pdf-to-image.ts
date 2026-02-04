/**
 * PDF to Image Converter
 *
 * Converts PDF pages to images for OCR processing
 * Uses pdfjs-dist for rendering
 */

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

export interface PdfToImageOptions {
  maxPages?: number;
  dpi?: number;
  format?: 'png' | 'jpeg';
}

/**
 * Convert PDF pages to image buffers
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer,
  options: PdfToImageOptions = {}
): Promise<Buffer[]> {
  const { maxPages = 100, dpi = 150, format = 'png' } = options;

  try {
    // Load PDF document
    const loadingTask = getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = Math.min(pdfDocument.numPages, maxPages);

    const images: Buffer[] = [];

    // Convert each page to image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);

      // Calculate scale for desired DPI (default PDF is 72 DPI)
      const scale = dpi / 72;
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context as any,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to buffer
      const imageBuffer = format === 'png'
        ? canvas.toBuffer('image/png')
        : canvas.toBuffer('image/jpeg', { quality: 0.95 });

      images.push(imageBuffer);

      // Clean up
      page.cleanup();
    }

    return images;

  } catch (error) {
    console.error('PDF to image conversion error:', error);
    throw new Error(`Failed to convert PDF to images: ${error}`);
  }
}

/**
 * Convert a single PDF page to image
 */
export async function convertPdfPageToImage(
  pdfBuffer: Buffer,
  pageNumber: number,
  options: PdfToImageOptions = {}
): Promise<Buffer> {
  const { dpi = 150, format = 'png' } = options;

  try {
    const loadingTask = getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;

    if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(`Page ${pageNumber} out of range (1-${pdfDocument.numPages})`);
    }

    const page = await pdfDocument.getPage(pageNumber);
    const scale = dpi / 72;
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context as any,
      viewport: viewport,
    }).promise;

    const imageBuffer = format === 'png'
      ? canvas.toBuffer('image/png')
      : canvas.toBuffer('image/jpeg', { quality: 0.95 });

    page.cleanup();

    return imageBuffer;

  } catch (error) {
    console.error('PDF page to image conversion error:', error);
    throw new Error(`Failed to convert PDF page ${pageNumber}: ${error}`);
  }
}

/**
 * Get PDF metadata without full conversion
 */
export async function getPdfMetadata(pdfBuffer: Buffer): Promise<{
  numPages: number;
  info: any;
}> {
  try {
    const loadingTask = getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const metadata = await pdfDocument.getMetadata();

    return {
      numPages: pdfDocument.numPages,
      info: metadata.info,
    };

  } catch (error) {
    console.error('PDF metadata extraction error:', error);
    throw new Error(`Failed to extract PDF metadata: ${error}`);
  }
}
