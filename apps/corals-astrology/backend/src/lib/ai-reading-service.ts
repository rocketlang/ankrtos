/**
 * AI-Driven Astrology Readings Service
 * Powered by OpenAI GPT-4
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== SYSTEM PROMPTS ====================

const ASTROLOGY_SYSTEM_PROMPT = `You are Swami, an expert Vedic astrologer with 30+ years of experience. You combine:
- Deep knowledge of Vedic astrology (Jyotish)
- Understanding of Lal Kitab remedies
- Western astrology insights
- Psychological counseling skills
- Spiritual wisdom

Your responses should be:
- Compassionate and encouraging
- Specific and actionable
- Based on astrological principles
- Balanced (not overly optimistic or pessimistic)
- Culturally sensitive

Always provide:
1. Clear interpretation
2. Practical advice
3. Timeframes when relevant
4. Remedies when appropriate

Remember: Astrology is guidance, not fate. Free will matters.`;

// ==================== AI READING FUNCTIONS ====================

/**
 * Generate Birth Chart Interpretation
 */
export async function generateBirthChartReading(kundliData: any, focusArea?: string) {
  const userPrompt = `
Analyze this birth chart:

Birth Details:
- Date: ${kundliData.birthDetails.date}
- Time: ${kundliData.birthDetails.time}
- Place: ${kundliData.birthDetails.place}

Planetary Positions:
${formatPlanetsForAI(kundliData.planets)}

Ascendant: ${kundliData.ascendant.sign} (${kundliData.ascendant.degree}°)

Nakshatras:
- Birth Nakshatra: ${kundliData.nakshatras.birth} Pada ${kundliData.nakshatras.birthPada}
- Moon Nakshatra: ${kundliData.nakshatras.moon}

Yogas: ${JSON.stringify(kundliData.yogas)}

Doshas:
- Mangal Dosha: ${kundliData.doshas.mangalDosha ? 'Yes' : 'No'}
- Kal Sarpa Dosha: ${kundliData.doshas.kalSarpaDosha ? 'Yes' : 'No'}

Current Dasha: ${kundliData.currentDasha}

${focusArea ? `Focus Area: ${focusArea}` : ''}

Provide a comprehensive reading covering:
1. Personality traits (based on ascendant and moon)
2. Strengths and talents
3. Challenges and growth areas
4. Career guidance
5. Relationship potential
6. Health considerations
7. Life purpose
8. Current dasha effects
9. Important yogas analysis
10. Practical advice

Format the response as JSON with these fields:
{
  "summary": "Brief 2-3 sentence overview",
  "personality": "Detailed personality analysis",
  "strengths": ["strength1", "strength2", ...],
  "challenges": ["challenge1", "challenge2", ...],
  "career": "Career guidance",
  "relationships": "Relationship analysis",
  "health": "Health considerations",
  "lifePurpose": "Spiritual/life purpose insights",
  "currentPhase": "Current dasha period analysis",
  "yogaAnalysis": "Analysis of important yogas",
  "advice": ["advice1", "advice2", ...],
  "recommendations": ["action1", "action2", ...]
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  const tokensUsed = response.usage?.total_tokens || 0;

  return {
    content: content ? JSON.parse(content) : {},
    tokensUsed,
    model: 'gpt-4',
  };
}

/**
 * Generate Daily Guidance
 */
export async function generateDailyGuidance(kundliData: any, date: Date) {
  const userPrompt = `
Based on this person's birth chart:
- Sun Sign: ${kundliData.planets.SUN.sign}
- Moon Sign: ${kundliData.planets.MOON.sign}
- Ascendant: ${kundliData.ascendant.sign}
- Current Dasha: ${kundliData.currentDasha}

Generate personalized daily guidance for ${date.toDateString()}.

Consider:
- Current planetary transits
- Dasha period
- Personal planetary positions

Provide:
1. Overall energy for the day (0-100 scale)
2. Best activities
3. Things to avoid
4. Lucky time
5. Specific advice
6. Affirmation for the day

Format as JSON:
{
  "energy": 75,
  "overview": "Brief daily overview",
  "doList": ["activity1", "activity2"],
  "avoidList": ["thing1", "thing2"],
  "luckyTime": "2:00 PM - 4:00 PM",
  "advice": "Specific actionable advice",
  "affirmation": "Positive affirmation",
  "focusArea": "What to focus on today"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : {};
}

/**
 * Answer Specific Question
 */
export async function answerAstrologyQuestion(
  question: string,
  kundliData: any,
  context?: string
) {
  const userPrompt = `
Question: ${question}

${context ? `Context: ${context}` : ''}

Birth Chart Summary:
- Sun: ${kundliData.planets.SUN.sign} in ${kundliData.planets.SUN.house}th house
- Moon: ${kundliData.planets.MOON.sign} in ${kundliData.planets.MOON.house}th house
- Ascendant: ${kundliData.ascendant.sign}
- Current Dasha: ${kundliData.currentDasha}

Provide a detailed, personalized answer based on their birth chart.

Include:
1. Direct answer to the question
2. Astrological reasoning
3. Timeframe if applicable
4. Actionable advice
5. Any remedies if relevant

Format as JSON:
{
  "answer": "Direct answer to question",
  "reasoning": "Why this is the answer based on chart",
  "timeframe": "When this might happen (if applicable)",
  "confidence": 85,
  "advice": ["advice1", "advice2"],
  "remedies": ["remedy1", "remedy2"],
  "additionalInsights": "Any extra relevant information"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : {};
}

/**
 * Generate Compatibility Reading
 */
export async function generateCompatibilityReading(
  person1Kundli: any,
  person2Kundli: any
) {
  const userPrompt = `
Analyze compatibility between these two people:

Person 1:
- Sun: ${person1Kundli.planets.SUN.sign}
- Moon: ${person1Kundli.planets.MOON.sign}
- Ascendant: ${person1Kundli.ascendant.sign}
- Venus: ${person1Kundli.planets.VENUS.sign}
- Mars: ${person1Kundli.planets.MARS.sign}

Person 2:
- Sun: ${person2Kundli.planets.SUN.sign}
- Moon: ${person2Kundli.planets.MOON.sign}
- Ascendant: ${person2Kundli.ascendant.sign}
- Venus: ${person2Kundli.planets.VENUS.sign}
- Mars: ${person2Kundli.planets.MARS.sign}

Provide comprehensive compatibility analysis:

Format as JSON:
{
  "overallScore": 75,
  "summary": "Brief compatibility summary",
  "emotionalCompatibility": {"score": 80, "analysis": "..."},
  "intellectualCompatibility": {"score": 70, "analysis": "..."},
  "physicalCompatibility": {"score": 85, "analysis": "..."},
  "spiritualCompatibility": {"score": 65, "analysis": "..."},
  "strengths": ["strength1", "strength2"],
  "challenges": ["challenge1", "challenge2"],
  "advice": ["advice1", "advice2"],
  "longTermOutlook": "Long-term potential",
  "recommendations": ["recommendation1", "recommendation2"]
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : {};
}

/**
 * Generate Career Guidance
 */
export async function generateCareerGuidance(kundliData: any) {
  const userPrompt = `
Analyze career potential for this person:

10th House (Career): ${kundliData.houseCusps[9].sign}
10th Lord: ${kundliData.houseLords[10]}

Key Planets:
- Sun (Authority): ${kundliData.planets.SUN.sign} in ${kundliData.planets.SUN.house}th house
- Saturn (Discipline): ${kundliData.planets.SATURN.sign} in ${kundliData.planets.SATURN.house}th house
- Mercury (Intelligence): ${kundliData.planets.MERCURY.sign} in ${kundliData.planets.MERCURY.house}th house
- Jupiter (Wisdom): ${kundliData.planets.JUPITER.sign} in ${kundliData.planets.JUPITER.house}th house

Current Dasha: ${kundliData.currentDasha}

Provide:
1. Best career fields (3-5 specific recommendations)
2. Natural talents and skills
3. Leadership potential
4. Best time for career changes
5. Challenges in career
6. Success indicators
7. Actionable advice

Format as JSON:
{
  "topCareerFields": ["field1", "field2", "field3"],
  "talents": ["talent1", "talent2"],
  "leadershipPotential": "High/Medium/Low and why",
  "bestTimingForChange": "Current dasha analysis",
  "challenges": ["challenge1", "challenge2"],
  "successIndicators": ["indicator1", "indicator2"],
  "advice": ["advice1", "advice2"],
  "entrepreneurialPotential": "Analysis",
  "idealWorkEnvironment": "Description"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : {};
}

/**
 * Generate Lal Kitab Reading (with AI interpretation)
 */
export async function generateLalKitabAIReading(lalKitabData: any) {
  const userPrompt = `
Analyze this Lal Kitab chart:

Debts (Rinas):
- Father Debt: ${lalKitabData.debts.fatherDebt ? 'Yes' : 'No'}
- Mother Debt: ${lalKitabData.debts.motherDebt ? 'Yes' : 'No'}
- Brother Debt: ${lalKitabData.debts.brotherDebt ? 'Yes' : 'No'}
- Woman Debt: ${lalKitabData.debts.womanDebt ? 'Yes' : 'No'}
- Self Debt: ${lalKitabData.debts.selfDebt ? 'Yes' : 'No'}

Blind Planets: ${lalKitabData.blindPlanets.join(', ') || 'None'}
Sleeping Planets: ${lalKitabData.sleepingPlanets.join(', ') || 'None'}

Yogas: ${JSON.stringify(lalKitabData.yogas)}

Remedies Suggested: ${lalKitabData.remedies.length}

Provide a compassionate Lal Kitab interpretation:

Format as JSON:
{
  "overview": "General overview of the chart",
  "debtAnalysis": "What debts mean and their impact",
  "planetAnalysis": "Analysis of blind/sleeping planets",
  "lifeAreas": {
    "family": "Family relationships",
    "career": "Career prospects",
    "health": "Health considerations",
    "wealth": "Financial situation"
  },
  "priorities": ["Most important remedy", "Second priority"],
  "encouragement": "Positive, encouraging message",
  "practicalAdvice": ["advice1", "advice2"],
  "timeline": "When to expect results from remedies"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : {};
}

// ==================== CHAT ASSISTANT ====================

/**
 * AI Chat Assistant - Conversational Astrology
 */
export async function chatWithAIAstrologer(
  messages: Array<{ role: string; content: string }>,
  userKundli?: any
) {
  const systemPrompt = `${ASTROLOGY_SYSTEM_PROMPT}

${userKundli ? `
User's Birth Chart:
- Sun: ${userKundli.planets.SUN.sign}
- Moon: ${userKundli.planets.MOON.sign}
- Ascendant: ${userKundli.ascendant.sign}
- Current Dasha: ${userKundli.currentDasha}

Use this information to provide personalized responses.
` : ''}

Be conversational, warm, and helpful. Answer questions directly but also educate.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.8,
    max_tokens: 800,
  });

  return {
    content: response.choices[0].message.content || '',
    tokensUsed: response.usage?.total_tokens || 0,
  };
}

// ==================== HELPER FUNCTIONS ====================

function formatPlanetsForAI(planets: any): string {
  let formatted = '';
  for (const [name, planet] of Object.entries(planets)) {
    const p = planet as any;
    formatted += `- ${name}: ${p.sign} (${p.degree.toFixed(2)}°) in ${p.house}th house${p.isRetrograde ? ' (R)' : ''}\n`;
  }
  return formatted;
}

/**
 * Generate AI-powered horoscope
 */
export async function generateAIHoroscope(zodiacSign: string, period: string, date: Date) {
  const userPrompt = `
Generate a ${period} horoscope for ${zodiacSign} for ${date.toDateString()}.

Consider current planetary transits and general Vedic astrology principles.

Provide:
1. Overview (2-3 sentences)
2. Love & Relationships
3. Career & Business
4. Finance & Money
5. Health & Wellness
6. Lucky elements (color, number, time)
7. Ratings (1-5 stars for each area)

Format as JSON:
{
  "overview": "General overview",
  "love": "Love advice",
  "career": "Career guidance",
  "finance": "Financial advice",
  "health": "Health tips",
  "lucky": {
    "color": "Color name",
    "number": 7,
    "time": "2:00 PM - 4:00 PM"
  },
  "ratings": {
    "love": 4,
    "career": 5,
    "finance": 3,
    "health": 4
  }
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : {};
}

// ==================== EXPORTS ====================

export default {
  generateBirthChartReading,
  generateDailyGuidance,
  answerAstrologyQuestion,
  generateCompatibilityReading,
  generateCareerGuidance,
  generateLalKitabAIReading,
  chatWithAIAstrologer,
  generateAIHoroscope,
};
