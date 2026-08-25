import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScanBarcode, Hand, CornerUpLeft, RotateCw, Printer, Percent, Disc, Tv, Wrench, Award, Smartphone } from 'lucide-react';
import { posService } from '@/features/pos/services/posService';
import FeatureGate from '@/shared/components/FeatureGate';

export default function ControlPanel({
  inputRef,
  inputBuffer,
  setInputBuffer,
  onScan,
  onOpenModal,
  onVoid,
  onAction,
  isEnabled,
  onSelectProduct,
  branchId // Added branchId prop
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  const handleSelectSuggestion = useCallback((product) => {
    setInputBuffer('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  }, [onSelectProduct, setInputBuffer]);

  // Search for suggestions as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!inputBuffer || inputBuffer.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await posService.searchInventory(inputBuffer.trim(), branchId);
        const data = res.data?.data || res.data || [];

        // Check for exact barcode/sku match for auto-add
        const currentInput = inputBuffer.trim();
        const isNumeric = /^\d+$/.test(currentInput);

        const items = Array.isArray(data) ? data.slice(0, 8) : [];

        // If it's a pure number string, we assume it's a barcode scan that we should auto-add
        // if we find a matching barcode
        if (isNumeric && currentInput.length >= 3) {
          const exactMatch = items.find(item => item.barcode === currentInput);
          if (exactMatch) {
            handleSelectSuggestion(exactMatch);
            return;
          }
        }

        setSuggestions(items);
        setShowSuggestions(items.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200); // Faster debounce (200ms) for snappier response

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [branchId, handleSelectSuggestion, inputBuffer]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const container = suggestionsRef.current;
      const selectedItem = container.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Scanner detection refs
  const lastInputTime = useRef(0);
  const scanTimeout = useRef(null);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    const now = Date.now();
    const timeDiff = now - lastInputTime.current;

    // Pass to parent first
    setInputBuffer(newVal);

    // Scanner Logic: Detect rapid input (>2 chars, <100ms interval)
    // Relaxed to 100ms to support a wider range of scanners
    if (newVal.length > inputBuffer.length && newVal.length > 2) {
      if (timeDiff < 100) {
        // Likely a scanner - reset the "End of Scan" timer
        if (scanTimeout.current) clearTimeout(scanTimeout.current);

        // Auto-submit if no new input for 200ms
        scanTimeout.current = setTimeout(() => {
          if (newVal.trim().length >= 3) {
            onScan(newVal.trim());
          }
        }, 200);
      }
    }

    lastInputTime.current = now;
  };

  const handleKeyDown = (e) => {
    // If scanner sends ENTER, cancel the auto-submit to verify double entry
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) return; // Let parent handle shortcut
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    }

    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') onScan();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const next = prev + 1;
        return next >= suggestions.length ? 0 : next; // Wrap around to top
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const next = prev - 1;
        return next < 0 ? suggestions.length - 1 : next; // Wrap around to bottom
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        onScan();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  return (
    <div className="w-4/12 bg-slate-50 flex flex-col h-full border-r border-slate-200 z-10">

      {/* SCANNER INPUT AREA */}
      <div className="p-3 bg-white border-b border-slate-200 shrink-0 relative">
        <div className="flex gap-0 rounded-md shadow-sm border border-blue-300 overflow-hidden h-14">
          <div className="bg-blue-50 px-3 flex items-center border-r border-blue-200">
            <ScanBarcode className="w-6 h-6 text-blue-700" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputBuffer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="flex-1 px-3 text-xl font-mono text-slate-800 focus:outline-none focus:bg-white transition font-bold"
            placeholder="Scan / PLU..."
            disabled={!isEnabled}
            autoComplete="off"
          />
          <button onClick={onScan} className="bg-blue-600 text-white px-5 font-bold hover:bg-blue-700 transition active:bg-blue-800 text-sm tracking-wide">
            ENTER
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute left-3 right-3 top-[72px] bg-white border border-slate-300 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto"
          >
            {suggestions.map((item, index) => (
              <div
                key={item.productId || item.id || index}
                className={`px-3 py-2 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center transition-colors ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                onMouseDown={() => handleSelectSuggestion(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 text-sm truncate">
                    {item.name || item.productName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {item.sku || item.barcode}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="font-bold text-green-600 text-sm">
                    LKR {parseFloat(item.sellingPrice || item.price || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FUNCTION BUTTONS GRID */}
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden min-h-0">

        {/* Top Grid: F-Keys */}
        <div className="grid grid-cols-2 gap-2 flex-[2] min-h-0">
          <button onClick={() => onOpenModal('PRICE_CHECK')} className="bg-white border-2 border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 flex flex-col items-center justify-center p-1 transition-colors h-full active:scale-95">
            <span className="text-sm font-bold text-slate-700">Price Check</span>
            <span className="text-slate-400 text-[10px] font-mono">(F1)</span>
          </button>
          <button onClick={onVoid} className="bg-red-50 border-2 border-red-200 rounded-lg shadow-sm hover:bg-red-100 flex flex-col items-center justify-center p-1 transition-colors h-full active:scale-95">
            <span className="text-sm font-bold text-red-700">Void Item</span>
            <span className="text-red-600/60 text-[10px] font-mono">(Del)</span>
          </button>

          <button onClick={() => onAction('RECALL')} className="col-span-2 bg-white border-2 border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 flex flex-col items-center justify-center p-1 transition-colors h-full active:scale-95">
            <span className="text-sm font-bold text-slate-700">Recall Bill</span>
            <span className="text-slate-400 text-[10px] font-mono">(F3)</span>
          </button>
          <button onClick={() => onAction('CANCEL')} className="col-span-2 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm hover:bg-red-100 flex flex-col items-center justify-center p-1 transition-colors h-full active:scale-95">
            <span className="text-sm font-bold text-red-700">Cancel Transaction</span>
            <span className="text-red-600/60 text-[10px] font-mono">(F4)</span>
          </button>
        </div>

        {/* Middle Row: Operations */}
        <div className="grid grid-cols-3 gap-2 h-14 shrink-0">
          <button onClick={() => onAction('HOLD')} className="bg-yellow-50 border border-yellow-200 rounded shadow-sm hover:bg-yellow-100 flex items-center justify-center gap-1 h-full active:scale-95">
            <Hand className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-800">Hold</span>
          </button>
          <button onClick={() => onAction('RETURN')} className="bg-rose-50 border border-rose-200 rounded shadow-sm hover:bg-rose-100 flex items-center justify-center gap-1 h-full active:scale-95">
            <CornerUpLeft className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-rose-800">Return</span>
          </button>

          <FeatureGate featureCode="POS_LOYALTY" featureName="Loyalty Redemption">
            <button onClick={() => onAction('REDEEM')} className="bg-fuchsia-50 border border-fuchsia-200 rounded shadow-sm hover:bg-fuchsia-100 flex items-center justify-center gap-1 h-full active:scale-95">
              <Award className="w-4 h-4 text-fuchsia-600" />
              <span className="text-xs font-bold text-fuchsia-800">Redeem</span>
            </button>
          </FeatureGate>
        </div>

        {/* Bottom Grid: Admin/Misc */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <button onClick={() => onOpenModal('PAID_IN')} className="bg-slate-100 border border-slate-200 rounded shadow-sm hover:bg-slate-200 flex items-center justify-center h-full active:scale-95">
            <span className="text-xs font-bold text-slate-700">Paid In</span>
          </button>
          <button onClick={() => onOpenModal('PAID_OUT')} className="bg-slate-100 border border-slate-200 rounded shadow-sm hover:bg-slate-200 flex items-center justify-center h-full active:scale-95">
            <span className="text-xs font-bold text-slate-700">Paid Out</span>
          </button>
          <FeatureGate featureCode="POS_LOYALTY" featureName="POS Loyalty">
            <button onClick={() => onOpenModal('LOYALTY')} className="bg-purple-50 border border-purple-200 rounded shadow-sm hover:bg-purple-100 flex items-center justify-center h-full active:scale-95">
              <span className="text-xs font-bold text-purple-800">Loyalty</span>
            </button>
          </FeatureGate>
          <button onClick={() => onOpenModal('REGISTER')} className="bg-purple-50 border border-purple-200 rounded shadow-sm hover:bg-purple-100 flex items-center justify-center h-full active:scale-95">
            <span className="text-xs font-bold text-purple-800">Register</span>
          </button>
        </div>
      </div>

      {/* FOOTER: PAYMENTS */}
      <div className="mt-auto p-3 border-t border-slate-300 bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <button onClick={() => onAction('RELOAD')} className="h-10 bg-indigo-50 border border-indigo-300 rounded shadow-sm flex items-center justify-center gap-1 hover:bg-indigo-100 active:scale-95">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-700">Reload</span>
          </button>
          <FeatureGate featureCode="POS_SERVICE_REPAIRS" featureName="POS Service & Repairs">
            <button onClick={() => onAction('DTV_INSTALL')} className="h-10 bg-blue-50 border border-blue-300 rounded shadow-sm flex items-center justify-center gap-1 hover:bg-blue-100 active:scale-95">
              <Tv className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-700">DTV</span>
            </button>
          </FeatureGate>
          <FeatureGate featureCode="POS_SERVICE_REPAIRS" featureName="POS Service & Repairs">
            <button onClick={() => onAction('REPAIR_LOG')} className="h-10 bg-emerald-50 border border-emerald-300 rounded shadow-sm flex items-center justify-center gap-1 hover:bg-emerald-100 active:scale-95">
              <Wrench className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">Repair</span>
            </button>
          </FeatureGate>
          <button onClick={() => onOpenModal('DISCOUNT')} className="h-10 bg-yellow-50 border border-yellow-200 rounded shadow-sm flex items-center justify-center gap-1 hover:bg-yellow-100 active:scale-95">
            <Percent className="w-4 h-4 text-yellow-600" />
            <span className="text-[10px] font-bold text-yellow-800">Disc</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onAction('PAY_CASH')}
            className="h-20 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[4px] flex flex-col items-center justify-center transition-all col-span-2 border border-green-400/20">
            <span className="font-bold text-3xl tracking-wider drop-shadow-sm">CASH</span>
            <span className="text-xs opacity-90 uppercase font-mono mt-0.5 font-bold tracking-widest bg-black/10 px-2 rounded"> \ </span>
          </button>
          <button onClick={() => onAction('PAY_CARD')}
            className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-[0_4px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px] flex flex-col items-center justify-center transition-all border border-blue-400/20">
            <span className="font-bold text-xl tracking-wider drop-shadow-sm">CARD</span>
            <span className="text-[10px] opacity-90 uppercase font-mono mt-0.5 font-bold bg-black/10 px-2 rounded">F10</span>
          </button>

          {/* ADDED: QR ACTION HERE */}
          <button onClick={() => onAction('PAY_QR')}
            className="h-16 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl shadow-[0_4px_0_rgb(15,23,42)] active:shadow-none active:translate-y-[4px] flex flex-col items-center justify-center transition-all border border-slate-600/20">
            <span className="font-bold text-xl tracking-wider drop-shadow-sm">QR</span>
            <span className="text-[10px] opacity-90 uppercase font-mono mt-0.5 font-bold bg-black/10 px-2 rounded">F11</span>
          </button>
        </div>
      </div>
    </div>
  );
}
