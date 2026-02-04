import { CharterPartyProcessor } from './charter-party-processor.js';
import { BOLProcessor } from './bol-processor.js';
import { EmailProcessor } from './email-processor.js';
import { DocumentClassifier } from './document-classifier.js';

export interface DocumentProcessor {
  process(document: any): Promise<any>;
}

/**
 * Generic processor for unclassified documents
 */
class GenericProcessor implements DocumentProcessor {
  async process(document: any): Promise<any> {
    return {
      fullText: document.notes || '',
      docType: document.category || 'document',
      vesselNames: [],
      portNames: [],
      cargoTypes: [],
      parties: [],
      importance: 0.5,
      tags: [],
    };
  }
}

/**
 * Get appropriate processor for document type
 */
export function getProcessor(docType: string): DocumentProcessor {
  switch (docType) {
    case 'charter_party':
    case 'time_charter':
    case 'voyage_charter':
      return new CharterPartyProcessor();

    case 'bol':
    case 'bill_of_lading':
      return new BOLProcessor();

    case 'email':
    case 'correspondence':
      return new EmailProcessor();

    case 'classifier':
      return new DocumentClassifier();

    default:
      return new GenericProcessor();
  }
}

// Export all processors
export {
  CharterPartyProcessor,
  BOLProcessor,
  EmailProcessor,
  DocumentClassifier,
  GenericProcessor,
};
