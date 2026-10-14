import React, { useState, useEffect, useRef } from 'react';
import { translations } from './translations';
import { forkcastLogo } from './logoData';
import { hospitalitySketch } from './hospitalityData';
import { cafeSketch } from './cafeData';
import TopoField from './components/ui/topo-field';
import MenuUploadDemo from './components/MenuUploadDemo';

// Hook to crop transparent padding tightly so the fork & knife artwork fills its frame and displays big
function useCroppedLogo(src) {
  const [croppedSrc, setCroppedSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const d = imgData.data;

        let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
        let hasPixels = false;

        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const a = d[idx + 3];
            const g = d[idx + 1];
            const b = d[idx + 2];

            const lineStrength = Math.max(g, b);
            if (a > 15 && lineStrength > 20) {
              hasPixels = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (hasPixels && maxX > minX && maxY > minY) {
          const pad = 1;
          const x0 = Math.max(0, minX - pad);
          const y0 = Math.max(0, minY - pad);
          const w = Math.min(img.width - x0, maxX - x0 + pad * 2);
          const h = Math.min(img.height - y0, maxY - y0 + pad * 2);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = w;
          cropCanvas.height = h;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
            setCroppedSrc(cropCanvas.toDataURL('image/png'));
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    img.src = src;
  }, [src]);

  return croppedSrc;
}

// Hook to convert black-and-white sketch on paper into transparent pure-white linework
function useWhiteLineSketch(src) {
  const [whiteSketchSrc, setWhiteSketchSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const d = imgData.data;

        let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
        let hasPixels = false;

        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const lum = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114;

            if (lum >= 225) {
              d[idx + 3] = 0; // Transparent paper
            } else {
              const darkness = Math.max(0, 225 - lum);
              const alpha = Math.min(255, Math.round(Math.pow(darkness / 170, 0.9) * 255));
              d[idx] = 255;
              d[idx + 1] = 255;
              d[idx + 2] = 255;
              d[idx + 3] = alpha;

              if (alpha > 20) {
                hasPixels = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        if (hasPixels && maxX > minX && maxY > minY) {
          const pad = 4;
          const x0 = Math.max(0, minX - pad);
          const y0 = Math.max(0, minY - pad);
          const w = Math.min(img.width - x0, maxX - x0 + pad * 2);
          const h = Math.min(img.height - y0, maxY - y0 + pad * 2);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = w;
          cropCanvas.height = h;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
            setWhiteSketchSrc(cropCanvas.toDataURL('image/png'));
          }
        } else {
          setWhiteSketchSrc(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    img.src = src;
  }, [src]);

  return whiteSketchSrc;
}

// Living Interactive Mascot with organic float, 3D mouse parallax, and click reaction
function LivingMascot({ src }) {
  const [cheer, setCheer] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Mouse tilt tracking
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleCheer = () => {
    setCheer(true);
    setTimeout(() => setCheer(false), 650);
  };

  const tiltStyle = {
    transform: cheer
      ? undefined
      : `perspective(700px) rotateY(${mousePos.x * 12}deg) rotateX(${-mousePos.y * 10}deg)`,
    transition: 'transform 0.15s ease-out',
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCheer}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none group w-full"
    >
      {/* Floating Animated Character */}
      <div
        style={tiltStyle}
        className={`relative z-10 transition-transform ${cheer ? 'animate-jump-cheer' : 'animate-mascot-float'}`}
      >
        <img
          src={src}
          alt="Forkcast Mascot Characters"
          className="h-14 xs:h-18 sm:h-48 md:h-60 lg:h-[350px] xl:h-[400px] w-auto object-contain filter drop-shadow-[0_10px_28px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_14px_32px_rgba(0,0,0,0.6)]"
        />
      </div>

      {/* Synchronized Ground Shadow */}
      <div className="mt-[-4px] sm:mt-[-10px] w-14 xs:w-18 sm:w-36 md:w-44 h-1.5 sm:h-3.5 bg-black/45 rounded-[100%] blur-[2px] animate-mascot-shadow pointer-events-none" />
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [langOpen, setLangOpen] = useState(false);
  const [isMenuUploadOpen, setIsMenuUploadOpen] = useState(false);
  const [demoTab, setDemoTab] = useState('chat');
  const [cartCount, setCartCount] = useState(3);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistData, setWaitlistData] = useState({ name: '', email: '', cafe: '', city: '' });

  const croppedLogo = useCroppedLogo(forkcastLogo);
  const whiteWaiterSketch = useWhiteLineSketch(hospitalitySketch);
  const whiteCafeSketch = useWhiteLineSketch(cafeSketch);
  const t = translations[lang] || translations.en;
  const isRtl = t.dir === 'rtl';

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ar', label: 'العربية', short: 'العربية' },
    { code: 'ml', label: 'മലയാളം', short: 'മലയാളം' },
  ];
  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    if (!langOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('#lang-dropdown')) {
        setLangOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [langOpen]);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (waitlistData.email) {
      setWaitlistSubmitted(true);
    }
  };

  return (
    <div className={`snap-wrapper bg-[#430000] text-white selection:bg-white selection:text-[#430000] relative ${isRtl ? 'rtl' : 'ltr'}`} dir={t.dir}>
      
      {/* AMBIENT WHITE CULINARY TOPOGRAPHIC BACKGROUND (Food contour lines in white over #430000 with soft blur) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-25 blur-[1.2px]">
        <TopoField className="w-full h-full" foodShape={true} speed={0.65} background="#430000" blur={1.2} />
      </div>

      {/* FLOATING TOP-RIGHT ACTIONS: DEMO BUTTON & LANGUAGE DROPDOWN */}
      <div className="fixed top-3 sm:top-4 right-3 sm:right-5 rtl:right-auto rtl:left-3 sm:rtl:left-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsMenuUploadOpen(true)}
          className="bg-white text-[#430000] hover:bg-white/90 font-tech font-bold text-xs px-3 sm:px-3.5 py-1.5 sketch-pill flex items-center gap-1.5 transition-all select-none shadow-xl active:scale-95 cursor-pointer"
        >
          <span className="hidden xs:inline">Try Demo</span>
          <span className="xs:hidden">Demo</span>
        </button>

        <div id="lang-dropdown" className="relative">
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="bg-[#430000]/90 backdrop-blur-md hover:bg-[#430000] text-white border-2 border-white/80 font-tech font-bold text-xs px-3 sm:px-3.5 py-1.5 sketch-pill flex items-center gap-1.5 transition-all select-none shadow-lg active:scale-95 cursor-pointer"
          >
            <span>{currentLang.short}</span>
            <span className={`text-[8px] transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {langOpen && (
            <div className="absolute top-full mt-1.5 right-0 rtl:right-auto rtl:left-0 bg-[#430000] sketch-card p-1 shadow-2xl z-50 min-w-[130px] font-tech text-xs border-2 border-white/80 animate-in fade-in zoom-in-95 duration-100">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full text-left rtl:text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                    lang === l.code ? 'bg-white text-[#5b0000] font-bold shadow-sm' : 'text-white/85 hover:bg-white/15'
                  }`}
                >
                  <span>{l.label}</span>
                  {lang === l.code && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. HERO SECTION (Hybrid: Fluid Natural Scroll on Mobile, Full Viewport Snap on Desktop) */}
      <section id="hero" className="snap-panel min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] h-auto max-h-none overflow-visible lg:overflow-hidden px-4 sm:px-8 md:px-12 lg:px-16 pt-10 xs:pt-12 sm:pt-14 lg:pt-8 pb-10 sm:pb-12 lg:pb-8 w-full relative flex flex-col justify-between">
        
        {/* Upper Centre: Brand Name & Logo */}
        <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 pt-2 pb-3 sm:pb-2 select-none z-10">
          <img
            src={croppedLogo}
            alt="Forkcast Logo"
            className="h-12 xs:h-14 sm:h-18 md:h-20 lg:h-22 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
          />
          <span className="font-brand text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider uppercase text-white drop-shadow-sm leading-none">
            {t.brandName}
          </span>
        </div>

        {/* Main 2-Column Hero: Left Text Aligned, Right Image Bigger */}
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12 xl:gap-16 min-h-0 my-auto">
          
          {/* Left Column: Text (Left Aligned) */}
          <div className="flex-1 text-left rtl:text-right flex flex-col items-start rtl:items-end justify-center max-w-2xl px-1 sm:px-2 lg:px-0">
            <h1 className="font-brand text-3xl xs:text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-tight mb-3 sm:mb-4 text-left rtl:text-right">
              {t.hero.headline}
            </h1>

            <p className="font-tech text-sm xs:text-base sm:text-lg text-white/85 leading-relaxed mb-5 sm:mb-6 max-w-xl text-left rtl:text-right">
              {t.hero.subhead}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 sm:gap-4 font-tech font-bold text-sm sm:text-base w-full sm:w-auto">
              <a
                href="#waitlist"
                className="sketch-btn-white px-6 sm:px-8 py-3 sm:py-3.5 shadow-xl transition-all active:scale-95 text-center"
              >
                {t.hero.ctaPrimary}
              </a>
              <button
                type="button"
                onClick={() => setIsMenuUploadOpen(true)}
                className="sketch-btn-outline bg-white/10 hover:bg-white/20 text-white px-6 sm:px-8 py-3 sm:py-3.5 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.hero.ctaSecondary} (Try Demo)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Pure White Hand-Drawn Hospitality Character Art (Bigger) */}
          <div className="flex-1 min-h-0 w-full sm:w-auto lg:max-w-[560px] xl:max-w-[640px] shrink-0 flex flex-col items-center justify-center relative select-none pt-4 lg:pt-0 pb-2 lg:pb-0">
            {/* Static White Sketch Artwork */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <img
                src={whiteWaiterSketch}
                alt="Waiter delivering hospitality"
                className="w-full max-w-[280px] xs:max-w-[340px] sm:max-w-[420px] lg:max-w-none h-auto max-h-[340px] sm:max-h-[420px] lg:max-h-none lg:h-[440px] xl:h-[500px] 2xl:h-[540px] object-contain select-none filter drop-shadow-[0_10px_26px_rgba(0,0,0,0.5)]"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>

            {/* Static Ground Shadow */}
            <div className="mt-[-8px] sm:mt-[-14px] w-3/5 sm:w-4/5 max-w-[240px] sm:max-w-[340px] lg:w-80 xl:w-96 h-2 sm:h-4 bg-black/40 rounded-[100%] blur-[2px] pointer-events-none" />
          </div>

        </div>

        {/* Bouncing Scroll Cue */}
        <div className="hidden lg:flex absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex-col items-center gap-0.5 text-white/50 animate-bounce pointer-events-none text-xs font-tech">
          <span className="text-[10px] uppercase tracking-wider">Scroll</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* 3. INTERACTIVE LIVE DEMO SECTION (Hybrid: Fluid Natural Scroll on Mobile, Full Viewport Snap on Desktop) */}
      <section
        id="demo"
        className="snap-panel px-3 sm:px-8 py-12 sm:py-16 lg:py-8 bg-[#430000]/60 border-y border-white/15 w-full min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] h-auto overflow-visible lg:overflow-hidden flex flex-col justify-center items-center relative"
      >
        <div className="max-w-xl mx-auto w-full flex flex-col justify-center items-center py-2">
          
          {/* Header Title & Subtitle */}
          <div className="text-center mb-4 sm:mb-6 shrink-0">
            <h2 className="font-brand text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1 leading-tight">
              {t.demoSection.title}
            </h2>
            <p className="font-tech text-xs sm:text-sm text-white/80">
              {t.demoSection.subtitle}
            </p>
          </div>

          {/* Whimsical Hand-Drawn Character Smartphone (matches user sketch media_1791798077107.jpg) */}
          <div className="relative w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[450px] mx-auto py-2 sm:py-5 px-3 sm:px-5 select-none flex items-center justify-center shrink min-h-0">

            {/* Top-Left Radiating Action Dashes (\ | /) */}
            <svg className="absolute -top-1 left-2 sm:left-4 w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 text-white/90 pointer-events-none" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M 8 26 L 2 24" />
              <path d="M 14 18 L 4 11" />
              <path d="M 22 14 L 18 3" />
            </svg>

            {/* Top-Right Speech Bubble (...) */}
            <div className="absolute -top-5 xs:-top-6 sm:-top-7 right-1 sm:right-3 z-20 pointer-events-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
              <svg className="w-14 h-11 xs:w-16 xs:h-13 sm:w-24 sm:h-18 text-white" viewBox="0 0 92 72" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 22 52 C 14 47, 8 37, 8 26 C 8 13, 26 4, 48 4 C 70 4, 86 13, 86 26 C 86 39, 70 48, 48 48 C 39 48, 30 46, 24 43 L 13 54 C 15 48, 16 46, 18 42" fill="#430000" />
                <circle cx="36" cy="25" r="3" fill="#ffffff" stroke="none" />
                <circle cx="48" cy="25" r="3" fill="#ffffff" stroke="none" />
                <circle cx="60" cy="25" r="3" fill="#ffffff" stroke="none" />
              </svg>
            </div>

            {/* Right 4-Point Sparkle Star (✦) */}
            <svg className="absolute top-10 xs:top-14 right-2 sm:right-6 w-5 h-5 sm:w-6 sm:h-6 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
              <path d="M 12 3 C 12 7.5, 14 9.5, 19 12 C 14 14.5, 12 16.5, 12 21 C 12 16.5, 10 14.5, 5 12 C 10 9.5, 12 7.5, 12 3 Z" />
            </svg>

            {/* Right Waving Stick Arm with Motion Arcs )) */}
            <div className="absolute top-24 xs:top-32 sm:top-48 -right-6 sm:-right-9 z-10 pointer-events-none">
              <svg className="w-12 h-16 xs:w-14 xs:h-18 sm:w-20 sm:h-24 text-white" viewBox="0 0 74 90" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                {/* Arm curving up from phone edge */}
                <path d="M 2 76 C 18 72, 38 52, 44 28" />
                {/* Hand & 4 cartoon fingers splayed waving */}
                <path d="M 44 28 L 39 14" />
                <path d="M 44 28 L 47 10" />
                <path d="M 44 28 L 54 13" />
                <path d="M 44 28 L 60 21" />
                {/* Double Motion Arcs )) beside waving hand */}
                <path d="M 62 10 C 67 15, 67 22, 63 26" strokeWidth="2.2" />
                <path d="M 68 8 C 74 15, 74 24, 69 29" strokeWidth="2.2" />
              </svg>
            </div>

            {/* Right 4-Point Sparkle Star (✦) */}
            <svg className="absolute top-16 xs:top-24 sm:top-28 right-2 sm:right-6 w-5 h-5 sm:w-6 sm:h-6 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
              <path d="M 12 3 C 12 7.5, 14 9.5, 19 12 C 14 14.5, 12 16.5, 12 21 C 12 16.5, 10 14.5, 5 12 C 10 9.5, 12 7.5, 12 3 Z" />
            </svg>

            {/* Left 4-Point Sparkle Star (✦) */}
            <svg className="absolute top-1/2 -left-2 sm:-left-4 -translate-y-6 sm:-translate-y-8 w-5 h-5 sm:w-6 sm:h-6 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
              <path d="M 12 3 C 12 7.5, 14 9.5, 19 12 C 14 14.5, 12 16.5, 12 21 C 12 16.5, 10 14.5, 5 12 C 10 9.5, 12 7.5, 12 3 Z" />
            </svg>

            {/* Left Stick Arm (Hanging Down with 4 Fingers) */}
            <div className="absolute bottom-14 xs:bottom-18 sm:bottom-32 -left-4 sm:-left-8 z-10 pointer-events-none">
              <svg className="w-9 h-13 xs:w-11 xs:h-15 sm:w-14 sm:h-18 text-white" viewBox="0 0 52 68" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                {/* Arm curving down from phone edge */}
                <path d="M 48 8 C 30 16, 16 32, 20 52" />
                {/* 4 Fingers pointing down */}
                <path d="M 19 52 L 11 61" />
                <path d="M 20 52 L 17 65" />
                <path d="M 21 52 L 23 65" />
                <path d="M 22 52 L 29 60" />
              </svg>
            </div>

            {/* Bottom-Right Radiating Action Dashes (- \ /) */}
            <svg className="absolute -bottom-1 right-2 sm:right-4 w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 text-white/90 pointer-events-none" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M 12 8 L 26 8" />
              <path d="M 10 16 L 24 22" />
              <path d="M 6 22 L 16 31" />
            </svg>

            {/* Phone Chassis Container (Slight -rotate-1 hand-drawn stance) */}
            <div className="w-full max-w-[290px] xs:max-w-[315px] sm:max-w-[360px] relative transition-transform duration-300 hover:rotate-0 -rotate-1">
              
              {/* 3D Perspective Left Rail & Physical Side Buttons */}
              <div className="absolute -left-[14px] top-4 xs:top-6 bottom-4 xs:bottom-6 w-[16px] pointer-events-none z-0">
                <svg className="w-full h-full text-white/85" preserveAspectRatio="none" viewBox="0 0 16 620" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  {/* Left rail outer contour */}
                  <path d="M 16 6 L 4 18 L 4 596 L 16 616" />
                  
                  {/* 3 Physical buttons on left rail */}
                  {/* Top mute switch */}
                  <rect x="0.5" y="70" width="4.5" height="16" rx="2" fill="#430000" stroke="currentColor" strokeWidth="2" />
                  {/* Middle volume up button */}
                  <rect x="0.5" y="115" width="4.5" height="30" rx="2" fill="#430000" stroke="currentColor" strokeWidth="2" />
                  {/* Lower volume down button */}
                  <rect x="0.5" y="165" width="4.5" height="30" rx="2" fill="#430000" stroke="currentColor" strokeWidth="2" />
                  
                  {/* Cross-Hatch Shading at lower-left curve */}
                  <line x1="4" y1="555" x2="16" y2="565" strokeWidth="1.6" />
                  <line x1="4" y1="565" x2="16" y2="575" strokeWidth="1.6" />
                  <line x1="4" y1="575" x2="16" y2="585" strokeWidth="1.6" />
                  <line x1="4" y1="585" x2="16" y2="595" strokeWidth="1.6" />
                  <line x1="4" y1="595" x2="16" y2="605" strokeWidth="1.6" />
                  
                  <line x1="4" y1="570" x2="16" y2="560" strokeWidth="1.6" />
                  <line x1="4" y1="580" x2="16" y2="570" strokeWidth="1.6" />
                  <line x1="4" y1="590" x2="16" y2="580" strokeWidth="1.6" />
                  <line x1="4" y1="600" x2="16" y2="590" strokeWidth="1.6" />
                  <line x1="4" y1="610" x2="16" y2="600" strokeWidth="1.6" />
                </svg>
              </div>

              {/* 3D Perspective Bottom Shelf with Speaker Slits & Cross Hatching */}
              <div className="absolute -bottom-[12px] left-3 right-3 h-[14px] pointer-events-none z-0">
                <svg className="w-full h-full text-white/80" preserveAspectRatio="none" viewBox="0 0 320 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  {/* Bottom depth line */}
                  <path d="M 0 0 L 12 12 L 308 12 L 320 0" />
                  {/* USB-C / Charger slot */}
                  <line x1="145" y1="6" x2="175" y2="6" strokeWidth="2.4" />
                  {/* Speaker slits */}
                  <line x1="195" y1="6" x2="201" y2="6" strokeWidth="2" />
                  <line x1="207" y1="6" x2="213" y2="6" strokeWidth="2" />
                  <line x1="219" y1="6" x2="225" y2="6" strokeWidth="2" />
                  <line x1="231" y1="6" x2="237" y2="6" strokeWidth="2" />
                </svg>
              </div>

              {/* Main Phone Front Face Box */}
              <div className="sketch-phone text-white relative z-10">

                {/* Sketched Top Bezel with Hand-Drawn Notch */}
                <div className="relative px-3 sm:px-5 pt-1 xs:pt-1.5 pb-1 sm:pb-2 flex items-center justify-between text-[9px] xs:text-[10px] font-tech text-white/80 select-none">
                  <span className="font-bold text-[10px] xs:text-[11px] font-brand tracking-wider">9:41</span>
                  
                  {/* Hand-Drawn Curved Notch Housing Speaker Pill & Camera (matches sketch) */}
                  <div className="relative w-20 xs:w-22 sm:w-24 h-3.5 xs:h-4 bg-[#2b0000] border border-white/70 rounded-b-xl flex items-center justify-center gap-1.5 sm:gap-2 shadow-inner px-1.5 -mt-1 sm:-mt-1.5 pt-0.5">
                    {/* Speaker pill */}
                    <div className="w-5 sm:w-6 h-0.5 sm:h-1 rounded-full bg-white/40" />
                    {/* Camera dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  </div>

                  <div className="flex items-center gap-1 text-[8px] xs:text-[9px] font-bold">
                    <span>5G</span>
                    <span className="text-[9px] xs:text-[10px]">100%</span>
                  </div>
                </div>

                {/* Hand-Drawn Screen Inner */}
                <div className="sketch-phone-screen flex flex-col text-white relative">
              
              {/* Top Table Room Header */}
              <div className="bg-[#430000] px-2.5 xs:px-3.5 py-1.5 xs:py-2 sm:py-2.5 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 xs:space-x-2.5 rtl:space-x-reverse">
                <img
                  src={croppedLogo}
                  alt="Forkcast Table"
                  className="h-7 xs:h-8 sm:h-11 w-auto object-contain shrink-0 select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                />
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
                    <span className="font-brand font-bold text-xs xs:text-sm sm:text-lg text-white tracking-wide uppercase">
                      {t.brandName}
                    </span>
                    <span className="text-[8px] xs:text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.2 sm:px-2 sm:py-0.5 sketch-border-subtle">
                      {t.demoSection.tableBadge}
                    </span>
                  </div>
                  <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-white/80 font-tech leading-none mt-0.5">
                    {t.demoSection.tableCap}
                  </p>
                </div>
              </div>

              {/* Budget Meter */}
              <div className="text-right rtl:text-left">
                <div className="text-[8px] xs:text-[9px] uppercase font-semibold text-white/80 font-tech">
                  {t.demoSection.budgetLabel}
                </div>
                <div className="text-[10px] xs:text-xs font-bold text-white bg-white/15 px-1.5 xs:px-2 py-0.2 xs:py-0.5 rounded-md border border-white/25 font-tech">
                  ₹1,080 <span className="text-white/70 font-normal">/ ₹1,500</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/20 bg-[#430000] text-[10px] xs:text-xs font-medium font-tech px-1 xs:px-2">
              <button
                onClick={() => setDemoTab('chat')}
                className={`flex-1 py-1.5 sm:py-2 text-center font-bold flex items-center justify-center gap-1 transition-colors border-b-2 ${demoTab === 'chat' ? 'text-white border-white' : 'text-white/75 border-transparent hover:text-white'}`}
              >
                {t.demoSection.tabFeed}
              </button>
              <button
                onClick={() => setDemoTab('cart')}
                className={`flex-1 py-1.5 sm:py-2 text-center font-bold flex items-center justify-center gap-1 transition-colors border-b-2 ${demoTab === 'cart' ? 'text-white border-white' : 'text-white/75 border-transparent hover:text-white'}`}
              >
                {t.demoSection.tabCart} <span className="bg-white text-[#5b0000] font-bold text-[8px] xs:text-[10px] px-1 xs:px-1.5 rounded-full">{cartCount}</span>
              </button>
              <button
                onClick={() => setDemoTab('split')}
                className={`flex-1 py-1.5 sm:py-2 text-center font-bold flex items-center justify-center gap-1 transition-colors border-b-2 ${demoTab === 'split' ? 'text-white border-white' : 'text-white/75 border-transparent hover:text-white'}`}
              >
                {t.demoSection.tabSplit}
              </button>
            </div>

            {/* TAB CONTENT: CHAT */}
            {demoTab === 'chat' && (
              <div className="p-2 xs:p-2.5 sm:p-3 space-y-1.5 xs:space-y-2 sm:space-y-3 min-h-[300px] xs:min-h-[340px] sm:min-h-[380px] md:min-h-[440px] max-h-[360px] xs:max-h-[400px] sm:max-h-[440px] md:max-h-[480px] overflow-y-auto bg-[#5b0000]">
                {/* Aryan: Setting Budget */}
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-md bg-white/20 border border-white/30 flex items-center justify-center text-[9px] xs:text-[10px] font-bold text-white shrink-0">A</div>
                  <div className="bg-white/10 rounded-xl rounded-tl-none p-1.5 xs:p-2 border border-white/20 max-w-[88%]">
                    <div className="text-[9px] xs:text-[10px] font-bold text-white mb-0.5">Aryan (Captain)</div>
                    <p className="text-[10px] xs:text-xs text-white leading-tight">{t.demoSection.chatMsg1}</p>
                  </div>
                </div>

                {/* Ambient AI Banner */}
                <div className="flex justify-center my-0.5 sm:my-1">
                  <span className="bg-white/15 text-white border border-white/30 rounded-full px-2 xs:px-3 py-0.2 xs:py-0.5 text-[8px] xs:text-[10px] font-medium text-center flex items-center justify-center gap-1">
                    <span>( • ◡ • ) {t.demoSection.aiBanner}</span>
                  </span>
                </div>

                {/* Aryan: Asking about Food & Dish */}
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-md bg-white/20 border border-white/30 flex items-center justify-center text-[9px] xs:text-[10px] font-bold text-white shrink-0">A</div>
                  <div className="bg-white/10 rounded-xl rounded-tl-none p-1.5 xs:p-2 border border-white/20 max-w-[88%]">
                    <div className="text-[9px] xs:text-[10px] font-bold text-white mb-0.5">Aryan (Captain)</div>
                    <p className="text-[10px] xs:text-xs text-white leading-tight">{t.demoSection.chatMsg2}</p>
                  </div>
                </div>

                {/* Ambient AI Dish Card */}
                <div className="bg-white/10 sketch-card-subtle p-1.5 xs:p-2 sm:p-2.5 shadow-md ml-3 sm:ml-5 rtl:ml-0 rtl:mr-3 sm:rtl:mr-5">
                  <div className="flex items-center justify-between mb-1 pb-0.5 sm:pb-1 border-b border-white/15">
                    <span className="text-[10px] xs:text-xs font-brand font-bold text-white tracking-wide">{t.demoSection.flavorMatch}</span>
                    <span className="text-[9px] xs:text-[10px] text-white">🌶️ High Spice</span>
                  </div>

                  <div className="flex gap-1.5 xs:gap-2 items-center bg-white/10 p-1.5 xs:p-2 sketch-card-subtle">
                    <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white/15 sketch-border-subtle flex items-center justify-center text-sm xs:text-base sm:text-lg shrink-0">
                      🍗
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-brand font-bold text-[10px] xs:text-xs sm:text-sm text-white truncate">Smoky Chicken Tikka</h4>
                        <span className="font-tech font-bold text-[10px] xs:text-xs sm:text-xs text-white">₹420</span>
                      </div>
                      <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-white/85 leading-tight mt-0.5 line-clamp-1 xs:line-clamp-none">Tandoor roasted, charred lime & mint crema.</p>
                      <div className="flex items-center justify-between mt-1 xs:mt-1.5">
                        <span className="text-[8px] xs:text-[9px] bg-white/15 px-1.5 py-0.2 sketch-pill text-white">Non-Veg</span>
                        <button
                          onClick={() => {
                            setCartCount((c) => c + 1);
                            setDemoTab('cart');
                          }}
                          className="sketch-btn-white text-[9px] xs:text-[10px] font-bold font-tech px-2 xs:px-2.5 py-0.5 shadow-md active:scale-95 transition-all"
                        >
                          {t.demoSection.addBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: CART */}
            {demoTab === 'cart' && (
              <div className="p-2 xs:p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 min-h-[300px] xs:min-h-[340px] sm:min-h-[380px] md:min-h-[440px] max-h-[360px] xs:max-h-[400px] sm:max-h-[440px] md:max-h-[480px] overflow-y-auto bg-[#5b0000]">
                <div className="flex items-center justify-between mb-0.5 pb-0.5 border-b border-white/15">
                  <h3 className="font-brand font-bold text-xs xs:text-sm text-white">{t.demoSection.cartTitle}</h3>
                  <span className="text-[9px] xs:text-[10px] text-white/80 font-tech">4 Items Active</span>
                </div>

                <div className="space-y-1 xs:space-y-1.5">
                  <div className="bg-white/10 p-1.5 xs:p-2 rounded-xl border border-white/20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] xs:text-[10px] bg-white text-[#5b0000] px-1.5 py-0.2 rounded font-bold font-tech">Aryan</span>
                      <p className="text-[10px] xs:text-xs font-semibold text-white">Smoky Chicken Tikka</p>
                    </div>
                    <span className="text-[10px] xs:text-xs font-bold text-white font-tech">₹420</span>
                  </div>

                  <div className="bg-white/10 p-1.5 xs:p-2 rounded-xl border border-white/20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] xs:text-[10px] bg-white text-[#5b0000] px-1.5 py-0.2 rounded font-bold font-tech">Aryan</span>
                      <p className="text-[10px] xs:text-xs font-semibold text-white">Paneer Peri Peri (Veg)</p>
                    </div>
                    <span className="text-[10px] xs:text-xs font-bold text-white font-tech">₹350</span>
                  </div>

                  <div className="bg-white/10 p-1.5 xs:p-2 rounded-xl border border-white/20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] xs:text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded font-bold font-tech">Shared</span>
                      <p className="text-[10px] xs:text-xs font-semibold text-white">Fudge Brownie Sundae</p>
                    </div>
                    <span className="text-[10px] xs:text-xs font-bold text-white font-tech">₹280</span>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="bg-white/15 p-1.5 xs:p-2 rounded-xl border border-white/25 mt-1 shadow-md font-tech">
                  <div className="flex justify-between text-[10px] xs:text-xs text-white">
                    <span>{t.demoSection.cartSubtotal}</span>
                    <span className="font-bold text-white">₹1,050</span>
                  </div>
                  <div className="flex justify-between text-[10px] xs:text-xs font-bold text-white border-t border-white/20 pt-0.5 mt-0.5">
                    <span className="font-brand text-xs xs:text-sm">{t.demoSection.tableTotal}</span>
                    <span className="text-xs xs:text-sm">₹1,050</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: BILL SPLIT */}
            {demoTab === 'split' && (
              <div className="p-2 xs:p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 min-h-[300px] xs:min-h-[340px] sm:min-h-[380px] md:min-h-[440px] max-h-[360px] xs:max-h-[400px] sm:max-h-[440px] md:max-h-[480px] overflow-y-auto bg-[#5b0000]">
                <div className="flex items-center justify-between mb-0.5 pb-0.5 border-b border-white/15">
                  <div>
                    <h3 className="font-brand font-bold text-xs xs:text-sm text-white">{t.demoSection.splitTitle}</h3>
                    <p className="text-[8px] xs:text-[10px] text-white/80 font-tech">{t.demoSection.splitSubtitle}</p>
                  </div>
                  <span className="text-[8px] xs:text-[9px] bg-white/20 border border-white/30 text-white px-1.5 py-0.2 rounded font-tech font-bold">4 Guests</span>
                </div>

                <div className="grid grid-cols-2 gap-1 font-tech">
                  <div className="bg-white/10 p-1.5 rounded-xl border border-white/20">
                    <div className="flex justify-between items-center text-[10px] xs:text-xs font-bold text-white">
                      <span>Aryan (Cap)</span>
                      <span>₹290</span>
                    </div>
                    <p className="text-[8px] xs:text-[9px] text-white/80 mt-0.5">Salad (₹220) + Shared (₹70)</p>
                  </div>

                  <div className="bg-white/10 p-1.5 rounded-xl border border-white/20">
                    <div className="flex justify-between items-center text-[10px] xs:text-xs font-bold text-white">
                      <span>Priya</span>
                      <span>₹420</span>
                    </div>
                    <p className="text-[8px] xs:text-[9px] text-white/80 mt-0.5">Paneer (₹350) + Shared (₹70)</p>
                  </div>

                  <div className="bg-white/10 p-1.5 rounded-xl border border-white/20">
                    <div className="flex justify-between items-center text-[10px] xs:text-xs font-bold text-white">
                      <span>Rohan</span>
                      <span>₹490</span>
                    </div>
                    <p className="text-[8px] xs:text-[9px] text-white/80 mt-0.5">Tikka (₹420) + Shared (₹70)</p>
                  </div>

                  <div className="bg-white/10 p-1.5 rounded-xl border border-white/20">
                    <div className="flex justify-between items-center text-[10px] xs:text-xs font-bold text-white">
                      <span>Sneha</span>
                      <span>₹450</span>
                    </div>
                    <p className="text-[8px] xs:text-[9px] text-white/80 mt-0.5">Pizza (₹380) + Shared (₹70)</p>
                  </div>
                </div>

                <div className="pt-1">
                  <button className="w-full sketch-btn-white py-1.5 xs:py-2 sm:py-2.5 font-bold font-tech text-[10px] xs:text-xs shadow-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]">
                    <span>{t.demoSection.sendToKitchen}</span>
                  </button>
                  <p className="text-[8px] xs:text-[9px] text-center text-white/80 mt-0.5 font-tech">
                    {t.demoSection.captainAuthority}
                  </p>
                </div>
              </div>
            )}

            </div>

            {/* Sketched Bottom Home Indicator Bar */}
            <div className="pt-1 xs:pt-1.5 sm:pt-2 pb-0.5 flex justify-center">
              <div className="w-20 xs:w-24 sm:w-28 h-0.5 xs:h-1 bg-white/50 rounded-full shadow-sm" />
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>

      {/* 4. VALUE PROPOSITION: DINERS VS CAFES (Hybrid: Fluid Natural Scroll on Mobile, Full Viewport Snap on Desktop) */}
      <section id="features" className="snap-panel px-4 sm:px-8 py-16 sm:py-20 lg:py-8 min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] h-auto overflow-visible lg:overflow-hidden w-full flex flex-col justify-center">
        <div className="max-w-5xl mx-auto w-full my-auto flex flex-col justify-center">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="font-brand text-3xl sm:text-5xl font-bold text-white mb-2">
              {t.features.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-tech">
            {/* For Diners Card */}
            <div className="bg-white/10 sketch-card p-5 sm:p-7 backdrop-blur-sm">
              <h3 className="font-brand text-2xl font-bold text-white mb-3">
                {t.features.dinersTitle}
              </h3>

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white mb-0.5">✓ {t.features.diner1Title}</h4>
                  <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.features.diner1Desc}</p>
                </div>
                <div className="border-t border-white/15 pt-2.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white mb-0.5">✓ {t.features.diner2Title}</h4>
                  <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.features.diner2Desc}</p>
                </div>
                <div className="border-t border-white/15 pt-2.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white mb-0.5">✓ {t.features.diner3Title}</h4>
                  <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.features.diner3Desc}</p>
                </div>
              </div>
            </div>

            {/* For Cafés Card */}
            <div className="bg-white/10 sketch-card p-5 sm:p-7 backdrop-blur-sm">
              <h3 className="font-brand text-2xl font-bold text-white mb-3">
                {t.features.cafesTitle}
              </h3>

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white mb-0.5">✓ {t.features.cafe1Title}</h4>
                  <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.features.cafe1Desc}</p>
                </div>
                <div className="border-t border-white/15 pt-2.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white mb-0.5">✓ {t.features.cafe2Title}</h4>
                  <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.features.cafe2Desc}</p>
                </div>
                <div className="border-t border-white/15 pt-2.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white mb-0.5">✓ {t.features.cafe3Title}</h4>
                  <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.features.cafe3Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3-STEP GUIDE (Hybrid: Fluid Natural Scroll on Mobile, Full Viewport Snap on Desktop) */}
      <section id="how" className="snap-panel px-4 sm:px-8 py-10 sm:py-14 lg:py-4 bg-[#430000]/60 border-y border-white/15 w-full min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] h-auto overflow-visible lg:overflow-hidden flex flex-col justify-center">
        <div className="max-w-5xl mx-auto w-full my-auto flex flex-col justify-center">
          <div className="text-center mb-2.5 sm:mb-4 lg:mb-2.5">
            <h2 className="font-brand text-2xl xs:text-3xl sm:text-4xl lg:text-3xl xl:text-4xl font-bold text-white mb-1">
              {t.howItWorks.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 font-tech">
            <div className="bg-white/10 sketch-card p-3 sm:p-3.5 lg:p-3">
              <span className="font-brand text-xl sm:text-2xl font-bold text-white/40 block mb-0.5">{t.howItWorks.step1Num}</span>
              <h3 className="font-bold text-xs sm:text-sm text-white mb-0.5">{t.howItWorks.step1Title}</h3>
              <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.howItWorks.step1Desc}</p>
            </div>

            <div className="bg-white/10 sketch-card p-3 sm:p-3.5 lg:p-3">
              <span className="font-brand text-xl sm:text-2xl font-bold text-white/40 block mb-0.5">{t.howItWorks.step2Num}</span>
              <h3 className="font-bold text-xs sm:text-sm text-white mb-0.5">{t.howItWorks.step2Title}</h3>
              <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.howItWorks.step2Desc}</p>
            </div>

            <div className="bg-white/10 sketch-card p-3 sm:p-3.5 lg:p-3">
              <span className="font-brand text-xl sm:text-2xl font-bold text-white/40 block mb-0.5">{t.howItWorks.step3Num}</span>
              <h3 className="font-bold text-xs sm:text-sm text-white mb-0.5">{t.howItWorks.step3Title}</h3>
              <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{t.howItWorks.step3Desc}</p>
            </div>
          </div>

          {/* Hand-Drawn Cafe Dining Scene (Processed into Pure White Linework - Wider & Static) */}
          <div className="mt-3 sm:mt-5 lg:mt-3.5 flex flex-col items-center justify-center relative select-none w-full shrink min-h-0 pointer-events-none">
            <div className="relative z-10 w-full flex items-center justify-center">
              <img
                src={whiteCafeSketch}
                alt="Bustling outdoor café dining scene"
                className="w-full max-w-[460px] xs:max-w-[540px] sm:max-w-[680px] md:max-w-[780px] lg:max-w-[880px] xl:max-w-[960px] h-auto max-h-[300px] xs:max-h-[340px] sm:max-h-[380px] lg:max-h-[380px] xl:max-h-[440px] 2xl:max-h-[490px] object-contain select-none pointer-events-none"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. WAITLIST & FOOTER (Hybrid: Fluid Natural Scroll on Mobile, Full Viewport Snap on Desktop) */}
      <section id="waitlist" className="snap-panel px-4 sm:px-8 pt-16 sm:pt-20 lg:pt-16 pb-4 w-full min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] h-auto overflow-visible lg:overflow-hidden flex flex-col justify-between">
        <div className="max-w-xl mx-auto w-full my-auto text-center font-tech">
          <h2 className="font-brand text-3xl sm:text-5xl font-bold text-white mb-1.5">
            {t.waitlist.title}
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mb-6">
            {t.waitlist.subtitle}
          </p>

          {waitlistSubmitted ? (
            <div className="bg-white/15 sketch-card p-6 sm:p-8 backdrop-blur-sm shadow-xl">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="font-brand text-2xl font-bold text-white mb-1.5">{t.waitlist.successTitle}</h3>
              <p className="text-xs text-white/85 leading-relaxed">{t.waitlist.successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="bg-white/10 sketch-card p-5 sm:p-7 backdrop-blur-sm space-y-3.5 shadow-xl text-left rtl:text-right">
              <div>
                <label className="text-xs font-semibold text-white/90 block mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder={t.waitlist.namePlaceholder}
                  value={waitlistData.name}
                  onChange={(e) => setWaitlistData({ ...waitlistData, name: e.target.value })}
                  className="w-full bg-white/15 sketch-input px-3.5 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/90 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder={t.waitlist.emailPlaceholder}
                  value={waitlistData.email}
                  onChange={(e) => setWaitlistData({ ...waitlistData, email: e.target.value })}
                  className="w-full bg-white/15 sketch-input px-3.5 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-white/90 block mb-1">Café Name</label>
                  <input
                    type="text"
                    placeholder={t.waitlist.cafePlaceholder}
                    value={waitlistData.cafe}
                    onChange={(e) => setWaitlistData({ ...waitlistData, cafe: e.target.value })}
                    className="w-full bg-white/15 sketch-input px-3.5 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/90 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder={t.waitlist.cityPlaceholder}
                    value={waitlistData.city}
                    onChange={(e) => setWaitlistData({ ...waitlistData, city: e.target.value })}
                    className="w-full bg-white/15 sketch-input px-3.5 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <button
                  type="submit"
                  className="flex-1 sketch-btn-white font-bold text-xs sm:text-sm py-3 shadow-xl transition-all active:scale-[0.98]"
                >
                  {t.waitlist.submitBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMenuUploadOpen(true)}
                  className="sketch-btn-outline bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm py-3 px-5 text-center transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t.waitlist.demoBtn} (Upload Menu)</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick link to live demo below the form */}
          <div className="mt-3.5 text-center">
            <button
              type="button"
              onClick={() => setIsMenuUploadOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white underline underline-offset-4 transition-colors font-tech group cursor-pointer bg-transparent border-none"
            >
              <span>Want to upload your menu & test the AI table?</span>
              <span className="font-bold">{t.waitlist.demoBtn}</span>
            </button>
          </div>
        </div>

        {/* 7. FOOTER (Same Hand-Drawn Sketched Rectangle Style as Header) */}
        <footer className="w-full px-2 sm:px-4 md:px-6 mt-auto pb-2 sm:pb-3 pt-2">
          <div className="w-full bg-[#430000]/95 backdrop-blur-md sketch-nav px-3.5 sm:px-6 md:px-8 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-tech text-white/80 shadow-xl">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
              <img
                src={croppedLogo}
                alt="Forkcast Logo"
                className="h-6 sm:h-7 w-auto object-contain shrink-0 select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              />
              <span className="font-brand font-bold text-base sm:text-lg text-white">{t.brandName}</span>
              <span className="text-white/40">•</span>
              <span className="text-[11px] sm:text-xs text-white/75">{t.footer.rights}</span>
            </div>

            <div className="flex items-center space-x-4 rtl:space-x-reverse text-[11px] sm:text-xs">
              <a href="#" className="hover:text-white transition-colors">{t.footer.privacy}</a>
              <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
              <a href="#" className="hover:text-white transition-colors">{t.footer.contact}</a>
            </div>
          </div>
        </footer>
      </section>

      {/* 8. INSTANT MENU UPLOAD & INGESTION DEMO MODAL */}
      <MenuUploadDemo
        isOpen={isMenuUploadOpen}
        onClose={() => setIsMenuUploadOpen(false)}
        onLaunchChat={(menuData) => {
          setIsMenuUploadOpen(false);
          document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

    </div>
  );
}
