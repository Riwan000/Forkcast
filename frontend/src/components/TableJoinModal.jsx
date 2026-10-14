import React, { useState } from 'react';
import { forkcastLogo } from '../logoData';

const DEMO_PERSONAS = [
  { name: 'Aryan', role: 'Captain', badge: '👑', diet: 'None', desc: 'Sets budget & reviews orders' },
  { name: 'Priya', role: 'Vegetarian', badge: '🌱', diet: 'Vegetarian', desc: 'Loves fresh bowls & coffee' },
  { name: 'Rohan', role: 'Fitness', badge: '💪', diet: 'High-Protein', desc: 'Seeks grilled proteins' },
  { name: 'Ananya', role: 'Gluten-Free', badge: '✨', diet: 'Gluten-Free', desc: 'Requires gluten-free options' },
];

export default function TableJoinModal({ isOpen, tableId = '12', cafeName = 'Forkcast Artisan Café', onJoin }) {
  const [customName, setCustomName] = useState('');
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedDiet, setSelectedDiet] = useState('None');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona.name);
    setCustomName(persona.name);
    setSelectedDiet(persona.diet);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalName = customName.trim();
    if (!finalName) return;

    setIsSubmitting(true);
    onJoin({
      name: finalName,
      dietary_pref: selectedDiet,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#430000] border-2 border-white/80 sketch-card shadow-2xl rounded-2xl overflow-hidden font-tech text-white">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/20 bg-[#5b0000]/80 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 border border-white/30 mb-2">
            <span className="text-2xl">🍽️</span>
          </div>
          <h2 className="font-brand font-bold text-2xl text-white tracking-wide">
            Welcome to Table {tableId}
          </h2>
          <p className="text-xs text-white/80 mt-1 font-tech">
            {cafeName} • Collaborative Dining Room
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Custom Name Input (Primary) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                Enter Your First Name:
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setSelectedPersona(null);
                }}
                placeholder="e.g. Aryan, Priya, Rohan..."
                className="w-full bg-white/10 border-2 border-white/40 focus:border-white rounded-xl px-3.5 py-2.5 text-sm font-tech text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition-all"
                autoFocus
              />
            </div>

            {/* Suggested Quick Names (Optional) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Or pick a quick name:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PERSONAS.map((p) => {
                  const isSelected = selectedPersona === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPersona(p)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-white text-[#430000] border-white shadow-md'
                          : 'bg-white/5 border-white/20 hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-brand font-bold text-xs">
                          {p.badge} {p.name}
                        </span>
                        <span className={`text-[8px] px-1 py-0.2 rounded ${isSelected ? 'bg-[#430000] text-white' : 'bg-white/20 text-white/90'}`}>
                          {p.role}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enter Button */}
            <button
              type="submit"
              disabled={!customName.trim() || isSubmitting}
              className="w-full sketch-btn-white py-3 px-4 text-xs font-bold shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-[#430000] border-t-transparent rounded-full animate-spin" />
                  <span>Entering Table Room...</span>
                </>
              ) : (
                <>
                  <span>Join Table {tableId}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-white/60">
            First diner to join becomes <strong>Table Captain 👑</strong> to coordinate orders and budget.
          </p>

        </div>

      </div>

    </div>
  );
}
