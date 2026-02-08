import React, { useState } from 'react';

interface Note {
  id: string;
  type: 'highlight' | 'note' | 'flashcard' | 'doubt';
  content: string;
  context?: string;
  front?: string;  // For flashcards
  back?: string;   // For flashcards
  timestamp: Date;
  tags: string[];
}

interface NotesPanelProps {
  chapter: {
    id: string;
    title: string;
    content: string;
  };
}

// Mock notes - In production, these would be stored in backend
const MOCK_NOTES: Note[] = [
  {
    id: '1',
    type: 'highlight',
    content: 'Ohm\'s Law: V = I × R',
    context: 'Section 12.2 - Ohm\'s Law',
    timestamp: new Date(Date.now() - 3600000),
    tags: ['formula', 'important']
  },
  {
    id: '2',
    type: 'flashcard',
    front: 'What is the SI unit of electric current?',
    back: 'Ampere (A)',
    timestamp: new Date(Date.now() - 7200000),
    tags: ['units', 'basic']
  },
  {
    id: '3',
    type: 'note',
    content: 'Remember: Resistance increases with length and decreases with cross-sectional area',
    context: 'Section 12.3 - Resistance',
    timestamp: new Date(Date.now() - 10800000),
    tags: ['concept']
  },
  {
    id: '4',
    type: 'doubt',
    content: 'Why does resistance increase with temperature for conductors?',
    context: 'Section 12.4 - Factors affecting resistance',
    timestamp: new Date(Date.now() - 14400000),
    tags: ['question']
  }
];

export default function NotesPanel({ chapter }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [activeTab, setActiveTab] = useState<'all' | 'highlights' | 'flashcards' | 'doubts'>('all');
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const filteredNotes = notes.filter(note => {
    if (activeTab === 'all') return true;
    if (activeTab === 'highlights') return note.type === 'highlight';
    if (activeTab === 'flashcards') return note.type === 'flashcard';
    if (activeTab === 'doubts') return note.type === 'doubt';
    return true;
  });

  const flashcards = notes.filter(n => n.type === 'flashcard');

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      type: 'note',
      content: newNoteText,
      timestamp: new Date(),
      tags: []
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const getTypeIcon = (type: Note['type']) => {
    switch (type) {
      case 'highlight': return '🖍️';
      case 'note': return '📝';
      case 'flashcard': return '🎴';
      case 'doubt': return '❓';
    }
  };

  const getTypeColor = (type: Note['type']) => {
    switch (type) {
      case 'highlight': return 'bg-yellow-900/20 border-yellow-800/30 text-yellow-400';
      case 'note': return 'bg-blue-900/20 border-blue-800/30 text-blue-400';
      case 'flashcard': return 'bg-purple-900/20 border-purple-800/30 text-purple-400';
      case 'doubt': return 'bg-red-900/20 border-red-800/30 text-red-400';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-xl font-bold text-white mb-2">📝 My Notes</h3>
        <p className="text-sm text-gray-400">
          Highlights, notes, flashcards, and doubts for this chapter
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          All ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'highlights'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🖍️ Highlights
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'flashcards'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🎴 Cards
        </button>
        <button
          onClick={() => setActiveTab('doubts')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'doubts'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          ❓ Doubts
        </button>
      </div>

      {/* Flashcard Study Mode */}
      {flashcardMode && flashcards.length > 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="text-center text-sm text-gray-400 mb-4">
              Card {currentFlashcard + 1} of {flashcards.length}
            </div>

            {/* Flashcard */}
            <div
              onClick={() => setShowAnswer(!showAnswer)}
              className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-purple-700/50 rounded-xl p-8 min-h-[280px] flex items-center justify-center cursor-pointer hover:border-purple-600/70 transition-all shadow-lg"
            >
              <div className="text-center">
                <div className="text-xs text-purple-400 font-semibold mb-4">
                  {showAnswer ? 'ANSWER' : 'QUESTION'}
                </div>
                <div className="text-xl text-white font-medium">
                  {showAnswer
                    ? flashcards[currentFlashcard].back
                    : flashcards[currentFlashcard].front}
                </div>
                <div className="text-sm text-gray-400 mt-4">
                  {showAnswer ? '(Click to flip)' : '(Click to reveal answer)'}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCurrentFlashcard(Math.max(0, currentFlashcard - 1));
                  setShowAnswer(false);
                }}
                disabled={currentFlashcard === 0}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  setCurrentFlashcard(Math.min(flashcards.length - 1, currentFlashcard + 1));
                  setShowAnswer(false);
                }}
                disabled={currentFlashcard === flashcards.length - 1}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            <button
              onClick={() => setFlashcardMode(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
            >
              Exit Study Mode
            </button>
          </div>
        </div>
      ) : (
        /* Normal Notes View */
        <>
          {/* Stats */}
          <div className="p-6 bg-gray-800 border-b border-gray-700">
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="text-gray-400">Highlights</div>
                <div className="text-xl font-bold text-yellow-400">
                  {notes.filter(n => n.type === 'highlight').length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Notes</div>
                <div className="text-xl font-bold text-blue-400">
                  {notes.filter(n => n.type === 'note').length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Flashcards</div>
                <div className="text-xl font-bold text-purple-400">
                  {flashcards.length}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Doubts</div>
                <div className="text-xl font-bold text-red-400">
                  {notes.filter(n => n.type === 'doubt').length}
                </div>
              </div>
            </div>
          </div>

          {/* Add Note */}
          <div className="p-4 border-b border-gray-800">
            {isAddingNote ? (
              <div>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Type your note..."
                  className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded resize-none focus:border-blue-500 focus:outline-none mb-2"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
                  >
                    Save Note
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNoteText('');
                    }}
                    className="px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingNote(true)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
                >
                  + Add Note
                </button>
                {flashcards.length > 0 && (
                  <button
                    onClick={() => {
                      setFlashcardMode(true);
                      setCurrentFlashcard(0);
                      setShowAnswer(false);
                    }}
                    className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-500 transition-colors"
                  >
                    🎴 Study Cards
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No notes yet</div>
                <div className="text-gray-600 text-sm">
                  Start by highlighting text or adding notes as you read
                </div>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`border rounded-lg p-4 ${getTypeColor(note.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(note.type)}</span>
                      <span className="text-xs font-semibold uppercase">
                        {note.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  {note.type === 'flashcard' ? (
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Question:</div>
                        <div className="text-sm text-white">{note.front}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Answer:</div>
                        <div className="text-sm text-gray-300">{note.back}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-200">{note.content}</div>
                  )}

                  {note.context && (
                    <div className="text-xs text-gray-500 mt-2">
                      📍 {note.context}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-1">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-600">
                      {note.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Export Options */}
      {!flashcardMode && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
              📄 Export as PDF
            </button>
            <button className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
              📤 Export Anki Cards
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
