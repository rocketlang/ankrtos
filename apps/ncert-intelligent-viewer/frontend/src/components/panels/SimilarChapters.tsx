import React from 'react';

interface RelatedChapter {
  id: string;
  title: string;
  class: number;
  subject: string;
  chapterNumber: number;
  similarity: number;
  reason: string;
  preview: string;
}

interface SimilarChaptersProps {
  chapter: {
    id: string;
    title: string;
    content: string;
  };
}

// Mock related chapters - In production, this would use AI similarity search
const MOCK_RELATED: RelatedChapter[] = [
  {
    id: 'class10-science-ch13',
    title: 'Magnetic Effects of Electric Current',
    class: 10,
    subject: 'Science',
    chapterNumber: 13,
    similarity: 95,
    reason: 'Directly builds on electricity concepts',
    preview: 'Explores how electric current creates magnetic fields and applications like electric motors...'
  },
  {
    id: 'class10-science-ch14',
    title: 'Sources of Energy',
    class: 10,
    subject: 'Science',
    chapterNumber: 14,
    similarity: 78,
    reason: 'Discusses electrical energy generation',
    preview: 'Covers various energy sources including hydroelectric power plants...'
  },
  {
    id: 'class12-physics-ch3',
    title: 'Current Electricity',
    class: 12,
    subject: 'Physics',
    chapterNumber: 3,
    similarity: 88,
    reason: 'Advanced treatment of same topics',
    preview: 'In-depth study of Kirchhoff\'s laws, Wheatstone bridge, potentiometer...'
  },
  {
    id: 'class11-physics-ch6',
    title: 'Work, Energy and Power',
    class: 11,
    subject: 'Physics',
    chapterNumber: 6,
    similarity: 65,
    reason: 'Related concept of electrical power',
    preview: 'Fundamental concepts of work and power that apply to electrical systems...'
  }
];

export default function SimilarChapters({ chapter }: SimilarChaptersProps) {
  const handleOpenChapter = (chapterId: string) => {
    console.log('Opening chapter:', chapterId);
    // In production, this would navigate to the new chapter
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">📚 Similar Chapters</h3>
        <p className="text-sm text-gray-400">
          Related content to deepen your understanding
        </p>
      </div>

      {/* Current Chapter Context */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mb-6">
        <div className="text-xs text-blue-400 font-semibold mb-2">CURRENTLY READING</div>
        <div className="text-sm text-white font-medium">{chapter.title}</div>
        <div className="text-xs text-gray-400 mt-1">
          AI analyzing content to find related chapters...
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 font-semibold mb-2">FILTER BY</div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded hover:bg-gray-700 transition-colors">
            Same Class
          </button>
          <button className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded hover:bg-gray-700 transition-colors">
            Same Subject
          </button>
          <button className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded hover:bg-gray-700 transition-colors">
            All Classes
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded">
            Highly Related ({'>'}70%)
          </button>
        </div>
      </div>

      {/* Related Chapters List */}
      <div className="space-y-4">
        <div className="text-xs text-gray-500 font-semibold mb-3">
          {MOCK_RELATED.length} RELATED CHAPTERS FOUND
        </div>

        {MOCK_RELATED.map((related, idx) => (
          <div
            key={related.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all cursor-pointer group"
            onClick={() => handleOpenChapter(related.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  Class {related.class} • {related.subject} • Chapter {related.chapterNumber}
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {related.title}
                </h4>
              </div>

              {/* Similarity Score */}
              <div className="flex flex-col items-end ml-3">
                <div
                  className={`text-2xl font-bold ${
                    related.similarity >= 85
                      ? 'text-green-400'
                      : related.similarity >= 70
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  }`}
                >
                  {related.similarity}%
                </div>
                <div className="text-xs text-gray-500">match</div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-gray-900 rounded p-2 mb-3">
              <div className="text-xs text-gray-500 mb-1">WHY IT'S RELATED</div>
              <div className="text-sm text-gray-300">{related.reason}</div>
            </div>

            {/* Preview */}
            <div className="text-sm text-gray-400 leading-relaxed mb-3">
              {related.preview}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChapter(related.id);
                }}
              >
                Open Chapter →
              </button>
              <button
                className="px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Preview:', related.id);
                }}
              >
                Quick Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Learning Path Suggestion */}
      <div className="mt-6 bg-purple-900/20 border border-purple-800/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎓</div>
          <div className="flex-1">
            <div className="text-purple-400 font-semibold mb-1">Suggested Learning Path</div>
            <div className="text-sm text-gray-300 mb-3">
              Based on your progress, we recommend reading in this order:
            </div>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Current chapter: Electricity (you are here)</li>
              <li>Next: Magnetic Effects of Electric Current</li>
              <li>Then: Sources of Energy</li>
              <li>Advanced: Current Electricity (Class 12)</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Topic Tags */}
      <div className="mt-6">
        <div className="text-xs text-gray-500 font-semibold mb-3">RELATED TOPICS</div>
        <div className="flex flex-wrap gap-2">
          {[
            'Electric Current',
            'Ohm\'s Law',
            'Resistance',
            'Circuits',
            'Power',
            'Energy',
            'Magnetism',
            'Electromagnetism'
          ].map((tag, idx) => (
            <button
              key={idx}
              className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded hover:bg-blue-600 hover:text-white transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* External Resources */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="text-xs text-gray-500 font-semibold mb-3">EXTERNAL RESOURCES</div>
        <div className="space-y-2">
          <a
            href="#"
            className="block px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
          >
            🎥 Video Lecture: Electricity Basics
          </a>
          <a
            href="#"
            className="block px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
          >
            🧪 Virtual Lab: Circuit Simulator
          </a>
          <a
            href="#"
            className="block px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded hover:bg-gray-700 transition-colors"
          >
            📖 Reference: Khan Academy - Electricity
          </a>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 bg-green-900/10 border border-green-800/20 rounded-lg p-4">
        <div className="text-xs text-green-400 leading-relaxed">
          <strong>💡 Learning Tip:</strong> Reading related chapters helps you build connections
          between concepts. This improves retention and prepares you for advanced topics!
        </div>
      </div>
    </div>
  );
}
