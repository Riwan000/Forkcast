import React from 'react';
import { forkcastLogo } from '../logoData';

export default function TableRosterHeader({
  tableId = '12',
  cafeName = 'Forkcast Artisan Café',
  currentDiner = null,
  activeDiners = [],
  targetBudget = 2000,
  currentSpent = 0,
  onResetTable,
  onChangeUser
}) {
  const captain = activeDiners.find((d) => d.is_captain);
  const isCaptain = currentDiner?.is_captain;
  const budgetRatio = targetBudget > 0 ? (currentSpent / targetBudget) : 0;

  // Badge color based on spend vs budget
  let budgetBadgeColor = 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40';
  if (budgetRatio > 1.0) {
    budgetBadgeColor = 'bg-rose-500/20 text-rose-200 border-rose-400/40 animate-pulse';
  } else if (budgetRatio > 0.8) {
    budgetBadgeColor = 'bg-amber-500/20 text-amber-200 border-amber-400/40';
  }

  return (
    <header className="sticky top-0 z-40 bg-[#430000]/95 backdrop-blur-md border-b border-white/20 px-3 sm:px-6 py-2.5 font-tech text-white shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Left: Branding & Table Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Live Table Room" />
            <h1 className="font-brand font-bold text-lg sm:text-xl text-white tracking-wide">
              Table {tableId}
            </h1>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full border border-white/20 text-white/90 hidden xs:inline">
              {cafeName}
            </span>
          </div>

          {/* Quick Roster Count & Switcher for Demo */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <span className="text-[11px] font-bold text-white/80">
              👥 {activeDiners.length} online
            </span>
            {onChangeUser && (
              <button
                onClick={onChangeUser}
                className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90"
              >
                Switch
              </button>
            )}
          </div>
        </div>

        {/* Center: Live Member Roster (Avatars & Captain Badge) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 shrink-0 hidden md:inline">
            Active:
          </span>
          {activeDiners.map((diner) => {
            const isMe = diner.id === currentDiner?.id;
            return (
              <div
                key={diner.id}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all border ${
                  isMe
                    ? 'bg-white text-[#430000] border-white shadow-md'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                }`}
                title={diner.is_captain ? 'Table Captain (Sets budget & orders)' : 'Table Member'}
              >
                <span>{diner.is_captain ? '👑' : (diner.dietary_pref === 'Vegetarian' ? '🌱' : '👤')}</span>
                <span>{diner.name}</span>
                {isMe && <span className="text-[9px] opacity-75 font-normal">(You)</span>}
              </div>
            );
          })}
        </div>

        {/* Right: Budget Preview & Demo Reset */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Spend Meter Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${budgetBadgeColor}`}>
            <span className="text-[10px] opacity-80 uppercase tracking-wider">Spend:</span>
            <span>₹{currentSpent.toLocaleString()}</span>
            <span className="opacity-70 font-normal">/ ₹{targetBudget.toLocaleString()}</span>
          </div>

          {/* Desktop Demo Switch & Reset Actions */}
          <div className="hidden sm:flex items-center gap-1.5">
            {onChangeUser && (
              <button
                onClick={onChangeUser}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                title="Switch demo persona"
              >
                Switch Role
              </button>
            )}
            {onResetTable && (
              <button
                onClick={onResetTable}
                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:border-rose-400/40 border border-white/20 text-white/70 hover:text-rose-200 transition-colors"
                title="Reset table session"
              >
                Reset
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
