/**
 * Voice Command Button - Big mic button for drivers
 * One-tap voice input in any language
 */

import React, { useEffect } from 'react';
import { useDriverVoice, useDriverTTS, VOICE_RESPONSES, VoiceCommand } from '../hooks/useDriverVoice';

interface VoiceCommandButtonProps {
  language?: string;
  onCommand: (command: VoiceCommand) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function VoiceCommandButton({ 
  language = 'hi-IN', 
  onCommand,
  size = 'lg',
  className = ''
}: VoiceCommandButtonProps) {
  const { 
    isListening, 
    transcript, 
    toggleListening, 
    isSupported,
    lastCommand 
  } = useDriverVoice({ 
    language, 
    onCommand 
  });
  
  const { speak, isSpeaking } = useDriverTTS();

  // Announce when listening starts
  useEffect(() => {
    if (isListening) {
      const response = VOICE_RESPONSES.listening[language as keyof typeof VOICE_RESPONSES.listening] 
        || VOICE_RESPONSES.listening['en-US'];
      // Small vibration feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  }, [isListening, language]);

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-24 h-24 text-4xl',
  };

  if (!isSupported) {
    return (
      <div className="text-center text-gray-500 text-sm">
        🎤 Voice not supported on this device
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Main Mic Button */}
      <button
        onClick={toggleListening}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          transition-all duration-200 shadow-lg
          ${isListening 
            ? 'bg-red-500 animate-pulse scale-110' 
            : 'bg-gradient-to-br from-orange-500 to-red-500 hover:scale-105'
          }
          text-white
        `}
        style={{
          boxShadow: isListening 
            ? '0 0 30px rgba(239, 68, 68, 0.6)' 
            : '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}
      >
        {isListening ? '🎤' : '🎙️'}
      </button>

      {/* Status Text */}
      <div className="text-center min-h-[40px]">
        {isListening ? (
          <div className="text-red-500 font-medium animate-pulse">
            {language === 'hi-IN' ? '🔴 बोलिए...' : '🔴 Listening...'}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            {language === 'hi-IN' ? 'बोलने के लिए टैप करें' : 'Tap to speak'}
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 max-w-xs text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            "{transcript}"
          </div>
        </div>
      )}

      {/* Quick Voice Hints */}
      {!isListening && (
        <div className="flex flex-wrap gap-1 justify-center max-w-xs">
          {[
            language === 'hi-IN' ? 'ट्रिप पूरा' : 'Trip complete',
            language === 'hi-IN' ? '500 डीज़ल' : '500 diesel',
            language === 'hi-IN' ? 'इमरजेंसी' : 'Emergency',
          ].map((hint, i) => (
            <span 
              key={i}
              className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"
            >
              "{hint}"
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default VoiceCommandButton;
