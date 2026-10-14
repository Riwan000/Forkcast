import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TableRosterHeader from '../components/TableRosterHeader';
import TableJoinModal from '../components/TableJoinModal';

export default function TableRoomPage() {
  const { cafeId = 'demo-cafe', tableId = '12' } = useParams();
  const navigate = useNavigate();

  // Session & Diner State
  const [currentDiner, setCurrentDiner] = useState(null);
  const [activeDiners, setActiveDiners] = useState([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [targetBudget, setTargetBudget] = useState(2000);
  const [currentSpent, setCurrentSpent] = useState(1080);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'menu' | 'split'
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Broadcast Channel for zero-latency multi-tab sync across demo screens
  const channelRef = useRef(null);

  // Fetch active roster from backend
  const fetchRoster = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/room/${cafeId}/tables/${tableId}/roster`);
      if (res.ok) {
        const data = await res.json();
        setActiveDiners(data.active_diners || []);
        if (data.target_budget) setTargetBudget(data.target_budget);
      }
    } catch (e) {
      console.warn('Backend roster fetch failed, using local broadcast state', e);
    }
  };

  // Fetch menu dishes from Neon DB
  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await fetch(`http://localhost:8000/api/menu/${cafeId}`);
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data.items || []);
      }
    } catch (e) {
      console.warn('Backend menu fetch failed', e);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Initialize table session & multi-tab sync channel
  useEffect(() => {
    // 1. Check existing session for this table in this browser tab
    const sessionKey = `forkcast_${cafeId}_${tableId}_diner`;
    const savedDiner = sessionStorage.getItem(sessionKey);
    if (savedDiner) {
      try {
        setCurrentDiner(JSON.parse(savedDiner));
      } catch (e) {
        setIsJoinModalOpen(true);
      }
    } else {
      setIsJoinModalOpen(true);
    }

    // 2. Initial data fetches
    fetchRoster();
    fetchMenu();

    // 3. Set up BroadcastChannel for zero-latency multi-tab sync
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channel = new BroadcastChannel(`forkcast_table_${cafeId}_${tableId}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'ROSTER_UPDATE' || type === 'JOIN' || type === 'LEAVE') {
          fetchRoster();
        }
      };

      // Notify others this tab is active
      channel.postMessage({ type: 'PING' });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [cafeId, tableId]);

  // Handle Diner Join
  const handleJoin = async ({ name, dietary_pref }) => {
    try {
      const res = await fetch(`http://localhost:8000/api/room/${cafeId}/tables/${tableId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diner_name: name, dietary_pref }),
      });

      if (res.ok) {
        const data = await res.json();
        const joinedDiner = data.diner;
        setCurrentDiner(joinedDiner);
        setActiveDiners(data.active_diners);
        setIsJoinModalOpen(false);

        // Save to this tab's session
        const sessionKey = `forkcast_${cafeId}_${tableId}_diner`;
        sessionStorage.setItem(sessionKey, JSON.stringify(joinedDiner));

        // Broadcast to all other open tabs on this table!
        if (channelRef.current) {
          channelRef.current.postMessage({
            type: 'JOIN',
            payload: joinedDiner,
          });
        }
      }
    } catch (e) {
      console.error('Join table failed:', e);
    }
  };

  // Handle Switch User (for demoing different roles)
  const handleSwitchUser = () => {
    setIsJoinModalOpen(true);
  };

  // Handle Reset Table (for clean demo restart)
  const handleResetTable = async () => {
    if (!confirm(`Reset Table ${tableId} roster? All members will be cleared.`)) return;
    try {
      await fetch(`http://localhost:8000/api/room/${cafeId}/tables/${tableId}/reset`, {
        method: 'POST',
      });
      sessionStorage.removeItem(`forkcast_${cafeId}_${tableId}_diner`);
      setCurrentDiner(null);
      setActiveDiners([]);
      setIsJoinModalOpen(true);

      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'ROSTER_UPDATE' });
      }
    } catch (e) {
      console.error('Reset table failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#430000] text-white flex flex-col font-tech selection:bg-white selection:text-[#430000]">
      
      {/* 1. STICKY LIVE ROSTER HEADER (Feature C-1) */}
      <TableRosterHeader
        tableId={tableId}
        cafeName="Forkcast Artisan Café"
        currentDiner={currentDiner}
        activeDiners={activeDiners}
        targetBudget={targetBudget}
        currentSpent={currentSpent}
        onChangeUser={handleSwitchUser}
        onResetTable={handleResetTable}
      />

      {/* 2. ZERO-FRICTION JOIN MODAL (Feature C-1) */}
      <TableJoinModal
        isOpen={isJoinModalOpen}
        tableId={tableId}
        cafeName="Forkcast Artisan Café"
        onJoin={handleJoin}
      />

      {/* 3. MAIN TABLE ROOM CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4 flex flex-col">
        
        {/* Navigation Tabs (Chat | Menu & Live Cart | Bill Split) */}
        <div className="flex items-center border-b border-white/20 bg-[#5b0000]/60 backdrop-blur-md rounded-t-xl px-2 pt-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'chat'
                ? 'text-white border-white bg-white/10 rounded-t-lg'
                : 'text-white/70 border-transparent hover:text-white'
            }`}
          >
            <span>💬</span>
            <span>Ambient AI Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-2.5 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'menu'
                ? 'text-white border-white bg-white/10 rounded-t-lg'
                : 'text-white/70 border-transparent hover:text-white'
            }`}
          >
            <span>🍽️</span>
            <span>Menu & Live Cart</span>
            <span className="bg-white text-[#430000] font-bold text-[10px] px-1.5 py-0.2 rounded-full">
              3
            </span>
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`flex-1 py-2.5 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'split'
                ? 'text-white border-white bg-white/10 rounded-t-lg'
                : 'text-white/70 border-transparent hover:text-white'
            }`}
          >
            <span>🧾</span>
            <span>Live Bill Split</span>
          </button>
        </div>

        {/* Tab View Body */}
        <div className="flex-1 bg-[#5b0000]/40 border-x border-b border-white/20 rounded-b-xl p-3 sm:p-5 flex flex-col min-h-[500px]">
          
          {/* Active Diner Status Banner */}
          <div className="mb-4 bg-white/5 border border-white/15 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentDiner?.is_captain ? '👑' : '👤'}</span>
              <div>
                <p className="text-xs font-bold text-white">
                  Logged in as <span className="underline decoration-white/40">{currentDiner?.name || 'Guest'}</span>
                  {currentDiner?.is_captain && <span className="text-amber-200 ml-1.5 font-normal">(Table Captain)</span>}
                </p>
                <p className="text-[10px] text-white/70">
                  {currentDiner?.is_captain
                    ? 'You have checkout authority to send orders to the kitchen.'
                    : 'Browse dishes, chat with AI, and add to the shared table cart.'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                🟢 Live Synced
              </span>
            </div>
          </div>

          {/* TAB 1: AMBIENT AI CHAT (Placeholder for C-2 & C-3) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Captain Aryan Welcome */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    👑
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 border border-white/20 max-w-[85%]">
                    <p className="text-[10px] font-bold text-white/90 mb-0.5">Aryan (Captain)</p>
                    <p className="text-xs text-white">
                      Hey everyone! I joined Table {tableId}. Let’s keep it around ₹2,000 total. What is everyone craving?
                    </p>
                  </div>
                </div>

                {/* Ambient AI Card */}
                <div className="bg-[#430000]/80 border-2 border-white/40 rounded-xl p-3 max-w-[90%] shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <span>✨</span>
                    <span>Ambient AI Concierge</span>
                    <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-normal">Listening</span>
                  </div>
                  <p className="text-xs text-white/90">
                    Welcome to Forkcast! I am quietly monitoring your table banter. Ask me for recommendations, dietary options, or tag <code className="bg-white/20 px-1 rounded text-white">@AI</code> anytime!
                  </p>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="pt-2">
                <div className="flex items-center gap-2 bg-[#430000] border-2 border-white/40 rounded-2xl p-2 shadow-xl">
                  <input
                    type="text"
                    placeholder="Chat with table or ask @AI for recommendations..."
                    className="flex-1 bg-transparent px-3 py-1.5 text-xs font-tech text-white placeholder-white/40 focus:outline-none"
                  />
                  <button className="sketch-btn-white px-4 py-1.5 text-xs font-bold">
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU & CART (Placeholder for C-4 & C-5) */}
          {activeTab === 'menu' && (
            <div className="space-y-3">
              <h3 className="font-brand font-bold text-base text-white">
                Dishes from Café Menu ({menuItems.length} items available)
              </h3>
              <p className="text-xs text-white/70">
                Menu and collaborative cart are ready for Feature C-4 and C-5.
              </p>
            </div>
          )}

          {/* TAB 3: BILL SPLIT (Placeholder for C-7) */}
          {activeTab === 'split' && (
            <div className="space-y-3">
              <h3 className="font-brand font-bold text-base text-white">
                Live Per-Person Bill Split
              </h3>
              <p className="text-xs text-white/70">
                Live calculation ready for Feature C-7.
              </p>
            </div>
          )}

        </div>

      </main>

      {/* 4. FLOATING DEMO PRESENTER BAR (For effortless multi-tab role demonstration) */}
      <footer className="bg-[#430000] border-t border-white/20 p-2 sm:p-2.5 text-center text-xs">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-white/60">Demo Presets:</span>
            <button
              onClick={() => handleJoin({ name: 'Aryan', dietary_pref: 'None' })}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold border border-white/20"
            >
              👑 Aryan (Captain)
            </button>
            <button
              onClick={() => handleJoin({ name: 'Priya', dietary_pref: 'Vegetarian' })}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold border border-white/20"
            >
              🌱 Priya (Veg)
            </button>
            <button
              onClick={() => handleJoin({ name: 'Rohan', dietary_pref: 'High-Protein' })}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold border border-white/20"
            >
              💪 Rohan (Protein)
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="text-[11px] text-white/70 hover:text-white underline"
          >
            ← Back to Landing & Menu Ingestion
          </button>
        </div>
      </footer>

    </div>
  );
}
