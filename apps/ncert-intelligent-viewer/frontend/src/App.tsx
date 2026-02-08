import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import Landing from './pages/Landing';
import BookSelector from './pages/BookSelector';
import ChapterList from './pages/ChapterList';
import ChapterViewer from './pages/ChapterViewer';
import SwayamWidget from './components/SwayamWidget';

function AppContent() {
  const location = useLocation();
  const isChapterPage = location.pathname.startsWith('/chapter/');

  // Extract chapter context if on chapter page
  const chapterId = isChapterPage ? location.pathname.split('/chapter/')[1] : undefined;

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/books" element={<BookSelector />} />
        <Route path="/book/:bookId" element={<ChapterList />} />
        <Route path="/chapter/:chapterId" element={<ChapterViewer />} />
      </Routes>

      {/* SWAYAM AI Assistant - Always available */}
      <SwayamWidget chapterId={chapterId} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/ncert">
      <AppContent />
    </BrowserRouter>
  );
}
