import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { Book } from '../types';

export default function BookSelector() {
  const navigate = useNavigate();
  const { books, setBooks, setCurrentBook } = useStore();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available books from API
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/ncert/books');
      const data = await response.json();

      if (data.success && data.books) {
        setBooks(data.books);
      } else {
        console.error('Failed to load books:', data);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: Book) => {
    setCurrentBook(book);
    navigate(`/book/${book.id}`);
  };

  const filteredBooks = selectedClass
    ? books.filter((b) => b.class === selectedClass)
    : books;

  const availableClasses = Array.from(new Set(books.map((b) => b.class))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading NCERT books...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            📚 NCERT Intelligent Viewer
          </h1>
          <p className="text-gray-400">
            Transform passive reading into active critical thinking
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Class Filter */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Your Class</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedClass(null)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedClass === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Classes
            </button>
            {availableClasses.map((classNum) => (
              <button
                key={classNum}
                onClick={() => setSelectedClass(classNum)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedClass === classNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Class {classNum}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <button
              key={book.id}
              onClick={() => handleBookSelect(book)}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-left hover:border-blue-500 hover:bg-gray-750 transition-all group"
            >
              {/* Book Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📖</span>
              </div>

              {/* Book Info */}
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">
                  Class {book.class} • {book.language.toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {book.subject}
                </h3>
                <p className="text-sm text-gray-400">{book.title}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{book.chapterCount} Chapters</span>
                <span>•</span>
                <span className="text-blue-400">Start Learning →</span>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              No books found for Class {selectedClass}
            </div>
            <button
              onClick={() => setSelectedClass(null)}
              className="text-blue-400 hover:text-blue-300"
            >
              View all classes
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-6 py-8 mt-12">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>Made with ❤️ for Indian students • Powered by AI + Critical Thinking</p>
          <p className="mt-2">
            <a href="https://ncert.nic.in" className="text-blue-400 hover:text-blue-300">
              NCERT Official Website
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
