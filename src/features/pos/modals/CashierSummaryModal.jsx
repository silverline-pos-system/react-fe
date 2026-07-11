import React from 'react';
import useEscapeClose from '@/shared/hooks/useEscapeClose';
import { UserCircle2, X, Banknote, CreditCard, QrCode, TrendingUp, Percent, Receipt, ArrowUpRight, ArrowDownLeft, Calculator, RotateCcw } from 'lucide-react';

const formatMoney = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const pick = (obj, keys, fallback = 0) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
};

export default function CashierSummaryModal({ cashierName, shiftId, summary, loading, onClose }) {
  useEscapeClose(onClose);
  const cashSales = pick(summary, ['cashSales', 'cashTotal', 'cashAmount']);
  const cardSales = pick(summary, ['cardTotal', 'cardSales', 'cardAmount']);
  const otherSales = pick(summary, ['otherPayments', 'otherTotal', 'qrTotal', 'qrSales']);
  const openingFloat = pick(summary, ['openingFloat', 'openingCash']);
  const paidIn = pick(summary, ['paidIn', 'totalPaidIn']);
  const paidOut = pick(summary, ['paidOut', 'totalPaidOut']);
  const expectedCash = pick(summary, ['expectedCash', 'expectedCashInDrawer']);
  const transactionCount = pick(summary, ['transactionCount', 'totalBills', 'totalTransactions', 'billCount']);
  const totalReturns = pick(summary, ['totalReturns', 'returnTotal', 'returnsAmount']);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white w-[640px] rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle2 className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-white font-bold uppercase text-sm">Cashier Summary</div>
              <div className="text-[11px] text-slate-400">
                {cashierName} {shiftId ? `• Shift #${shiftId}` : ''}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading summary...</div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Transaction Count Banner */}
            <div className="bg-slate-880 rounded-lg px-4 py-2.5 flex justify-between items-center bg-slate-800">
              <span className="text-slate-300 text-xs font-bold uppercase flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Total Transactions
              </span>
              <span className="font-mono font-bold text-xl text-white">{Number(transactionCount || 0).toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs font-bold text-green-700 uppercase flex items-center gap-1">
                  <Banknote className="w-4 h-4" /> Cash Sales
                </div>
                <div className="text-lg font-mono font-bold text-green-800">LKR {formatMoney(cashSales)}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-xs font-bold text-purple-700 uppercase flex items-center gap-1">
                  <CreditCard className="w-4 h-4" /> Card Sales
                </div>
                <div className="text-lg font-mono font-bold text-purple-800">LKR {formatMoney(cardSales)}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
                  <QrCode className="w-4 h-4" /> Other/QR
                </div>
                <div className="text-lg font-mono font-bold text-blue-800">LKR {formatMoney(otherSales)}</div>
              </div>
            </div>

            {/* Total Returns */}
            {Number(totalReturns || 0) > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
                <div className="text-xs font-bold text-red-700 uppercase flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" /> Total Returns
                </div>
                <div className="text-lg font-mono font-bold text-red-700">-LKR {formatMoney(totalReturns)}</div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-white border-b border-slate-200">Cash Flow</div>
              <div className="p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Opening Float</span>
                  <span className="font-mono font-bold text-slate-800">LKR {formatMoney(openingFloat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-blue-500" /> Paid In</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-blue-700">+{formatMoney(paidIn)}</span>
                    {summary.pendingPaidIn > 0 && (
                      <div className="text-[10px] text-amber-600 font-medium">
                        +{formatMoney(summary.pendingPaidIn)} (Pending)
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 flex items-center gap-1"><ArrowDownLeft className="w-3 h-3 text-red-500" /> Paid Out</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-red-700">-{formatMoney(paidOut)}</span>
                    {summary.pendingPaidOut > 0 && (
                      <div className="text-[10px] text-amber-600 font-medium">
                        -{formatMoney(summary.pendingPaidOut)} (Pending)
                      </div>
                    )}
                  </div>
                </div>
                {Number(totalReturns || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 flex items-center gap-1"><RotateCcw className="w-3 h-3 text-red-500" /> Returns</span>
                    <span className="font-mono font-bold text-red-700">-{formatMoney(totalReturns)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-700 font-semibold">Expected Cash</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">LKR {formatMoney(expectedCash)}</span>
                    {(summary.pendingPaidIn > 0 || summary.pendingPaidOut > 0) && (
                      <span className="text-[10px] text-slate-400">
                        (Excl. Pending)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
