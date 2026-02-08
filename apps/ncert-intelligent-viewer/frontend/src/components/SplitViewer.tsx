import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

// Import panel components
import ContentIndex from './panels/ContentIndex';
import FermiQuestion from './panels/FermiQuestion';
import SocraticDialogue from './panels/SocraticDialogue';
import LogicChallenge from './panels/LogicChallenge';
import TranslationPanel from './panels/TranslationPanel';
import NotesPanel from './panels/NotesPanel';
import SimilarChapters from './panels/SimilarChapters';

interface Chapter {
  id: string;
  title: string;
  content: string;
  class: number;
  subject: string;
  chapterNumber: number;
}

type PanelMode = 'index' | 'fermi' | 'socratic' | 'logic' | 'translate' | 'notes' | 'similar';

interface SplitViewerProps {
  chapter: Chapter;
}

export default function SplitViewer({ chapter }: SplitViewerProps) {
  const [splitRatio, setSplitRatio] = useState(40); // Document takes 40% by default
  const [activePanel, setActivePanel] = useState<PanelMode>('index');
  const [isResizing, setIsResizing] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');

  // Detect which section user is currently reading
  useEffect(() => {
    const handleScroll = () => {
      // TODO: Implement scroll spy to detect current section
      // This will be used to show context-aware questions
    };

    const docPanel = document.getElementById('document-panel');
    docPanel?.addEventListener('scroll', handleScroll);

    return () => docPanel?.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle split pane resizing
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing) {
      const newRatio = (e.clientX / window.innerWidth) * 100;
      if (newRatio >= 20 && newRatio <= 80) {
        setSplitRatio(newRatio);
      }
    }
  };

  // Render the appropriate panel based on active mode
  const renderPanel = () => {
    switch (activePanel) {
      case 'index':
        return <ContentIndex chapter={chapter} onSectionClick={setCurrentSection} />;
      case 'fermi':
        return <FermiQuestion chapter={chapter} currentSection={currentSection} />;
      case 'socratic':
        return <SocraticDialogue chapter={chapter} currentSection={currentSection} />;
      case 'logic':
        return <LogicChallenge chapter={chapter} currentSection={currentSection} />;
      case 'translate':
        return <TranslationPanel chapter={chapter} />;
      case 'notes':
        return <NotesPanel chapter={chapter} />;
      case 'similar':
        return <SimilarChapters chapter={chapter} />;
      default:
        return <ContentIndex chapter={chapter} onSectionClick={setCurrentSection} />;
    }
  };

  return (
    <div
      className="flex h-screen bg-gray-950"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* LEFT PANE: NCERT Textbook Content */}
      <div
        id="document-panel"
        className="overflow-y-auto bg-gray-900"
        style={{ width: `${splitRatio}%` }}
      >
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Chapter Header */}
          <div className="mb-8 border-b border-gray-800 pb-6">
            <div className="text-sm text-gray-400 mb-2">
              Class {chapter.class} • {chapter.subject}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Chapter {chapter.chapterNumber}
            </h1>
            <h2 className="text-2xl text-gray-300">
              {chapter.title}
            </h2>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={{
                // Custom renderers for better formatting
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold text-white mt-8 mb-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold text-gray-200 mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-gray-300 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">
                    {children}
                  </ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="bg-gray-800 px-2 py-1 rounded text-sm text-blue-400">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                      {children}
                    </code>
                  ),
                img: ({ src, alt }) => (
                  <div className="my-6">
                    <img
                      src={src}
                      alt={alt}
                      className="rounded-lg shadow-lg w-full"
                    />
                    {alt && (
                      <p className="text-center text-sm text-gray-500 mt-2">
                        {alt}
                      </p>
                    )}
                  </div>
                ),
              }}
            >
              {chapter.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* RESIZABLE DIVIDER */}
      <div
        className="w-1 bg-gray-800 hover:bg-blue-500 cursor-col-resize transition-colors"
        onMouseDown={handleMouseDown}
      />

      {/* RIGHT PANE: Intelligent Learning Panel */}
      <div
        className="bg-gray-900 border-l border-gray-800 flex flex-col"
        style={{ width: `${100 - splitRatio}%` }}
      >
        {/* Panel Tab Selector */}
        <div className="flex border-b border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActivePanel('index')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activePanel === 'index'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            📑 Index
          </button>
          <button
            onClick={() => setActivePanel('fermi')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activePanel === 'fermi'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            🔢 Fermi
          </button>
          <button
            onClick={() => setActivePanel('socratic')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activePanel === 'socratic'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            🏛️ Socratic
          </button>
          <button
            onClick={() => setActivePanel('logic')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activePanel === 'logic'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            🧩 Logic
          </button>
          <button
            onClick={() => setActivePanel('translate')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activePanel === 'translate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            🌍 Translate
          </button>
          <button
            onClick={() => setActivePanel('notes')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activePanel === 'notes'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            📝 Notes
          </button>
          <button
            onClick={() => setActivePanel('similar')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activePanel === 'similar'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            📚 Similar
          </button>
        </div>

        {/* Active Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
