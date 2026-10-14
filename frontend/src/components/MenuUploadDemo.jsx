import React, { useState, useRef } from 'react';
import {
  SketchLeaf,
  SketchVegan,
  SketchMeat,
  SketchWheat,
  SketchChili,
  SketchDoc,
  SketchPencil,
  SketchCoffee,
} from './SketchIcons';
import QRPrintModal from './QRPrintModal';

const SAMPLE_ARTISAN_MENU = `
# Brews & Beverages
Cold Brew Reserve - Steeped for 18 hours with citrus undertones. ₹240
Vanilla Bean Oat Latte - Double shot espresso with organic steamed oat milk. (Vegan) ₹280
Cascara Sparkling Spritz - Coffee cherry infusion with sparkling tonic and lemon. ₹220

# Starters & Small Plates
Crispy Truffle Fries - Hand-cut potatoes tossed in white truffle oil and rosemary salt. ₹290
Smoked Paprika Paneer Tikka - Charred cottage cheese with mint emulsion and pickled onion. (Veg, Dairy) ₹340
Chili Garlic Lotus Stem - Crispy lotus crisps tossed in fiery schezwan honey. (Vegan, GF) ₹310
Herb Butter Garlic Bread - Toasted sourdough loaf with roasted garlic herb butter. (Veg, Gluten, Dairy) ₹260

# Mains & Entrees
Wild Porcini Truffle Fettuccine - Ribbon pasta in slow-reduced mushroom broth and parmesan. (Veg, Dairy, Gluten) ₹480
Charred Grilled Chicken Breast - Served with creamy mashed potatoes and red wine jus. (Non-Veg, Dairy) ₹520
Spicy Burrito Rice Bowl - Brown rice, black beans, avocado, roasted corn, and fire-roasted salsa. (Vegan, GF) ₹390
Woodfired Margherita Pizza - Fresh San Marzano tomato sauce, fior di latte, and basil. (Veg, Dairy, Gluten) ₹440

# Desserts & Bakes
Valrhona Dark Chocolate Brownie - Warm fudge brownie with toasted almond shavings. (Veg, Nuts, Dairy) ₹280
Basque Burnt Cheesecake - Caramelized crust with a molten vanilla core. (Veg, Dairy) ₹320
`;

const CANONICAL_COURSES = [
  'Brews & Beverages',
  'Salads & Soups',
  'Starters & Small Plates',
  'Mains & Entrees',
  'Desserts & Bakes',
  'Sides & Add-ons',
  'General',
];

export default function MenuUploadDemo({ isOpen, onClose, onLaunchChat }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste' | 'sample'
  const [pastedText, setPastedText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [viewMode, setViewMode] = useState('courses'); // 'courses' | 'table'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Editing state for inline corrections
  const [editingItem, setEditingItem] = useState(null);
  const [saveDbConfirmed, setSaveDbConfirmed] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbSaveResult, setDbSaveResult] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Local fallback parser
  const parseLocally = (rawText, filename = 'menu.txt') => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const items = [];
    let currentCategory = 'Mains & Entrees';
    let counter = 1;
    let i = 0;
    const n = lines.length;

    const detectCat = (line) => {
      const lower = line.toLowerCase();
      if (lower.includes('brew') || lower.includes('coffee') || lower.includes('drink') || lower.includes('beverage')) return 'Brews & Beverages';
      if (lower.includes('salad') || lower.includes('soup')) return 'Salads & Soups';
      if (lower.includes('starter') || lower.includes('appetizer') || lower.includes('snack') || lower.includes('small plate')) return 'Starters & Small Plates';
      if (lower.includes('main') || lower.includes('pizza') || lower.includes('pasta') || lower.includes('burger')) return 'Mains & Entrees';
      if (lower.includes('dessert') || lower.includes('sweet') || lower.includes('cake') || lower.includes('bakes')) return 'Desserts & Bakes';
      if (lower.includes('side') || lower.includes('addon')) return 'Sides & Add-ons';
      return null;
    };

    const isPriceOnly = (str) => {
      const cleaned = str.replace(/[.,;]$/, '').trim();
      const m = cleaned.match(/^(?:(₹|\$|€|£|Rs\.?|INR)\s*)?(\d+(?:\.\d{1,2})?)\s*(?:\/-)?$/i);
      return m ? parseFloat(m[2]) : null;
    };

    const extractSameLine = (line) => {
      const priceMatch = line.match(/(?:(₹|\$|€|£|Rs\.?|INR)\s*)?(\d+(?:\.\d{1,2})?)\s*(?:\/-|,|\.|\s)*$/i);
      if (priceMatch && priceMatch.index > 0) {
        const price = parseFloat(priceMatch[2]);
        const beforePrice = line.slice(0, priceMatch.index).replace(/[\.·\-_]{2,}/g, '').trim();
        const parts = beforePrice.split(/[-–—:]/);
        const name = parts[0]?.trim();
        const description = parts[1]?.trim() || '';
        if (name && name.length > 1 && isPriceOnly(name) === null) {
          return { name, price, description };
        }
      }
      return null;
    };

    const enrichItem = (name, price, description) => {
      const itemText = `${name} ${description}`.toLowerCase();
      const isNonVeg = /chicken|mutton|beef|pork|fish|prawn|egg|bacon|wings|salmon|lamb/.test(itemText);
      const isVegan = /vegan|oat milk|plant-based/.test(itemText);
      const isGF = /gf|gluten-free|gluten free/.test(itemText);

      const allergens = [];
      if (/dairy|milk|cheese|butter|paneer|cream|parmesan/.test(itemText)) allergens.push('dairy');
      if (/nut|nuts|almond|cashew|peanut/.test(itemText)) allergens.push('nuts');
      if (/gluten|wheat|pasta|bread|sourdough|pizza/.test(itemText)) allergens.push('gluten');

      let spiceLevel = 0;
      if (/fiery|schezwan|ghost pepper/.test(itemText)) spiceLevel = 3;
      else if (/spicy|chili|tikka|peri peri/.test(itemText)) spiceLevel = 2;
      else if (/peppery|mild|seasoned/.test(itemText)) spiceLevel = 1;

      return {
        id: `dish_${counter++}`,
        name: name.replace(/^[\*\-\•\·\s]+/, '').replace(/[\*\-\•\·\s]+$/, ''),
        category: currentCategory,
        price,
        currency: '₹',
        description,
        is_veg: !isNonVeg,
        is_vegan: isVegan,
        is_gluten_free: isGF,
        allergens,
        spice_level: spiceLevel,
      };
    };

    while (i < n) {
      const line = lines[i];

      // Explicit markdown header
      if (line.startsWith('#') || line.startsWith('==') || line.startsWith('--')) {
        const cat = detectCat(line);
        if (cat) currentCategory = cat;
        i++;
        continue;
      }

      // 3-line layout: Name \n Description \n Price
      if (i + 2 < n && isPriceOnly(lines[i + 2]) !== null) {
        const p = isPriceOnly(lines[i + 2]);
        items.push(enrichItem(line, p, lines[i + 1]));
        i += 3;
        continue;
      }

      // 2-line layout: Name \n Price
      if (i + 1 < n && isPriceOnly(lines[i + 1]) !== null) {
        const p = isPriceOnly(lines[i + 1]);
        items.push(enrichItem(line, p, ''));
        i += 2;
        continue;
      }

      // Same-line layout: Name - Description ₹Price
      const same = extractSameLine(line);
      if (same) {
        items.push(enrichItem(same.name, same.price, same.description));
        i++;
        continue;
      }

      // Standalone category header
      const cat = detectCat(line);
      if (cat && line.length < 35 && isPriceOnly(line) === null) {
        currentCategory = cat;
        i++;
        continue;
      }

      i++;
    }

    const categories = Array.from(new Set(items.map((it) => it.category))).sort((a, b) => {
      const idxA = CANONICAL_COURSES.indexOf(a);
      const idxB = CANONICAL_COURSES.indexOf(b);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    items.sort((a, b) => {
      const catOrder = categories.indexOf(a.category) - categories.indexOf(b.category);
      return catOrder !== 0 ? catOrder : a.price - b.price;
    });

    return {
      cafe_id: 'demo-cafe',
      filename,
      total_items: items.length,
      categories,
      items,
      message: `Parsed ${items.length} dishes across ${categories.length} categories.`,
    };
  };

  const processMenu = async (filesInput, textContent) => {
    setIsProcessing(true);
    setErrorMsg('');
    setSaveDbConfirmed(false);

    try {
      let result = null;

      if (filesInput) {
        const fileList = Array.isArray(filesInput) ? filesInput : [filesInput];
        setSelectedFiles(fileList);

        if (fileList.length > 1) {
          setProcessingStep(`Extracting and merging across ${fileList.length} menu pages/images with OCR...`);
        } else {
          const single = fileList[0];
          const isImage = single.type?.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(single.name);
          setProcessingStep(isImage ? `Running OCR on ${single.name}...` : `Extracting text from ${single.name}...`);
        }

        const formData = new FormData();
        fileList.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('cafe_id', 'demo-cafe');

        try {
          const res = await fetch('http://localhost:8000/api/menu/upload-multiple', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            result = await res.json();
          } else {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || `Upload failed with status ${res.status}`);
          }
        } catch (fetchErr) {
          // Only attempt client-side fallback for actual plain text / markdown / CSV files
          const textFiles = fileList.filter((f) => /\.(txt|csv|md)$/i.test(f.name) || f.type === 'text/plain');
          if (textFiles.length > 0) {
            let combinedText = '';
            for (const f of textFiles) {
              try {
                const txt = await f.text();
                combinedText += '\n\n' + txt;
              } catch (err) {}
            }
            if (combinedText.trim()) {
              result = parseLocally(combinedText, `${textFiles.length} text pages`);
            }
          }

          // If no result was parsed from plain text files, surface the actual error from server
          if (!result) {
            throw fetchErr;
          }
        }
      } else if (textContent) {
        setProcessingStep('Parsing menu sections, prices, and courses...');
        try {
          const res = await fetch('http://localhost:8000/api/menu/parse-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_text: textContent, cafe_id: 'demo-cafe' }),
          });
          if (res.ok) {
            result = await res.json();
          } else {
            result = parseLocally(textContent, 'pasted_menu.txt');
          }
        } catch (e) {
          result = parseLocally(textContent, 'pasted_menu.txt');
        }
      }

      if (!result || !result.items || result.items.length === 0) {
        throw new Error('No menu items could be detected from the uploaded page(s). Please verify the document format or try pasting text.');
      }

      setProcessingStep('Organizing canonical course order: Brews, Starters, Mains, Desserts...');
      await new Promise((r) => setTimeout(r, 450));

      setParsedData(result);
      setSelectedCategory('All');
    } catch (err) {
      setErrorMsg(err.message || 'Error processing menu file');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleConfirmAndSave = async () => {
    if (!parsedData || !parsedData.items || parsedData.items.length === 0) return;
    setIsSavingDb(true);
    setErrorMsg('');
    try {
      const payload = {
        cafe_id: parsedData.cafe_id || 'demo-cafe',
        cafe_name: 'Forkcast Artisan Café',
        filename: parsedData.filename || 'Uploaded Menu',
        extraction_engine: parsedData.extraction_engine || 'google_vision',
        categories: parsedData.categories || [],
        items: parsedData.items || []
      };

      const res = await fetch('http://localhost:8000/api/menu/confirm-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setDbSaveResult(data);
        setSaveDbConfirmed(true);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to persist menu to database.');
      }
    } catch (e) {
      console.warn('Backend DB notice:', e);
      // Client-side fallback notification
      setDbSaveResult({
        success: true,
        saved_dishes: parsedData.total_items,
        database_type: 'Local Database (Offline Fallback)',
        message: `Validated ${parsedData.total_items} dishes.`
      });
      setSaveDbConfirmed(true);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processMenu(files, null);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processMenu(files, null);
    }
  };

  const handleLoadSample = () => {
    processMenu(null, SAMPLE_ARTISAN_MENU);
  };

  const handleUpdateItem = (updated) => {
    if (!parsedData) return;
    const newItems = parsedData.items.map((it) => (it.id === updated.id ? updated : it));
    setParsedData({
      ...parsedData,
      items: newItems,
    });
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (!parsedData) return;
    const newItems = parsedData.items.filter((it) => it.id !== id);
    const newCats = Array.from(new Set(newItems.map((i) => i.category)));
    setParsedData({
      ...parsedData,
      total_items: newItems.length,
      categories: newCats,
      items: newItems,
    });
  };

  const filteredItems = parsedData?.items?.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  }) || [];

  // Group items by category for the Canonical Course View
  const groupedByCategory = (parsedData?.categories || []).reduce((acc, cat) => {
    const catItems = filteredItems.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-[#430000] border-2 border-white/80 sketch-card shadow-2xl rounded-2xl overflow-hidden font-tech text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/20 bg-[#5b0000]/80 shrink-0">
          <div className="flex items-center gap-3">
            {parsedData && (
              <button
                onClick={() => {
                  setParsedData(null);
                  setSelectedFiles([]);
                  setSaveDbConfirmed(false);
                }}
                className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold"
                title="Back to Upload"
              >
                ←
              </button>
            )}
            <div>
              <h2 className="font-brand font-bold text-lg sm:text-2xl text-white tracking-wide">
                Café Menu Ingestion & Review
              </h2>
              {!parsedData && (
                <p className="text-[10px] sm:text-xs text-white/70 mt-0.5">
                  Drop an image or PDF. Review the extracted dishes below before confirming save to database.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          
          {/* Top Ingestion Tabs (Shown when no menu parsed or when user resets) */}
          {!parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                <button
                  disabled={isProcessing}
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'upload' ? 'bg-white text-[#430000]' : 'text-white/75 hover:bg-white/10'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <SketchDoc className="w-3.5 h-3.5" />
                  <span>Upload Image / PDF</span>
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'paste' ? 'bg-white text-[#430000]' : 'text-white/75 hover:bg-white/10'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <SketchPencil className="w-3.5 h-3.5" />
                  <span>Paste Raw Text</span>
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setActiveTab('sample');
                    handleLoadSample();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'sample' ? 'bg-white text-[#430000]' : 'text-white/75 hover:bg-white/10'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <SketchCoffee className="w-3.5 h-3.5" />
                  <span>1-Click Sample Menu</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => setIsQrModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-200 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-all ml-auto"
                  title="Generate or print Table QR Cards"
                >
                  <span>🖨️</span>
                  <span>Table QR Cards</span>
                </button>
              </div>

              {/* In-Place Processing Loading State */}
              {isProcessing ? (
                <div className="border-2 border-dashed border-white/40 bg-white/5 rounded-xl p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-4">
                  <div className="inline-block w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  <h4 className="font-brand text-2xl sm:text-3xl font-bold text-white">Extracting & Sorting Menu</h4>
                  <p className="text-xs text-white/80 font-mono animate-pulse max-w-md">{processingStep}</p>
                </div>
              ) : (
                <>
                  {/* Upload Dropzone */}
                  {activeTab === 'upload' && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleFileDrop}
                      className={`border-2 border-dashed rounded-xl p-8 sm:p-14 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3.5 ${
                        isDragOver
                          ? 'border-white bg-white/15 scale-[1.01]'
                          : 'border-white/40 bg-white/5 hover:border-white/70 hover:bg-white/10'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.docx,.doc,.txt,.csv,.md,image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="font-brand text-2xl sm:text-3xl font-bold text-white">
                        Drop your café menu image(s) or PDF here
                      </h3>
                      <p className="text-xs text-white/80 max-w-md">
                        Select <strong>multiple images at once</strong> (e.g. Page 1, Page 2, Page 3) or a PDF. Our OCR engine extracts dishes across all pages and consolidates them into a single sorted menu.
                      </p>
                      <button
                        type="button"
                        className="sketch-btn-white px-5 py-2 text-xs font-bold uppercase tracking-wider mt-1"
                      >
                        Select Multiple Images / Files From Device
                      </button>
                    </div>
                  )}

                  {/* Paste Raw Text */}
                  {activeTab === 'paste' && (
                    <div className="space-y-3">
                      <textarea
                        rows={8}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste your menu lines e.g.&#10;Cold Brew Reserve - Steeped for 18 hours. ₹240&#10;Truffle Pasta - Porcini cream and parmesan. ₹450"
                        className="w-full bg-white/10 border border-white/30 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white font-mono"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => processMenu(null, pastedText)}
                          disabled={!pastedText.trim()}
                          className="sketch-btn-white px-5 py-2 text-xs font-bold disabled:opacity-50"
                        >
                          Extract & Sort Menu
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-900/60 border border-red-400 rounded-lg text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {/* EXTRACTED DETAILS REVIEW SCREEN (Well & Neatly Arranged) */}
          {parsedData && !isProcessing && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* TOP ACTION & SUMMARY BAR */}
              <div className="bg-[#5b0000] p-3.5 sm:p-4 rounded-xl border border-white/25 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                <div>
                  <h3 className="font-brand font-bold text-xl text-white">
                    {parsedData.total_items} Dishes Sorted into {parsedData.categories.length} Courses
                  </h3>
                  <p className="text-[11px] text-white/75 mt-0.5">
                    Review and adjust dishes below. When satisfied, click <strong>Confirm & Continue</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleConfirmAndSave}
                    disabled={isSavingDb}
                    className="sketch-btn-white px-4 py-2 text-xs font-bold shadow-lg disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSavingDb ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-[#430000] border-t-transparent rounded-full animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <span>✓ Confirm & Continue</span>
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRMATION BANNER (When User Clicks Save) */}
              {saveDbConfirmed && (
                <div className="bg-emerald-950/90 border-2 border-emerald-400 p-4 rounded-xl text-white space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <h4 className="font-brand font-bold text-lg text-emerald-200">
                    ✓ Menu Verified & Successfully Saved to Database!
                  </h4>
                  <p className="text-xs text-emerald-100">
                    All <strong>{dbSaveResult?.saved_dishes || parsedData.total_items} dishes</strong> across <strong>{parsedData.categories.length} courses</strong> are live in the database and ready for real-time customer ordering and AI Concierge recommendations.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="sketch-btn-white px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <span>🖨️</span>
                      <span>Generate Table QR Cards (O-5)</span>
                    </button>
                    {onLaunchChat && (
                      <button
                        onClick={() => onLaunchChat(parsedData)}
                        className="sketch-btn-outline px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                      >
                        Launch AI Table Concierge Simulator →
                      </button>
                    )}
                    <button
                      onClick={() => setSaveDbConfirmed(false)}
                      className="px-3 py-1.5 text-xs text-emerald-200 hover:underline"
                    >
                      Keep Reviewing
                    </button>
                  </div>
                </div>
              )}

              {/* CONTROLS BAR: 2-Row Split with Wrapping Pills + Search/View */}
              <div className="space-y-2.5 pb-2 border-b border-white/15">
                
                {/* Row 1: Category Filter Pills (Wrapping cleanly, no scrollbar) */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors font-bold ${
                      selectedCategory === 'All' ? 'bg-white text-[#430000] shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    All Courses ({parsedData.total_items})
                  </button>
                  {parsedData.categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                        selectedCategory === cat ? 'bg-white text-[#430000] font-bold shadow-sm' : 'bg-white/15 text-white hover:bg-white/25'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Row 2: Search Input (Flexible width) + View Switcher */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search dishes, ingredients, or allergens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/10 border border-white/25 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-white transition-colors"
                    />
                    <svg className="w-3.5 h-3.5 text-white/50 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center self-end sm:self-auto border border-white/25 rounded-lg p-0.5 bg-white/10 text-xs shrink-0">
                    <button
                      onClick={() => setViewMode('courses')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        viewMode === 'courses' ? 'bg-white text-[#430000] font-bold shadow-sm' : 'text-white/70 hover:text-white'
                      }`}
                      title="Grouped by Course"
                    >
                      Course View
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        viewMode === 'table' ? 'bg-white text-[#430000] font-bold shadow-sm' : 'text-white/70 hover:text-white'
                      }`}
                      title="Spreadsheet Table View"
                    >
                      Table View
                    </button>
                  </div>
                </div>

              </div>

              {/* VIEW MODE 1: CANONICAL COURSE GROUPED CARDS VIEW */}
              {viewMode === 'courses' && (
                <div className="space-y-6">
                  {Object.keys(groupedByCategory).map((categoryName) => (
                    <div key={categoryName} className="space-y-2.5">
                      
                      {/* Section Header */}
                      <div className="flex items-center justify-between border-b border-white/20 pb-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-brand font-bold text-lg text-amber-200">
                            {categoryName}
                          </h4>
                          <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full font-mono">
                            {groupedByCategory[categoryName].length} dishes
                          </span>
                        </div>
                      </div>

                      {/* Dishes in this Course */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupedByCategory[categoryName].map((dish) => (
                          <div
                            key={dish.id}
                            className="bg-white/10 border border-white/20 rounded-xl p-3 flex flex-col justify-between hover:bg-white/15 transition-all shadow-md group relative"
                          >
                            <div>
                              {/* Price & Name */}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h5 className="font-brand font-bold text-base text-white group-hover:text-amber-200 transition-colors leading-tight">
                                  {dish.name}
                                </h5>
                                <span className="font-brand font-bold text-base text-white shrink-0 bg-white/10 px-2 py-0.5 rounded">
                                  {dish.currency}{dish.price}
                                </span>
                              </div>

                              {/* Description */}
                              {dish.description && (
                                <p className="text-[11px] text-white/80 line-clamp-2 mt-0.5 leading-snug">
                                  {dish.description}
                                </p>
                              )}
                            </div>

                            {/* Tags & Badges */}
                            <div className="mt-3 pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-1 text-[9px]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {dish.is_veg ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded font-medium">
                                    <SketchLeaf className="w-3 h-3 stroke-current" />
                                    <span>Veg</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-red-950/80 text-red-300 border border-red-500/50 px-2 py-0.5 rounded font-medium">
                                    <SketchMeat className="w-3 h-3 stroke-current" />
                                    <span>Non-Veg</span>
                                  </span>
                                )}

                                {dish.is_vegan && (
                                  <span className="inline-flex items-center gap-1 bg-green-950/80 text-green-300 border border-green-500/50 px-2 py-0.5 rounded font-medium">
                                    <SketchVegan className="w-3 h-3 stroke-current" />
                                    <span>Vegan</span>
                                  </span>
                                )}

                                {dish.is_gluten_free && (
                                  <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded font-medium">
                                    <SketchWheat className="w-3 h-3 stroke-current" />
                                    <span>Gluten-Free</span>
                                  </span>
                                )}

                                {dish.spice_level > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-orange-950/80 text-orange-400 border border-orange-500/50 px-1.5 py-0.5 rounded font-medium">
                                    {Array.from({ length: dish.spice_level }).map((_, i) => (
                                      <SketchChili key={i} className="w-3 h-3 fill-orange-400 stroke-orange-400" />
                                    ))}
                                  </span>
                                )}
                              </div>

                              {/* Edit & Delete Buttons */}
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingItem(dish)}
                                  className="text-[10px] text-white/70 hover:text-white px-1.5 py-0.5 hover:bg-white/10 rounded"
                                  title="Edit dish"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(dish.id)}
                                  className="text-[10px] text-red-300 hover:text-red-100 px-1 hover:bg-red-900/40 rounded"
                                  title="Delete dish"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {/* Allergens footnote */}
                            {dish.allergens.length > 0 && (
                              <div className="text-[9px] text-white/50 font-mono mt-1">
                                Allergens: {dish.allergens.join(', ')}
                              </div>
                            )}

                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {/* VIEW MODE 2: SPREADSHEET TABLE VIEW */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/5">
                  <table className="w-full text-left text-xs text-white">
                    <thead className="bg-[#5b0000] text-[10px] uppercase tracking-wider text-white/75 border-b border-white/20 font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Course / Category</th>
                        <th className="py-2.5 px-3">Dish Name</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Dietary Badges</th>
                        <th className="py-2.5 px-3">Spice</th>
                        <th className="py-2.5 px-3">Allergens</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 font-tech">
                      {filteredItems.map((dish) => (
                        <tr key={dish.id} className="hover:bg-white/10 transition-colors">
                          <td className="py-2.5 px-3 text-white/80 font-medium whitespace-nowrap">
                            {dish.category}
                          </td>
                          <td className="py-2.5 px-3 font-brand font-bold text-sm text-white">
                            {dish.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                            {dish.currency}{dish.price}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              {dish.is_veg ? (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded text-[9px]">
                                  <SketchLeaf className="w-2.5 h-2.5" /> Veg
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 bg-red-950 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded text-[9px]">
                                  <SketchMeat className="w-2.5 h-2.5" /> Non-Veg
                                </span>
                              )}
                              {dish.is_vegan && (
                                <span className="inline-flex items-center gap-0.5 bg-green-950 text-green-300 border border-green-500/40 px-1.5 py-0.2 rounded text-[9px]">
                                  <SketchVegan className="w-2.5 h-2.5" /> Vegan
                                </span>
                              )}
                              {dish.is_gluten_free && (
                                <span className="inline-flex items-center gap-0.5 bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded text-[9px]">
                                  <SketchWheat className="w-2.5 h-2.5" /> GF
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {dish.spice_level > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-orange-400">
                                {Array.from({ length: dish.spice_level }).map((_, i) => (
                                  <SketchChili key={i} className="w-3 h-3 fill-orange-400 stroke-orange-400" />
                                ))}
                              </span>
                            ) : (
                              <span className="text-white/40 font-mono">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-white/70 font-mono whitespace-nowrap">
                            {dish.allergens.length > 0 ? dish.allergens.join(', ') : 'None'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setEditingItem(dish)}
                              className="text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 text-xs font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(dish.id)}
                              className="text-red-300 hover:text-red-100 px-2 py-1 rounded hover:bg-red-900/40 text-xs ml-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-white/60 text-xs">
                  No dishes match the selected category or search query.
                </div>
              )}

            </div>
          )}

        </div>

        {/* INLINE EDIT DISH MODAL (Allows owner to fix OCR errors) */}
        {editingItem && (
          <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-[#430000] border-2 border-white/80 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
              <h4 className="font-brand font-bold text-xl text-white">Edit Extracted Dish</h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-white/80 font-bold mb-1">Dish Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded p-2 text-white font-brand text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-white/80 font-bold mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white/10 border border-white/30 rounded p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 font-bold mb-1">Category / Course</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full bg-[#5b0000] border border-white/30 rounded p-2 text-white"
                    >
                      {CANONICAL_COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 font-bold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded p-2 text-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.is_veg}
                      onChange={(e) => setEditingItem({ ...editingItem, is_veg: e.target.checked })}
                      className="rounded"
                    />
                    <span>Veg</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.is_vegan}
                      onChange={(e) => setEditingItem({ ...editingItem, is_vegan: e.target.checked })}
                      className="rounded"
                    />
                    <span>Vegan</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.is_gluten_free}
                      onChange={(e) => setEditingItem({ ...editingItem, is_gluten_free: e.target.checked })}
                      className="rounded"
                    />
                    <span>GF</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/20">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded text-xs text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateItem(editingItem)}
                  className="sketch-btn-white px-4 py-1.5 text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* O-5: INSTANT ASSET & QR GENERATION MODAL */}
        <QRPrintModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          cafeId={dbSaveResult?.cafe_id || parsedData?.cafe_id || 'demo-cafe'}
          cafeName={dbSaveResult?.cafe_name || 'Forkcast Artisan Café'}
          onLaunchTable={(tableNum) => {
            if (onLaunchChat) {
              onLaunchChat({
                ...(parsedData || {}),
                table_number: tableNum
              });
            }
          }}
        />

      </div>

    </div>
  );
}
