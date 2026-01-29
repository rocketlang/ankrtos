// Common types used across ankrICD

export type UUID = string;
export type ISODateString = string;
export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: Coordinates;
}

export interface AuditFields {
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface TenantEntity {
  tenantId: string;
  facilityId: string;
}

export interface PaginationInput {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  warnings?: string[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface TimeWindow {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
}

export interface OperatingHours {
  monday?: TimeWindow;
  tuesday?: TimeWindow;
  wednesday?: TimeWindow;
  thursday?: TimeWindow;
  friday?: TimeWindow;
  saturday?: TimeWindow;
  sunday?: TimeWindow;
  holidays?: Date[];
}

export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled';

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  designation?: string;
}

export interface GSTInfo {
  gstin: string;
  legalName: string;
  tradeName?: string;
  registeredAddress: Address;
  stateCode: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  swiftCode?: string;
}
