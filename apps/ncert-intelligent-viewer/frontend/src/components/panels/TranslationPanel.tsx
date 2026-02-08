import React, { useState, useEffect } from 'react';

interface TranslationPanelProps {
  chapter: {
    id: string;
    title: string;
    content: string;
  };
}

// Mock translated content - In production, this would come from API or pre-translated NCERT books
const MOCK_HINDI_CONTENT = `# विद्युत धारा और परिपथ

विद्युत धारा विद्युत आवेश का प्रवाह है। विद्युत परिपथों में यह आवेश प्रायः तार में गति करते इलेक्ट्रॉनों द्वारा वहन किया जाता है। यह आयनों द्वारा भी वहन किया जा सकता है।

विद्युत धारा का SI मात्रक एम्पियर (A) है।

## ओम का नियम

यदि किसी चालक की भौतिक अवस्था (जैसे ताप) में कोई परिवर्तन न हो, तो उसके सिरों पर लगाया गया विभवांतर उसमें प्रवाहित होने वाली धारा के समानुपाती होता है।

V = I × R

जहाँ:
- V = विभवांतर (वोल्ट में)
- I = धारा (एम्पियर में)
- R = प्रतिरोध (ओम में)

## प्रतिरोध

किसी चालक का वह गुण जो विद्युत धारा के प्रवाह में बाधा उत्पन्न करता है, उसका प्रतिरोध कहलाता है।

प्रतिरोध निम्नलिखित बातों पर निर्भर करता है:
- चालक की लंबाई
- चालक के अनुप्रस्थ काट का क्षेत्रफल
- चालक का पदार्थ
- चालक का ताप`;

export default function TranslationPanel({ chapter }: TranslationPanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'hi' | 'en'>('hi');
  const [syncScroll, setSyncScroll] = useState(true);
  const [splitView, setSplitView] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Parse content into paragraphs for synchronized scrolling
  const englishParagraphs = chapter.content.split('\n\n').filter(p => p.trim());
  const hindiParagraphs = MOCK_HINDI_CONTENT.split('\n\n').filter(p => p.trim());

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, lang: 'en' | 'hi') => {
    if (!syncScroll) return;

    const source = e.currentTarget;
    const target = lang === 'en'
      ? document.getElementById('hindi-panel')
      : document.getElementById('english-panel');

    if (target) {
      const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight);
    }
  };

  const handleTextToSpeech = () => {
    // In production, this would use Web Speech API or external TTS service
    setIsPlaying(!isPlaying);

    if (!isPlaying) {
      // Simulate TTS
      console.log('Playing audio for:', selectedLanguage === 'hi' ? 'Hindi' : 'English');
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-xl font-bold text-white mb-2">🌍 Translation</h3>
        <p className="text-sm text-gray-400">
          Side-by-side bilingual learning with synchronized scrolling
        </p>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-800 border-b border-gray-700 space-y-3">
        {/* Language Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Primary Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as 'hi' | 'en')}
            className="px-3 py-1.5 bg-gray-900 text-white border border-gray-700 rounded focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="en">English (Original)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
          </select>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={splitView}
              onChange={(e) => setSplitView(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-gray-300">Split View</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-gray-300">Sync Scroll</span>
          </label>

          <button
            onClick={handleTextToSpeech}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              isPlaying
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isPlaying ? '⏸️' : '🔊'} {isPlaying ? 'Playing...' : 'Listen'}
          </button>
        </div>
      </div>

      {/* Translation Content */}
      <div className="flex-1 overflow-hidden">
        {splitView ? (
          /* Side-by-Side View */
          <div className="flex h-full">
            {/* English Panel */}
            <div
              id="english-panel"
              onScroll={(e) => handleScroll(e, 'en')}
              className="flex-1 overflow-y-auto p-6 border-r border-gray-800"
            >
              <div className="text-xs text-gray-500 font-semibold mb-4">ENGLISH</div>
              <div className="space-y-4">
                {englishParagraphs.map((para, idx) => (
                  <div key={idx} className="text-gray-300 leading-relaxed">
                    {para}
                  </div>
                ))}
              </div>
            </div>

            {/* Hindi Panel */}
            <div
              id="hindi-panel"
              onScroll={(e) => handleScroll(e, 'hi')}
              className="flex-1 overflow-y-auto p-6"
            >
              <div className="text-xs text-gray-500 font-semibold mb-4">हिंदी</div>
              <div className="space-y-4">
                {hindiParagraphs.map((para, idx) => (
                  <div key={idx} className="text-gray-300 leading-relaxed">
                    {para}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Single Language View */
          <div className="h-full overflow-y-auto p-6">
            <div className="space-y-4">
              {(selectedLanguage === 'hi' ? hindiParagraphs : englishParagraphs).map((para, idx) => (
                <div key={idx} className="text-gray-300 leading-relaxed">
                  {para}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Tools */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
            📋 Copy Translation
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
            📄 Download PDF
          </button>
          <button className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
            📚 Add to Vocab List
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-900/10 border-t border-blue-800/20">
        <div className="text-xs text-blue-400 leading-relaxed">
          <strong>💡 Learning Tip:</strong> Read in your preferred language first, then compare with the
          other language to strengthen understanding. Technical terms remain in English for clarity.
        </div>
      </div>
    </div>
  );
}
