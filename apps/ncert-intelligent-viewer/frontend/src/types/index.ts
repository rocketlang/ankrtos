export interface Book {
  id: string;
  class: number;
  subject: string;
  title: string;
  language: string;
  chapterCount: number;
  thumbnail?: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content: string;
  metadata?: {
    readingTime?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
    exercises?: number;
  };
}

export interface Question {
  id: string;
  chapterId: string;
  type: 'fermi' | 'socratic' | 'logic';
  content: any; // Type varies by question type
  difficulty: number;
}

export interface UserNote {
  id: string;
  chapterId: string;
  type: 'highlight' | 'note' | 'flashcard' | 'doubt';
  content: string;
  context?: string;
  front?: string;
  back?: string;
  timestamp: Date;
  tags: string[];
}

export type PanelMode = 'index' | 'fermi' | 'socratic' | 'logic' | 'translate' | 'notes' | 'similar';
