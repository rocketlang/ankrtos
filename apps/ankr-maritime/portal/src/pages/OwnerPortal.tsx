/**
 * Owner Portal - Fleet Management & P&L
 */

import React from 'react';

export function OwnerPortal() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold text-cyan-400 mb-4">Owner Portal</h1>
      <p className="text-slate-300 mb-8">Fleet Management & Voyage P&L</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-cyan-400">
          <h3 className="text-sm text-slate-400 mb-2">Active Vessels</h3>
          <p className="text-3xl font-bold">24</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-green-400">
          <h3 className="text-sm text-slate-400 mb-2">On Hire</h3>
          <p className="text-3xl font-bold">18</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border-l-4 border-blue-400">
          <h3 className="text-sm text-slate-400 mb-2">Available</h3>
          <p className="text-3xl font-bold">6</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Fleet Overview</h2>
        <p className="text-slate-400">Real-time vessel positions, hire status, and earnings.</p>
      </div>
    </div>
  );
}
