#!/usr/bin/env node

/**
 * Simple WebSocket server for testing SWAYAM widget
 * Mimics SWAYAM protocol for demonstration
 */

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 7778 });

console.log('🤖 Test SWAYAM Server running on ws://localhost:7778');
console.log('   (This is a mock server for testing the widget)\n');

wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message);

      // Handle different message types
      if (message.type === 'join') {
        console.log(`   Session: ${message.sessionId}`);
        console.log(`   Language: ${message.language}`);
        console.log(`   Context:`, message.context);

        // Send welcome message
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'response',
            text: message.language === 'hi'
              ? `नमस्ते! मैं SWAYAM हूं। ${message.context?.title ? `मैं "${message.context.title}" के बारे में आपकी मदद कर सकता हूं।` : 'मैं आपकी कैसे मदद कर सकता हूं?'}`
              : `Hello! I'm SWAYAM. ${message.context?.title ? `I can help you with "${message.context.title}".` : 'How can I help you today?'}`,
            language: message.language,
          }));
        }, 500);
      } else if (message.type === 'text') {
        console.log(`   User query (${message.language}): ${message.text}`);

        // Simple responses based on language
        let response = '';
        const query = message.text.toLowerCase();

        if (message.language === 'hi') {
          if (query.includes('ओम') || query.includes('ohm')) {
            response = 'ओम का नियम कहता है कि विद्युत धारा (I) = विभवांतर (V) / प्रतिरोध (R)। यानी I = V/R। यह विद्युत परिपथों का मूल नियम है।';
          } else if (query.includes('समझाओ') || query.includes('explain')) {
            response = 'बिल्कुल! मैं आपको विस्तार से समझा सकता हूं। कृपया बताएं किस टॉपिक के बारे में जानना चाहते हैं?';
          } else if (query.includes('प्रश्न') || query.includes('question')) {
            response = 'यहाँ एक अभ्यास प्रश्न है:\n\nएक 10Ω प्रतिरोध का तार 5V की बैटरी से जुड़ा है। तार में प्रवाहित धारा कितनी होगी?\n\n(संकेत: ओम का नियम I = V/R का उपयोग करें)';
          } else {
            response = 'मैं समझ गया! आपका सवाल बहुत अच्छा है। NCERT पाठ्यक्रम के अनुसार, ' + message.text.slice(0, 50) + '... के बारे में मैं आपको विस्तार से बता सकता हूं।';
          }
        } else {
          if (query.includes('ohm') || query.includes('law')) {
            response = "Ohm's Law states that the current (I) flowing through a conductor is directly proportional to the voltage (V) across it: V = IR, where R is resistance.";
          } else if (query.includes('explain')) {
            response = 'Of course! I can explain this concept in detail. Which specific topic would you like to understand better?';
          } else if (query.includes('question') || query.includes('practice')) {
            response = 'Here\'s a practice question:\n\nA wire of resistance 10Ω is connected to a 5V battery. Calculate the current flowing through the wire.\n\n(Hint: Use Ohm\'s Law I = V/R)';
          } else if (query.includes('key concept')) {
            response = 'Key concepts in this chapter:\n\n1. Electric Current - Flow of electric charge\n2. Potential Difference - Work done per unit charge\n3. Resistance - Opposition to current flow\n4. Ohm\'s Law - V = IR relationship\n5. Series and Parallel Circuits';
          } else {
            response = `Great question! Regarding "${message.text.slice(0, 50)}${message.text.length > 50 ? '...' : ''}", let me explain based on the NCERT curriculum...`;
          }
        }

        // Send response with typing delay
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'response',
            text: response,
            language: message.language,
          }));
        }, 1000 + Math.random() * 1000); // 1-2 second delay
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('👋 Client disconnected\n');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
});

wss.on('error', (error) => {
  console.error('❌ Server error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down test server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
