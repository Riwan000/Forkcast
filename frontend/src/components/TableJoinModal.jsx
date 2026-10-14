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
          
          {/* Persona Quick Chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-2">
              ⚡ 1-Click Demo Persona:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PERSONAS.map((p) => {
                const isSelected = selectedPersona === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-white text-[#430000] border-white shadow-lg scale-[1.02]'
                        : 'bg-white/5 border-white/20 hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-brand font-bold text-sm">
                        {p.badge} {p.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#430000] text-white' : 'bg-white/20 text-white/90'}`}>
                        {p.role}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 leading-tight line-clamp-1 ${isSelected ? 'text-[#430000]/80' : 'text-white/60'}`}>
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Name Input */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">
                Or Enter Your First Name:
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setSelectedPersona(null);
                }}
                placeholder="e.g. Aryan, Priya, Alex..."
                className="w-full bg-white/10 border border-white/30 rounded-xl px-3.5 py-2.5 text-sm font-tech text-white placeholder-white/40 focus:outline-none focus:border-white focus:bg-white/15 transition-all"
                autoFocus
              />
            </div>

            {/* Enter Button */}
            <button
              type="submit"
              disabled={!customName.trim() || isSubmitting}
              className="w-full sketch-btn-white py-3 px-4 text-sm font-bold shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-[#430000] border-t-transparent rounded-full animate-spin" />
                  <span>Joining Table Room...</span>
                </>
              ) : (
                <>
                  <span>Enter Table Room</span>
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
