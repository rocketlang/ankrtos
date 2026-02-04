/**
 * Expense Logger - Voice-enabled expense tracking for drivers
 * "500 diesel bhara" → Logged!
 */

import React, { useState } from 'react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  timestamp: Date;
  tripId?: string;
  notes?: string;
  receiptPhoto?: string;
}

interface ExpenseLoggerProps {
  tripId?: string;
  onExpenseLogged?: (expense: Expense) => void;
  language?: string;
}

const EXPENSE_CATEGORIES = [
  { id: 'diesel', icon: '⛽', name: { en: 'Diesel', hi: 'डीज़ल' } },
  { id: 'petrol', icon: '⛽', name: { en: 'Petrol', hi: 'पेट्रोल' } },
  { id: 'toll', icon: '🛣️', name: { en: 'Toll', hi: 'टोल' } },
  { id: 'food', icon: '🍽️', name: { en: 'Food', hi: 'खाना' } },
  { id: 'parking', icon: '🅿️', name: { en: 'Parking', hi: 'पार्किंग' } },
  { id: 'repair', icon: '🔧', name: { en: 'Repair', hi: 'रिपेयर' } },
  { id: 'other', icon: '📝', name: { en: 'Other', hi: 'अन्य' } },
];

export function ExpenseLogger({ tripId, onExpenseLogged, language = 'hi' }: ExpenseLoggerProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('diesel');
  const [notes, setNotes] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);

  const logExpense = (amt?: number, cat?: string) => {
    const expense: Expense = {
      id: Date.now().toString(),
      amount: amt || parseInt(amount) || 0,
      category: cat || category,
      timestamp: new Date(),
      tripId,
      notes,
    };

    setExpenses(prev => [expense, ...prev]);
    onExpenseLogged?.(expense);
    
    // Reset form
    setAmount('');
    setNotes('');
    setShowForm(false);

    // Vibrate feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  // Called from voice command
  const logFromVoice = (amt: number, cat: string) => {
    logExpense(amt, cat);
  };

  const totalToday = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">
            {language === 'hi' ? '💰 आज के खर्चे' : '💰 Today\'s Expenses'}
          </h3>
          <p className="text-2xl font-bold text-orange-600">₹{totalToday.toLocaleString()}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600"
        >
          {showForm ? '✕' : '+ Add'}
        </button>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 space-y-3">
          {/* Amount */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              {language === 'hi' ? 'रकम (₹)' : 'Amount (₹)'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className="w-full px-4 py-3 text-2xl font-bold border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Buttons */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              {language === 'hi' ? 'श्रेणी' : 'Category'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    category === cat.id
                      ? 'bg-orange-500 text-white scale-105'
                      : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <div className="text-xl">{cat.icon}</div>
                  <div className="text-xs">{cat.name[language as 'en' | 'hi'] || cat.name.en}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => logExpense()}
            disabled={!amount || parseInt(amount) <= 0}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold text-lg
              disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600"
          >
            {language === 'hi' ? '✓ खर्चा जोड़ें' : '✓ Add Expense'}
          </button>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            {language === 'hi' ? 'कोई खर्चा नहीं' : 'No expenses yet'}
          </div>
        ) : (
          expenses.map(exp => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
            return (
              <div 
                key={exp.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat?.icon || '📝'}</span>
                  <div>
                    <div className="font-medium">
                      {cat?.name[language as 'en' | 'hi'] || cat?.name.en || exp.category}
                    </div>
                    <div className="text-xs text-gray-500">
                      {exp.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-orange-600">₹{exp.amount}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Export for voice integration
export { ExpenseLogger, EXPENSE_CATEGORIES };
export type { Expense };
