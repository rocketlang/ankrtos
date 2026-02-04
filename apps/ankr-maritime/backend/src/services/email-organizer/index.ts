/**
 * Email Organizer Services
 * Complete email management with folders, threading, and AI summaries
 *
 * @package @ankr/email-organizer
 * @version 1.0.0
 */

export { EmailFolderService, emailFolderService } from './folder.service.js';
export { EmailThreadingService, emailThreadingService } from './threading.service.js';
export { EmailSummaryService, emailSummaryService } from './summary.service.js';

export type {
  FolderCreateInput,
  FolderUpdateInput,
} from './folder.service.js';

export type {
  EmailForThreading,
} from './threading.service.js';

export type {
  EmailSummaryInput,
  EmailSummary,
} from './summary.service.js';
