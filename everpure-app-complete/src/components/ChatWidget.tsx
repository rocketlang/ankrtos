import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Track Order',
  'Delivery Time',
  'Return Policy',
  'About Ghee',
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: '🙏 Namaste! I\'m Ever Pure assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://ever-pure.in/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, lang: 'en' })
      });
      const data = await res.json();
      
      // If default response, try AI
      if (data.source === 'default') {
        try {
          const aiRes = await fetch('https://ever-pure.in/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: msg,
              context: 'Ever Pure is an organic grocery store selling A2 ghee, dry fruits, spices, honey, oils. Help customers with product info, orders, delivery.'
            })
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            if (aiData.response) {
              setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: aiData.response }]);
              setLoading(false);
              return;
            }
          }
        } catch {}
      }
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || 'Please try again.' }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, please try again or call us at 9711121512.' }]);
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <TouchableOpacity style={s.fab} onPress={() => setIsOpen(true)} activeOpacity={0.8}>
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[s.container, { transform: [{ scale: scaleAnim }] }]}>
      <KeyboardAvoidingView style={s.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Ionicons name="leaf" size={24} color="#fff" />
            <Text style={s.headerTitle}>Ever Pure Support</Text>
          </View>
          <TouchableOpacity onPress={() => setIsOpen(false)} style={s.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={s.messages} contentContainerStyle={s.messagesContent}>
          {messages.map(msg => (
            <View key={msg.id} style={[s.msgRow, msg.role === 'user' && s.msgRowUser]}>
              <View style={[s.msgBubble, msg.role === 'user' ? s.msgUser : s.msgAssistant]}>
                <Text style={[s.msgText, msg.role === 'user' && s.msgTextUser]}>{msg.content}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={s.msgRow}>
              <View style={[s.msgBubble, s.msgAssistant]}>
                <Text style={s.msgText}>Typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Questions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickContainer}>
          {QUICK_QUESTIONS.map((q, i) => (
            <TouchableOpacity key={i} style={s.quickBtn} onPress={() => sendMessage(q)}>
              <Text style={s.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={s.inputContainer}>
          <TextInput
            style={s.input}
            placeholder="Ask a question..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={() => sendMessage()} disabled={!input.trim() || loading}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const { width, height } = Dimensions.get('window');

const s = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: Math.min(width - 40, 340),
    height: Math.min(height - 150, 480),
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0066FF',
    padding: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  closeBtn: {
    padding: 5,
  },
  messages: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContent: {
    padding: 15,
  },
  msgRow: {
    marginBottom: 10,
  },
  msgRowUser: {
    alignItems: 'flex-end',
  },
  msgBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  msgAssistant: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  msgUser: {
    backgroundColor: '#0066FF',
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  msgTextUser: {
    color: '#fff',
  },
  quickContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  quickText: {
    fontSize: 13,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
