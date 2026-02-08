import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Chapter } from '../types';

export default function ChapterList() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { currentBook, setCurrentChapter, userProgress } = useStore();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookId) {
      fetchChapters(bookId);
    }
  }, [bookId]);

  const fetchChapters = async (bookId: string) => {
    try {
      const response = await fetch(`/api/ncert/books/${bookId}/chapters`);
      const data = await response.json();

      if (data.success && data.chapters) {
        setChapters(data.chapters);
      } else {
        console.error('Failed to load chapters:', data);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    navigate(`/chapter/${chapter.id}`);
  };

  const getProgressPercentage = (chapterId: string) => {
    return userProgress[chapterId]?.progress || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading chapters...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
          >
            ← Back to Books
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentBook?.title || 'NCERT Book'}
          </h1>
          <p className="text-gray-400">
            Class {currentBook?.class} • {chapters.length} Chapters
          </p>
        </div>
      </header>

      {/* Chapters List */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const progress = getProgressPercentage(chapter.id);
            const isCompleted = progress === 100;
            const isInProgress = progress > 0 && progress < 100;

            return (
              <button
                key={chapter.id}
                onClick={() => handleChapterSelect(chapter)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-6 text-left hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start justify-between">
                  {/* Chapter Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Chapter Number */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {chapter.chapterNumber}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {chapter.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {chapter.metadata?.readingTime && (
                            <span>⏱️ {chapter.metadata.readingTime} min</span>
                          )}
                          {chapter.metadata?.difficulty && (
                            <span className={`px-2 py-0.5 rounded ${
                              chapter.metadata.difficulty === 'easy'
                                ? 'bg-green-900/30 text-green-400'
                                : chapter.metadata.difficulty === 'medium'
                                ? 'bg-yellow-900/30 text-yellow-400'
                                : 'bg-red-900/30 text-red-400'
                            }`}>
                              {chapter.metadata.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {progress > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="ml-4">
                    {isCompleted ? (
                      <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-xl">✓</span>
                      </div>
                    ) : isInProgress ? (
                      <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 text-xl">→</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-blue-900/30 transition-colors">
                        <span className="text-gray-500 group-hover:text-blue-400 text-xl">▶</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Overall Progress */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {chapters.filter((c) => getProgressPercentage(c.id) === 100).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {chapters.filter((c) => {
                  const p = getProgressPercentage(c.id);
                  return p > 0 && p < 100;
                }).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">In Progress</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-400">
                {chapters.filter((c) => getProgressPercentage(c.id) === 0).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Not Started</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
