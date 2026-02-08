import React, { useState } from 'react';

interface LogicQuestion {
  id: string;
  type: 'fallacy' | 'conditional' | 'argument' | 'necessary-sufficient';
  statement: string;
  question: string;
  options: {
    label: string;
    value: string;
    explanation: string;
  }[];
  correctAnswer: string;
  detailedExplanation: string;
}

interface LogicChallengeProps {
  chapter: {
    id: string;
    title: string;
    content: string;
  };
  currentSection: string;
}

// Mock logic challenges - In production, these would be AI-generated from chapter content
const MOCK_CHALLENGES: LogicQuestion[] = [
  {
    id: 'logic-1',
    type: 'fallacy',
    statement: 'All successful technology companies use AI. Therefore, if we use AI in our product, we will be successful.',
    question: 'What logical fallacy is present in this argument?',
    options: [
      {
        label: 'Affirming the Consequent',
        value: 'affirming',
        explanation: 'Correct! This fallacy assumes that if A→B is true, then B→A must also be true. Just because successful companies use AI doesn\'t mean using AI guarantees success.'
      },
      {
        label: 'False Dichotomy',
        value: 'dichotomy',
        explanation: 'Not quite. False dichotomy presents only two options when more exist. This isn\'t the case here.'
      },
      {
        label: 'Appeal to Authority',
        value: 'authority',
        explanation: 'No. Appeal to authority means accepting something as true just because an authority said it.'
      },
      {
        label: 'Hasty Generalization',
        value: 'hasty',
        explanation: 'Close, but not exactly. While there\'s some generalization, the main flaw is reversing the logical relationship.'
      }
    ],
    correctAnswer: 'affirming',
    detailedExplanation: 'This is a classic example of "Affirming the Consequent." The structure is: "If A (success), then B (uses AI). B is true, therefore A must be true." But this reverses the logic incorrectly. Many companies use AI but aren\'t successful, just as many factors beyond AI contribute to success.'
  },
  {
    id: 'logic-2',
    type: 'conditional',
    statement: 'Given: IF a circuit has resistance R, THEN current I = V/R. A circuit has current I = 5A. ',
    question: 'Can we definitively conclude the circuit has resistance?',
    options: [
      {
        label: 'Yes, definitely',
        value: 'yes',
        explanation: 'Not quite. While practical circuits do have resistance, logically we can\'t conclude this from the given statement alone.'
      },
      {
        label: 'No, we need more information',
        value: 'no',
        explanation: 'Correct! We know IF resistance exists THEN current follows I=V/R. But observing current doesn\'t prove resistance exists - that would be affirming the consequent. (Though in reality, all circuits do have resistance!)'
      },
      {
        label: 'Only if voltage is known',
        value: 'voltage',
        explanation: 'Voltage isn\'t the issue here. The logical flaw is assuming the reverse of a conditional statement.'
      }
    ],
    correctAnswer: 'no',
    detailedExplanation: 'From a pure logic standpoint, we cannot conclude resistance exists just from observing current. The statement "IF R exists, THEN I = V/R" doesn\'t mean "IF I = V/R, THEN R exists." This would be affirming the consequent. In physics, we know all circuits have resistance, but logically, we\'d need additional premises.'
  },
  {
    id: 'logic-3',
    type: 'necessary-sufficient',
    statement: 'For a bulb to light up, electricity must flow through it.',
    question: 'Is electricity flow necessary, sufficient, or both for a bulb to light?',
    options: [
      {
        label: 'Necessary (required, but not enough alone)',
        value: 'necessary',
        explanation: 'Correct! Electricity is necessary - without it, the bulb won\'t light. But it\'s not sufficient alone - you also need the bulb to be intact, proper voltage, etc.'
      },
      {
        label: 'Sufficient (enough by itself)',
        value: 'sufficient',
        explanation: 'Not quite. While electricity is needed, it\'s not enough alone. The bulb must also be functional.'
      },
      {
        label: 'Both necessary and sufficient',
        value: 'both',
        explanation: 'No. While electricity is required (necessary), other conditions are also needed (bulb must work, correct voltage, etc.).'
      },
      {
        label: 'Neither',
        value: 'neither',
        explanation: 'Incorrect. Electricity is definitely necessary - a bulb cannot light without it.'
      }
    ],
    correctAnswer: 'necessary',
    detailedExplanation: 'Electricity is NECESSARY but not SUFFICIENT. Think of it this way:\n- Without electricity → Bulb definitely won\'t light (proves it\'s necessary)\n- With electricity → Bulb might light, but only if other conditions are met (proves it\'s not sufficient)\n\nOther needed conditions: functional bulb, proper voltage, complete circuit, etc.'
  },
  {
    id: 'logic-4',
    type: 'argument',
    statement: 'Claim: "Increasing wire thickness reduces resistance."\n\nPremise 1: Resistance R = ρL/A (where A is cross-sectional area)\nPremise 2: Thicker wire has larger area A\nPremise 3: R is inversely proportional to A\n\nConclusion: Therefore, thicker wire has less resistance.',
    question: 'Is this argument valid?',
    options: [
      {
        label: 'Valid - conclusion follows from premises',
        value: 'valid',
        explanation: 'Correct! The premises logically lead to the conclusion. If R ∝ 1/A and A increases, then R decreases. This is a valid deductive argument.'
      },
      {
        label: 'Invalid - contains logical flaw',
        value: 'invalid',
        explanation: 'Actually, this argument is valid. The conclusion follows logically from the premises provided.'
      },
      {
        label: 'Valid but assumes constant length',
        value: 'assumes',
        explanation: 'While this is true (L must be constant for the comparison), it doesn\'t make the argument invalid - just adds a constraint.'
      }
    ],
    correctAnswer: 'valid',
    detailedExplanation: 'This is a VALID argument because the conclusion follows logically from the premises:\n\n1. R = ρL/A (given formula)\n2. A increases (thicker wire)\n3. R ∝ 1/A (inverse relationship)\n4. Therefore R decreases ✓\n\nNote: "Valid" means the logic is sound, not that the premises are true. In this case, the premises ARE true (Ohm\'s law), so the argument is both valid AND sound.'
  }
];

export default function LogicChallenge({ chapter, currentSection }: LogicChallengeProps) {
  const [currentQuestion, setCurrentQuestion] = useState<LogicQuestion>(MOCK_CHALLENGES[0]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const handleSelectAnswer = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleCheckAnswer = () => {
    setShowExplanation(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setScore({
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1
    });
  };

  const handleNextQuestion = () => {
    const currentIndex = MOCK_CHALLENGES.indexOf(currentQuestion);
    const nextIndex = (currentIndex + 1) % MOCK_CHALLENGES.length;
    setCurrentQuestion(MOCK_CHALLENGES[nextIndex]);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const getTypeLabel = (type: LogicQuestion['type']) => {
    switch (type) {
      case 'fallacy': return '🎭 Fallacy Identification';
      case 'conditional': return '➡️ Conditional Reasoning';
      case 'argument': return '📜 Argument Analysis';
      case 'necessary-sufficient': return '⚖️ Necessary vs Sufficient';
      default: return '🧩 Logic Challenge';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">🧩 Logic Challenge</h3>
        <p className="text-sm text-gray-400">
          Develop structured reasoning and critical thinking skills
        </p>
      </div>

      {/* Score */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">YOUR SCORE</div>
            <div className="text-2xl font-bold text-white">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">QUESTIONS</div>
            <div className="text-lg text-gray-300">
              {score.correct} / {score.total} correct
            </div>
          </div>
        </div>
      </div>

      {/* Question Type */}
      <div className="bg-orange-900/20 border border-orange-800/30 rounded-lg p-3 mb-4">
        <div className="text-sm font-semibold text-orange-400">
          {getTypeLabel(currentQuestion.type)}
        </div>
      </div>

      {/* Statement */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-xs text-gray-500 font-semibold mb-2">STATEMENT</div>
        <div className="text-gray-200 whitespace-pre-line leading-relaxed">
          {currentQuestion.statement}
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-white mb-3">
          {currentQuestion.question}
        </div>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option.value;
            const isCorrect = option.value === currentQuestion.correctAnswer;
            const showStatus = showExplanation;

            return (
              <button
                key={idx}
                onClick={() => !showExplanation && handleSelectAnswer(option.value)}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  showStatus && isCorrect
                    ? 'border-green-500 bg-green-900/20'
                    : showStatus && isSelected && !isCorrect
                    ? 'border-red-500 bg-red-900/20'
                    : isSelected
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Radio Button */}
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    showStatus && isCorrect
                      ? 'border-green-500'
                      : showStatus && isSelected && !isCorrect
                      ? 'border-red-500'
                      : isSelected
                      ? 'border-blue-500'
                      : 'border-gray-600'
                  }`}>
                    {isSelected && (
                      <div className={`w-3 h-3 rounded-full ${
                        showStatus && isCorrect
                          ? 'bg-green-500'
                          : showStatus && !isCorrect
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`} />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1">
                    <div className={`font-medium mb-1 ${
                      showStatus && isCorrect
                        ? 'text-green-400'
                        : showStatus && isSelected && !isCorrect
                        ? 'text-red-400'
                        : 'text-white'
                    }`}>
                      {option.label}
                    </div>

                    {/* Explanation (shown after checking) */}
                    {showExplanation && (isCorrect || isSelected) && (
                      <div className={`text-sm mt-2 ${
                        isCorrect ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {option.explanation}
                      </div>
                    )}
                  </div>

                  {/* Status Icon */}
                  {showStatus && isCorrect && (
                    <div className="text-green-500 text-xl">✓</div>
                  )}
                  {showStatus && isSelected && !isCorrect && (
                    <div className="text-red-500 text-xl">✗</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Check Answer Button */}
      {!showExplanation && (
        <button
          onClick={handleCheckAnswer}
          disabled={!selectedAnswer}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Check Answer
        </button>
      )}

      {/* Detailed Explanation */}
      {showExplanation && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-500 font-semibold mb-2">DETAILED EXPLANATION</div>
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {currentQuestion.detailedExplanation}
            </div>
          </div>

          {/* Next Question Button */}
          <button
            onClick={handleNextQuestion}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Next Challenge →
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-4">
          <div className="text-purple-400 font-semibold mb-2">💡 Why Logic Matters</div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Critical thinking and logical reasoning are essential for:
            <br />• Understanding scientific arguments in textbooks
            <br />• Avoiding common reasoning errors
            <br />• Competitive exams (JEE, NEET, UPSC)
            <br />• Making sound decisions in life
          </p>
        </div>
      </div>
    </div>
  );
}
