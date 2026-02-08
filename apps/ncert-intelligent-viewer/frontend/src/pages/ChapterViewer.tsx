import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import SplitViewer from '../components/SplitViewer';
import type { Chapter } from '../types';

export default function ChapterViewer() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { currentChapter, setCurrentChapter, updateProgress } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chapterId) {
      fetchChapter(chapterId);
      // Start tracking time
      const startTime = Date.now();

      return () => {
        // Update time spent when component unmounts
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        updateProgress(chapterId, { timeSpent });
      };
    }
  }, [chapterId]);

  const fetchChapter = async (chapterId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/ncert/content/${chapterId}`);
      // const data = await response.json();

      // Load sample chapter content
      const mockChapter: Chapter = {
        id: chapterId,
        bookId: 'class10-science',
        chapterNumber: 12,
        title: 'Electricity',
        content: await fetchSampleContent(),
        metadata: {
          readingTime: 50,
          difficulty: 'medium',
          tags: ['physics', 'electricity', 'current'],
        },
      };

      setCurrentChapter(mockChapter);
    } catch (err) {
      console.error('Failed to fetch chapter:', err);
      setError('Failed to load chapter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleContent = async (): Promise<string> => {
    // For MVP, we'll use the content we created earlier
    // In production, this would fetch from /api/ncert/content/:chapterId
    return `# Chapter 12: Electricity

**Class 10 Science**

## 12.1 Electric Current and Circuit

Have you ever wondered what makes a bulb glow when you flip a switch? Or how does electricity flow through wires to power our homes? In this chapter, we will explore the fascinating world of electricity!

### What is Electric Current?

An **electric current** is a flow of electric charge. In electric circuits, this charge is often carried by electrons moving through a wire.

**Definition:** Electric current is defined as the rate of flow of electric charge through a conductor.

Mathematically:
\`\`\`
I = Q / t
\`\`\`

Where:
- I = Electric current (measured in Amperes, A)
- Q = Electric charge (measured in Coulombs, C)
- t = Time (measured in seconds, s)

### Electric Circuit

An electric circuit is a closed path through which electric current can flow. A simple circuit consists of:

1. **Power source** (Battery or cell)
2. **Conducting wires** (Usually copper)
3. **Load** (Bulb, resistor, motor, etc.)
4. **Switch** (To control the flow)

**Key Point:** A circuit must be complete (closed) for current to flow. If there's a break anywhere, current cannot flow!

## 12.2 Ohm's Law

One of the most fundamental laws in electricity is **Ohm's Law**, discovered by German physicist Georg Simon Ohm in 1827.

### Statement of Ohm's Law

**Ohm's Law states that:** The electric current flowing through a conductor is directly proportional to the potential difference across its ends, provided the physical conditions (like temperature) remain constant.

Mathematically:
\`\`\`
V = I × R
\`\`\`

Where:
- V = Potential difference (Volts, V)
- I = Electric current (Amperes, A)
- R = Resistance (Ohms, Ω)

### Understanding Through an Example

Imagine a water pipe:
- **Voltage (V)** is like water pressure
- **Current (I)** is like the flow rate of water
- **Resistance (R)** is like the pipe's narrowness

Higher pressure → More water flow
Similarly, Higher voltage → More current

But if the pipe is narrower (higher resistance) → Less water flow
Similarly, Higher resistance → Less current (for same voltage)

## 12.3 Resistance

**Resistance** is the property of a conductor that opposes the flow of electric current through it.

**SI Unit:** Ohm (Ω)

### Factors Affecting Resistance

The resistance of a conductor depends on:

1. **Length (L):** R ∝ L
   Longer the wire, greater the resistance

2. **Cross-sectional Area (A):** R ∝ 1/A
   Thicker the wire, lesser the resistance

3. **Material (ρ):** Different materials have different resistivities
   Copper has low resistance, rubber has very high resistance

4. **Temperature:** For most conductors, resistance increases with temperature

### Formula for Resistance

\`\`\`
R = ρ × (L / A)
\`\`\`

Where:
- R = Resistance (Ω)
- ρ = Resistivity of material (Ω⋅m)
- L = Length of conductor (m)
- A = Cross-sectional area (m²)

## Summary

**Key Concepts:**

1. **Electric Current (I)** = Q / t, measured in Amperes (A)
2. **Ohm's Law:** V = I × R
3. **Resistance (R)** = ρ × L / A, measured in Ohms (Ω)

This chapter introduces you to the fundamental concepts of electricity that power our modern world!`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading chapter...</div>
      </div>
    );
  }

  if (error || !currentChapter) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error || 'Chapter not found'}</div>
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to Books
          </button>
        </div>
      </div>
    );
  }

  return <SplitViewer chapter={currentChapter} />;
}
