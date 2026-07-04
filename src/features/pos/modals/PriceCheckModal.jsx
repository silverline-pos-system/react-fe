import React, { useState, useEffect, useRef } from 'react';
import { Tag, X, Search, Package, AlertCircle, Layers } from 'lucide-react';
import { posService } from '@/features/pos/services/posService';

export default function PriceCheckModal({ onClose, branchId }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await posService.searchInventory(query.trim(), branchId);
        const data = res.data?.data || res.data || [];
        const items = Array.isArray(data) ? data.slice(0, 6) : [];
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, branchId]);

  const processProduct = async (identifier) => {
    setLoading(true);
    setError(false);
    setResult(null);
    setSuggestions([]);
    setShowSuggestions(false);

    try {
        const res = await posService.checkPrice(identifier, branchId);
        const rawData = res.data?.data || res.data;

        if (rawData) {
            let priceGroups = [];
            let totalStock = 0;
            
            if (rawData.availablePrices && rawData.availablePrices.length > 0) {
                const priceMap = new Map();
                for (const batch of rawData.availablePrices) {
                    if (batch.sellingPrice == null) continue;
                    const pKey = parseFloat(batch.sellingPrice).toFixed(2);
                    if (!priceMap.has(pKey)) {
                        priceMap.set(pKey, {
                            sellingPrice: parseFloat(batch.sellingPrice),
                            mrp: batch.mrp ? parseFloat(batch.mrp) : null,
                            totalStock: 0
                        });
                    }
                    const group = priceMap.get(pKey);
                    const qty = parseFloat(batch.stockQty || 0);
                    group.totalStock += qty;
                    totalStock += qty;
                    
                    if (batch.mrp && (!group.mrp || parseFloat(batch.mrp) > group.mrp)) {
                        group.mrp = parseFloat(batch.mrp);
                    }
                }
                priceGroups = Array.from(priceMap.values()).sort((a,b) => a.sellingPrice - b.sellingPrice);
            } else {
                const price = rawData.sellingPrice ?? rawData.price ?? rawData.unitPrice ?? 0;
                const stock = rawData.availableStock ?? rawData.stockQty ?? rawData.quantity ?? rawData.stock ?? 0;
                totalStock = parseFloat(stock);
                priceGroups = [{
                    sellingPrice: parseFloat(price) || 0,
                    mrp: rawData.mrp ? parseFloat(rawData.mrp) : null,
                    totalStock: totalStock
                }];
            }

            setResult({
                id: rawData.productId || rawData.id || rawData.sku || rawData.barcode,
                name: rawData.name || rawData.productName || 'Unknown Product',
                sku: rawData.sku,
                barcode: rawData.barcode,
                priceGroups: priceGroups,
                totalStock: totalStock,
                inStock: totalStock > 0 || rawData.inStock !== false
            });
        } else {
            setError(true);
        }
    } catch (err) {
        console.error('Price check error:', err);
        setError(true);
    }
    setLoading(false);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (product) => {
    const identifier = product.barcode || product.sku || product.productId || product.id;
    if (identifier) processProduct(identifier);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const container = suggestionsRef.current;
      const selectedItem = container.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const next = prev + 1;
        return next >= suggestions.length ? 0 : next; 
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const next = prev - 1;
        return next < 0 ? suggestions.length - 1 : next; 
      });
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }
    
    processProduct(query.trim());
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px]">
      <div className="bg-white w-[500px] rounded-xl shadow-2xl transform transition-all">
        <div className="bg-slate-800 px-5 py-4 flex justify-between items-center rounded-t-xl">
            <h3 className="text-white font-bold text-xl flex items-center gap-2"><Tag className="w-6 h-6 text-blue-400"/> Price Verifier</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
        </div>
        <div className="p-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Scan Item / Enter Code</label>
            <div className="relative mb-4">
                <form onSubmit={handleSearch}>
                    <div className="flex gap-0 border-2 border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                        <input 
                          ref={inputRef}
                          type="text" 
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          className="flex-1 px-4 py-3 text-xl font-mono font-bold focus:outline-none text-slate-800" 
                          placeholder="Type to search..." 
                          autoComplete="off"
                        />
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-5 font-bold hover:bg-blue-700 transition-colors">
                            {loading ? "..." : <Search className="w-6 h-6"/>}
                        </button>
                    </div>
                </form>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-2xl z-[100] max-h-80 overflow-y-auto"
                  >
                    {suggestions.map((item, index) => (
                      <div
                        key={item.productId || item.id || index}
                        className={`px-4 py-3 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center transition-colors ${
                          index === selectedIndex ? 'bg-blue-100' : 'hover:bg-slate-50'
                        }`}
                        onMouseDown={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {item.name || item.productName}
                          </div>
                          <div className="text-sm text-slate-500 font-mono mt-0.5">
                            {item.sku || item.barcode}
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="font-bold text-green-600 text-lg">
                            LKR {parseFloat(item.sellingPrice || item.price || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {result && (
              <div className="text-center space-y-4 pt-4 fade-enter-active">
                  {result.priceGroups.length === 1 ? (
                      <>
                          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Item Price</div>
                          <div className="text-6xl font-black font-mono text-slate-900 tracking-tight">
                              <span className="text-3xl font-bold align-top text-slate-400 mr-1">LKR</span> 
                              {(result.priceGroups[0].sellingPrice).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {result.priceGroups[0].mrp > 0 && (
                              <div className="text-sm font-bold text-slate-400 font-mono">
                                  MRP: LKR {(result.priceGroups[0].mrp).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                          )}
                      </>
                  ) : (
                      <>
                          <div className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                              <AlertCircle className="w-4 h-4" /> Multiple Prices Detected
                          </div>
                          <div className="max-h-52 overflow-y-auto space-y-2 text-left">
                              {result.priceGroups.map((group, idx) => (
                                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center">
                                      <div>
                                          <div className="text-2xl font-black text-amber-700 tracking-tight">
                                              <span className="text-sm font-bold text-amber-500 mr-1">LKR</span>
                                              {(group.sellingPrice).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </div>
                                          {group.mrp > 0 && (
                                              <div className="text-[11px] font-bold text-amber-500/70">
                                                  MRP: LKR {(group.mrp).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                              </div>
                                          )}
                                      </div>
                                      <div className={`text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${group.totalStock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-50 text-red-600'}`}>
                                          <Layers className="w-4 h-4" /> {group.totalStock > 0 ? `${group.totalStock} units` : 'Out of Stock'}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </>
                  )}

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left mt-4 shadow-sm">
                      <div className="text-base font-bold text-slate-800 leading-tight mb-2">{result.name}</div>
                      <div className="flex justify-between items-center mt-3">
                          <span className="text-sm font-mono text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                              {result.sku || result.barcode || result.id}
                          </span>
                          <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold px-3 py-1 flex items-center gap-1.5 rounded-lg border ${result.totalStock > 10 ? 'bg-green-50 text-green-700 border-green-200' : result.totalStock > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  <Layers className="w-4 h-4" /> {result.totalStock > 0 ? `${result.totalStock} units in stock` : 'Out of Stock'}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
            )}

            {error && (
              <div className="text-center py-8 fade-enter-active">
                  <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-3"/>
                  <p className="text-red-600 font-bold text-lg">Item Not Found</p>
                  <p className="text-sm text-red-400 mt-1">Check the code and try again.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
