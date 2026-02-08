import React, { useMemo } from 'react';

interface Section {
  id: string;
  level: number;
  title: string;
  lineNumber: number;
}

interface ContentIndexProps {
  chapter: {
    id: string;
    title: string;
    content: string;
  };
  onSectionClick: (sectionId: string) => void;
}

export default function ContentIndex({ chapter, onSectionClick }: ContentIndexProps) {
  // Parse markdown headers to generate table of contents
  const sections = useMemo(() => {
    const lines = chapter.content.split('\n');
    const toc: Section[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2];
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        toc.push({
          id,
          level,
          title,
          lineNumber: idx,
        });
      }
    });

    return toc;
  }, [chapter.content]);

  // Calculate reading progress (mock for now)
  const progress = 35; // TODO: Implement actual progress tracking
  const readingTime = Math.ceil(chapter.content.split(' ').length / 200); // 200 words per minute

  const handleSectionClick = (section: Section) => {
    onSectionClick(section.id);

    // Scroll to section in document panel
    const docPanel = document.getElementById('document-panel');
    if (docPanel) {
      // TODO: Implement smooth scroll to section
      // This requires adding IDs to the rendered markdown headers
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">📑 Content Index</h3>
        <p className="text-sm text-gray-400">
          Navigate through the chapter and track your progress
        </p>
      </div>

      {/* Progress Stats */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Reading Progress</span>
          <span className="text-sm font-semibold text-blue-400">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Reading Time</div>
            <div className="text-white font-semibold">{readingTime} min</div>
          </div>
          <div>
            <div className="text-gray-400">Sections</div>
            <div className="text-white font-semibold">{sections.length}</div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Sections
        </h4>
        {sections.map((section, idx) => (
          <button
            key={idx}
            onClick={() => handleSectionClick(section)}
            className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 transition-colors group"
            style={{ paddingLeft: `${section.level * 12 + 12}px` }}
          >
            <div className="flex items-start gap-2">
              {/* Level indicator */}
              <span className="text-gray-600 text-xs mt-0.5 flex-shrink-0">
                {section.level === 1 ? '•' : '◦'}
              </span>

              {/* Section title */}
              <span
                className={`flex-1 ${
                  section.level === 1
                    ? 'text-white font-medium'
                    : section.level === 2
                    ? 'text-gray-300'
                    : 'text-gray-400'
                } group-hover:text-blue-400 transition-colors`}
              >
                {section.title}
              </span>

              {/* Checkmark if read */}
              {/* TODO: Track which sections have been read */}
              {/* <CheckIcon className="w-4 h-4 text-green-500" /> */}
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors text-left">
            🔖 Bookmark Current Position
          </button>
          <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors text-left">
            📄 Export as PDF
          </button>
          <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-white transition-colors text-left">
            💾 Download for Offline
          </button>
        </div>
      </div>
    </div>
  );
}
