import React, { useState, useEffect } from 'react';

interface FermiQuestionData {
  id: string;
  question: string;
  context: string;
  breakdown: {
    step: number;
    prompt: string;
    hint?: string;
  }[];
  answerRange: {
    min: number;
    max: number;
    unit: string;
  };
  explanation: string;
}

interface FermiQuestionProps {
  chapter: {
    id: string;
    title: string;
    content: string;
  };
  currentSection: string;
}

// Mock Fermi questions - In production, these would be AI-generated
const MOCK_FERMI_QUESTIONS: FermiQuestionData[] = [
  {
    id: 'fermi-electricity-1',
    question: 'Estimate how many electrons flow through a 60W light bulb per second',
    context: 'Based on the section about electric current and Ohm\'s Law',
    breakdown: [
      {
        step: 1,
        prompt: 'What is the relationship between Power, Voltage, and Current?',
        hint: 'P = V × I'
      },
      {
        step: 2,
        prompt: 'Given a 60W bulb running on 220V, calculate the current',
        hint: 'I = P / V = 60W / 220V'
      },
      {
        step: 3,
        prompt: 'How much charge flows per second? (Remember: 1 Ampere = 1 Coulomb/second)',
        hint: 'Q = I × t, where t = 1 second'
      },
      {
        step: 4,
        prompt: 'How many electrons are in one coulomb?',
        hint: 'Elementary charge e = 1.6 × 10⁻¹⁹ C. So 1C = 1/(1.6 × 10⁻¹⁹) electrons'
      },
      {
        step: 5,
        prompt: 'Calculate total electrons per second',
        hint: 'Multiply charge per second by electrons per coulomb'
      }
    ],
    answerRange: {
      min: 1.5e18,
      max: 2e18,
      unit: 'electrons/second'
    },
    explanation: 'A 60W bulb at 220V draws about 0.27A current. This means ~0.27 coulombs flow per second. Since 1 coulomb = 6.24 × 10¹⁸ electrons, approximately 1.7 × 10¹⁸ electrons flow through the bulb every second! That\'s about 2 quintillion electrons per second! 🤯'
  },
  {
    id: 'fermi-electricity-2',
    question: 'If a house uses 10 light bulbs for 8 hours daily, estimate the monthly electricity cost',
    context: 'Applying concepts of power, energy, and units',
    breakdown: [
      {
        step: 1,
        prompt: 'How many total hours do the bulbs run per month?',
        hint: '10 bulbs × 8 hours/day × 30 days'
      },
      {
        step: 2,
        prompt: 'What is the total energy consumed? (Power × Time = Energy)',
        hint: 'Each bulb is 60W. Convert watt-hours to kilowatt-hours (kWh)'
      },
      {
        step: 3,
        prompt: 'What is the typical electricity rate in India?',
        hint: 'Approximately ₹5-7 per kWh for residential consumers'
      },
      {
        step: 4,
        prompt: 'Calculate the monthly cost',
        hint: 'Energy (kWh) × Rate (₹/kWh)'
      }
    ],
    answerRange: {
      min: 700,
      max: 1000,
      unit: '₹ (Rupees)'
    },
    explanation: '10 bulbs × 60W × 8 hours × 30 days = 144,000 Wh = 144 kWh. At ₹6/kWh, the monthly cost is approximately ₹864. This shows the importance of energy-efficient LED bulbs!'
  }
];

export default function FermiQuestion({ chapter, currentSection }: FermiQuestionProps) {
  const [currentQuestion, setCurrentQuestion] = useState<FermiQuestionData>(MOCK_FERMI_QUESTIONS[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [step: number]: string }>({});
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userFinalAnswer, setUserFinalAnswer] = useState('');

  // Load a random question when component mounts or section changes
  useEffect(() => {
    const randomQuestion = MOCK_FERMI_QUESTIONS[
      Math.floor(Math.random() * MOCK_FERMI_QUESTIONS.length)
    ];
    setCurrentQuestion(randomQuestion);
    setCurrentStep(0);
    setUserAnswers({});
    setShowHint(false);
    setShowAnswer(false);
    setUserFinalAnswer('');
  }, [currentSection]);

  const handleStepAnswer = (answer: string) => {
    setUserAnswers({ ...userAnswers, [currentStep]: answer });
  };

  const handleNextStep = () => {
    if (currentStep < currentQuestion.breakdown.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowHint(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowHint(false);
    }
  };

  const checkAnswer = () => {
    const userValue = parseFloat(userFinalAnswer);
    const { min, max } = currentQuestion.answerRange;

    if (userValue >= min && userValue <= max) {
      return 'correct';
    } else if (userValue >= min * 0.1 && userValue <= max * 10) {
      return 'close'; // Within one order of magnitude
    } else {
      return 'incorrect';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">🔢 Fermi Estimation</h3>
        <p className="text-sm text-gray-400">
          Develop order-of-magnitude reasoning skills through guided breakdown
        </p>
      </div>

      {/* Context */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mb-6">
        <div className="text-xs text-blue-400 font-semibold mb-1">CONTEXT</div>
        <p className="text-sm text-gray-300">{currentQuestion.context}</p>
      </div>

      {/* Main Question */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-xs text-gray-500 font-semibold mb-2">QUESTION</div>
        <p className="text-lg text-white font-medium">{currentQuestion.question}</p>
      </div>

      {/* Guided Breakdown */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase">
            Step {currentStep + 1} of {currentQuestion.breakdown.length}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="px-3 py-1 text-xs bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentStep === currentQuestion.breakdown.length - 1}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-white mb-3">{currentQuestion.breakdown[currentStep].prompt}</p>

          {/* Answer Input */}
          <input
            type="text"
            value={userAnswers[currentStep] || ''}
            onChange={(e) => handleStepAnswer(e.target.value)}
            placeholder="Your answer..."
            className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded focus:border-blue-500 focus:outline-none mb-3"
          />

          {/* Hint Button */}
          {currentQuestion.breakdown[currentStep].hint && (
            <div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-blue-400 hover:text-blue-300 mb-2"
              >
                {showHint ? '🙈 Hide Hint' : '💡 Show Hint'}
              </button>

              {showHint && (
                <div className="bg-blue-900/20 border border-blue-800/30 rounded p-3 text-sm text-blue-200">
                  💡 {currentQuestion.breakdown[currentStep].hint}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex gap-1">
            {currentQuestion.breakdown.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  idx <= currentStep ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Final Answer */}
      {currentStep === currentQuestion.breakdown.length - 1 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-white mb-3">Your Final Estimate</h4>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={userFinalAnswer}
              onChange={(e) => setUserFinalAnswer(e.target.value)}
              placeholder="Enter your final answer..."
              className="flex-1 px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
            <span className="px-3 py-2 bg-gray-900 text-gray-400 border border-gray-700 rounded">
              {currentQuestion.answerRange.unit}
            </span>
          </div>

          <button
            onClick={() => setShowAnswer(true)}
            disabled={!userFinalAnswer}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Check Answer
          </button>
        </div>
      )}

      {/* Answer Feedback */}
      {showAnswer && userFinalAnswer && (
        <div className="mb-6">
          {checkAnswer() === 'correct' && (
            <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4">
              <div className="text-green-400 font-semibold mb-2">🎉 Excellent!</div>
              <p className="text-sm text-gray-300 mb-3">
                Your estimate is within the correct range! You've got great order-of-magnitude intuition.
              </p>
              <div className="text-sm text-gray-400">
                Expected range: {currentQuestion.answerRange.min.toExponential(1)} - {currentQuestion.answerRange.max.toExponential(1)} {currentQuestion.answerRange.unit}
              </div>
            </div>
          )}

          {checkAnswer() === 'close' && (
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
              <div className="text-yellow-400 font-semibold mb-2">📊 Close!</div>
              <p className="text-sm text-gray-300 mb-3">
                You're within one order of magnitude. Good estimation skills! Review the steps to refine your answer.
              </p>
              <div className="text-sm text-gray-400">
                Expected range: {currentQuestion.answerRange.min.toExponential(1)} - {currentQuestion.answerRange.max.toExponential(1)} {currentQuestion.answerRange.unit}
              </div>
            </div>
          )}

          {checkAnswer() === 'incorrect' && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
              <div className="text-red-400 font-semibold mb-2">🤔 Not quite</div>
              <p className="text-sm text-gray-300 mb-3">
                Your estimate is off by more than one order of magnitude. Let's review the breakdown steps.
              </p>
              <div className="text-sm text-gray-400">
                Expected range: {currentQuestion.answerRange.min.toExponential(1)} - {currentQuestion.answerRange.max.toExponential(1)} {currentQuestion.answerRange.unit}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-gray-800 rounded-lg p-4 mt-4">
            <div className="text-xs text-gray-500 font-semibold mb-2">EXPLANATION</div>
            <p className="text-sm text-gray-300">{currentQuestion.explanation}</p>
          </div>
        </div>
      )}

      {/* Next Question Button */}
      {showAnswer && (
        <button
          onClick={() => {
            const nextQuestion = MOCK_FERMI_QUESTIONS[
              (MOCK_FERMI_QUESTIONS.indexOf(currentQuestion) + 1) % MOCK_FERMI_QUESTIONS.length
            ];
            setCurrentQuestion(nextQuestion);
            setCurrentStep(0);
            setUserAnswers({});
            setShowHint(false);
            setShowAnswer(false);
            setUserFinalAnswer('');
          }}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Next Question →
        </button>
      )}

      {/* Info Box */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-4">
          <div className="text-purple-400 font-semibold mb-2">💡 About Fermi Estimation</div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Named after physicist Enrico Fermi, this technique breaks down complex problems into smaller,
            estimable parts. It's widely used in science, engineering, and competitive exams like JEE to
            develop quantitative reasoning skills.
          </p>
        </div>
      </div>
    </div>
  );
}
