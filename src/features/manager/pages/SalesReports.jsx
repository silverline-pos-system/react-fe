import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, Calendar, Search, Download, RefreshCw,
  TrendingUp, TrendingDown, DollarSign, FileText, ChevronDown,
  ChevronUp, Printer, CreditCard, Banknote, ArrowDownRight
} from "lucide-react";
import { getSalesReports, getSalesReportsPdf } from "../services/managerService";

// Comparison Card Component
function ComparisonCard({ title, current, previous, prefix = "", isCurrency = false }) {
  const currentVal = Number(current) || 0;
  const previousVal = Number(previous) || 0;
  const change = previousVal !== 0 ? ((currentVal - previousVal) / previousVal) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (val) => {
    if (isCurrency) {
      return `${prefix}${val.toLocaleString()}`;
    }
    return `${prefix}${val.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">{title}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-slate-800">{formatValue(currentVal)}</div>
        <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'
          }`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <div className="text-xs text-slate-400 mt-1">
        vs previous: {formatValue(previousVal)}
      </div>
    </div>
  );
}

// Expandable Day Row Component
function DayRow({ report, isExpanded, onToggle }) {
  const profitMarginColor = report.profitMargin >= 30 ? 'text-emerald-600' :
    report.profitMargin >= 20 ? 'text-blue-600' :
      report.profitMargin >= 10 ? 'text-amber-600' : 'text-red-600';

  return (
    <>
      <tr
        className="hover:bg-slate-50 cursor-pointer transition-colors border-t border-slate-100"
        onClick={onToggle}
      >
        <td className="p-4">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            <div>
              <div className="font-medium text-slate-800">{report.date}</div>
              <div className="text-xs text-slate-400">{report.dayName}</div>
            </div>
          </div>
        </td>
        <td className="p-4 text-center">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            {report.invoices}
          </span>
        </td>
        <td className="p-4 text-right font-bold text-slate-800">
          LKR {Number(report.revenue || 0).toLocaleString()}
        </td>
        <td className="p-4 text-right text-slate-600">
          LKR {Number(report.cost || 0).toLocaleString()}
        </td>
        <td className="p-4 text-right font-bold text-emerald-600">
          LKR {Number(report.profit || 0).toLocaleString()}
        </td>
        <td className="p-4 text-right">
          <span className={`font-bold ${profitMarginColor}`}>
            {report.profitMargin?.toFixed(1) || 0}%
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50">
          <td colSpan={6} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Banknote size={14} />
                  <span className="text-xs font-medium uppercase">Cash Sales</span>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  LKR {Number(report.cashSales || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <CreditCard size={14} />
                  <span className="text-xs font-medium uppercase">Card Sales</span>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  LKR {Number(report.cardSales || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <ArrowDownRight size={14} />
                  <span className="text-xs font-medium uppercase">Returns</span>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  LKR {Number(report.returns || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <DollarSign size={14} />
                  <span className="text-xs font-medium uppercase">Avg Basket</span>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  LKR {Number(report.avgBasket || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function SalesReports() {
  const [reports, setReports] = useState([]);
  const [prevReports, setPrevReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);

      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - diffDays);

      const prevStartDate = prevStart.toISOString().split('T')[0];
      const prevEndDate = prevEnd.toISOString().split('T')[0];

      const [currentData, previousData] = await Promise.all([
        getSalesReports({ startDate, endDate }),
        getSalesReports({ startDate: prevStartDate, endDate: prevEndDate })
      ]);

      if (Array.isArray(currentData)) {
        setReports(currentData);
      } else {
        setReports([]);
      }

      if (Array.isArray(previousData)) {
        setPrevReports(previousData);
      } else {
        setPrevReports([]);
      }
    } catch (err) {
      console.error("Failed to load sales reports", err);
      setReports([]);
      setPrevReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const filteredReports = useMemo(() => {
    if (!searchTerm) return reports;
    return reports.filter(r =>
      r.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.dayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  const totals = useMemo(() => {
    if (filteredReports.length === 0) return null;

    return {
      invoices: filteredReports.reduce((sum, r) => sum + (r.invoices || 0), 0),
      revenue: filteredReports.reduce((sum, r) => sum + Number(r.revenue || 0), 0),
      cost: filteredReports.reduce((sum, r) => sum + Number(r.cost || 0), 0),
      profit: filteredReports.reduce((sum, r) => sum + Number(r.profit || 0), 0),
      cashSales: filteredReports.reduce((sum, r) => sum + Number(r.cashSales || 0), 0),
      cardSales: filteredReports.reduce((sum, r) => sum + Number(r.cardSales || 0), 0),
      returns: filteredReports.reduce((sum, r) => sum + Number(r.returns || 0), 0)
    };
  }, [filteredReports]);

  const prevTotals = useMemo(() => {
    if (prevReports.length === 0) return null;

    return {
      invoices: prevReports.reduce((sum, r) => sum + (r.invoices || 0), 0),
      revenue: prevReports.reduce((sum, r) => sum + Number(r.revenue || 0), 0),
      cost: prevReports.reduce((sum, r) => sum + Number(r.cost || 0), 0),
      profit: prevReports.reduce((sum, r) => sum + Number(r.profit || 0), 0),
    };
  }, [prevReports]);

  const comparisons = useMemo(() => {
    if (!totals) return null;

    return {
      currentRevenue: totals.revenue,
      previousRevenue: prevTotals ? prevTotals.revenue : 0,
      currentTransactions: totals.invoices,
      previousTransactions: prevTotals ? prevTotals.invoices : 0,
      currentCost: totals.cost,
      previousCost: prevTotals ? prevTotals.cost : 0,
      currentProfit: totals.profit,
      previousProfit: prevTotals ? prevTotals.profit : 0
    };
  }, [totals, prevTotals]);

  const toggleRowExpand = (date) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const exportReport = async () => {
    try {
      const blob = await getSalesReportsPdf(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${startDate}_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF", err);
      alert("Failed to export report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading sales reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Sales Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Detailed sales analytics and performance tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all ${refreshing ? 'animate-spin' : ''
              }`}
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all"
          >
            <Printer size={18} />
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-sm text-slate-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by date..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-48"
            />
          </div>
        </div>
      </div>

      {comparisons && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ComparisonCard title="Total Revenue" current={comparisons.currentRevenue} previous={comparisons.previousRevenue} prefix="LKR " isCurrency />
          <ComparisonCard title="Transactions" current={comparisons.currentTransactions} previous={comparisons.previousTransactions} />
          <ComparisonCard title="Total Cost" current={comparisons.currentCost} previous={comparisons.previousCost} prefix="LKR " isCurrency />
          <ComparisonCard title="Net Profit" current={comparisons.currentProfit} previous={comparisons.previousProfit} prefix="LKR " isCurrency />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-800">Daily Sales Report</span>
            <span className="ml-2 text-sm text-slate-400">{`${filteredReports.length} days`}</span>
          </div>
          {totals && (
            <div className="text-sm text-slate-600">
              Total Revenue: <span className="font-bold text-emerald-600">LKR {totals.revenue.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-center p-4 font-semibold">Invoices</th>
                <th className="text-right p-4 font-semibold">Revenue</th>
                <th className="text-right p-4 font-semibold">Cost</th>
                <th className="text-right p-4 font-semibold">Profit</th>
                <th className="text-right p-4 font-semibold">Margin</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No sales data for the selected period
                  </td>
                </tr>
              ) : (
                <>
                  {filteredReports.map((report) => (
                    <DayRow
                      key={report.date}
                      report={report}
                      isExpanded={expandedRows.has(report.date)}
                      onToggle={() => toggleRowExpand(report.date)}
                    />
                  ))}
                  {totals && (
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td className="p-4 text-slate-800">TOTAL</td>
                      <td className="p-4 text-center text-slate-800">{totals.invoices}</td>
                      <td className="p-4 text-right text-slate-800">LKR {totals.revenue.toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-600">LKR {totals.cost.toLocaleString()}</td>
                      <td className="p-4 text-right text-emerald-600">LKR {totals.profit.toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-600">
                        {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
