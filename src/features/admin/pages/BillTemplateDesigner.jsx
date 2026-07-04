import React, { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle, FileText, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { getAllBranches } from "../services/adminApi";
import {
  clearBranchPrintHeaderFooterSettingsRemote,
  fetchBranchPrintHeaderFooterSettings,
  printHeaderFooterDefaults,
  saveBranchPrintHeaderFooterSettingsRemote,
} from "../services/printHeaderFooterService";

function defaultFormFromSettings(settings) {
  return {
    businessName:    settings?.header?.businessName || "",
    branchLine:      settings?.header?.branchLine   || "",
    address:         settings?.header?.address      || "",
    contact:         settings?.header?.contact      || "",
    headerExtraLine: settings?.header?.extraLine    || "",
    thankYouLine:    settings?.footer?.thankYouLine || "",
    policyLine:      settings?.footer?.policyLine   || "",
    poweredByLine:   settings?.footer?.poweredByLine || "",
    footerExtraLine: settings?.footer?.extraLine    || "",
  };
}

function mapFormToSettings(form) {
  return {
    header: {
      businessName: form.businessName.trim(),
      branchLine:   form.branchLine.trim(),
      address:      form.address.trim(),
      contact:      form.contact.trim(),
      extraLine:    form.headerExtraLine.trim(),
    },
    footer: {
      thankYouLine:  form.thankYouLine.trim(),
      policyLine:    form.policyLine.trim(),
      poweredByLine: form.poweredByLine.trim(),
      extraLine:     form.footerExtraLine.trim(),
    },
  };
}

function getBranchId(branch) {
  return branch?.id ?? branch?.branchId ?? branch?.branch_id ?? null;
}

function getBranchName(branch) {
  return branch?.name || branch?.branchName || "Unnamed Branch";
}

// ─── Preview Component ────────────────────────────────────────────────────────

function ReceiptPreview({ form, selectedBranch }) {
  const SAMPLE_ITEMS = [
    { name: "PONNI KEERI SAMBA 1KG", base: "260.00", disc: "",      price: "260.00", qty: "1.00",  amt: "260.00" },
    { name: "MUNCHEE SUPER CREAM CRACKER 490G", base: "480.00", disc: "60.00", price: "420.00", qty: "1.00",  amt: "420.00" },
    { name: "BIG ONION",             base: "197.00", disc: "",      price: "197.00", qty: "1.06",  amt: "208.82" },
  ];

  return (
    <div
      className="mx-auto rounded-md border border-slate-300 bg-white p-3 shadow-sm"
      style={{ width: 272, fontFamily: "'Courier New', Courier, monospace", fontSize: 10, lineHeight: 1.45, color: "#000" }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: "#666" }}>ORIGINAL BILL</div>
        <div style={{ fontSize: 14, fontWeight: "bold", lineHeight: 1.2, whiteSpace: "pre-line" }}>
          {form.businessName || "Business Name"}
        </div>
        {form.branchLine && (
          <div style={{ fontSize: 10, whiteSpace: "pre-line" }}>{form.branchLine}</div>
        )}
        <div style={{ fontSize: 9, whiteSpace: "pre-line" }}>
          {form.address || (selectedBranch?.address) || "No 24, Kandy Road, Mawathagama"}
        </div>
        <div style={{ fontSize: 9, whiteSpace: "pre-line" }}>
          {form.contact || (selectedBranch?.phone) || "TEL : 037 7824631 / 0776818151"}
        </div>
        {form.headerExtraLine && (
          <div style={{ fontSize: 9, whiteSpace: "pre-line" }}>{form.headerExtraLine}</div>
        )}
      </div>

      {/* ── Bill Meta ── */}
      <div style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", margin: "4px 0", padding: "2px 0" }}>
        <div style={{ display: "flex", justifycontent: "space-between", fontSize: 9 }}>
          <span>Bill No &nbsp;: INV-0001</span>
          <span>Unit No &nbsp;: 1</span>
        </div>
        <div style={{ display: "flex", justifycontent: "space-between", fontSize: 9 }}>
          <span></span>
          <span>CASHIER &nbsp;: Demo User</span>
        </div>
      </div>

      {/* ── Items Table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th style={{ width: "22%", textAlign: "left",  fontSize: 10, fontWeight: "bold", paddingBottom: 2 }}>Item</th>
            <th style={{ width: "12%", textAlign: "right", fontSize: 10, fontWeight: "bold", paddingBottom: 2 }}>%</th>
            <th style={{ width: "22%", textAlign: "right", fontSize: 10, fontWeight: "bold", paddingBottom: 2 }}>Price</th>
            <th style={{ width: "14%", textAlign: "right", fontSize: 10, fontWeight: "bold", paddingBottom: 2 }}>Qty</th>
            <th style={{ width: "30%", textAlign: "right", fontSize: 10, fontWeight: "bold", paddingBottom: 2 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_ITEMS.map((item, i) => (
            <React.Fragment key={`item-${i}`}>
              <tr>
                <td colSpan={5} style={{ fontWeight: 600, fontSize: 10, paddingTop: 3 }}>
                  {i + 1}) {item.name}
                </td>
              </tr>
              <tr style={{ paddingBottom: 3 }}>
                <td style={{ fontSize: 9 }}>{item.base}</td>
                <td style={{ textAlign: "right", fontSize: 9 }}>{item.disc}</td>
                <td style={{ textAlign: "right", fontSize: 9 }}>{item.price}&nbsp;*</td>
                <td style={{ textAlign: "right", fontSize: 9 }}>{item.qty}</td>
                <td style={{ textAlign: "right", fontSize: 9, fontWeight: 600 }}>{item.amt}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ── Net Total ── */}
      <div style={{ borderTop: "1px solid #000", marginTop: 3, paddingTop: 2 }}>
        <div style={{ display: "flex", justifycontent: "space-between", fontWeight: "bold", fontSize: 12 }}>
          <span>NET TOTAL</span>
          <span>889.82</span>
        </div>
      </div>

      {/* ── Cash / Balance ── */}
      <div style={{ borderTop: "1px solid #000", paddingTop: 2 }}>
        <div style={{ display: "flex", justifycontent: "space-between", fontWeight: "bold", fontSize: 12 }}>
          <span>CASH</span>
          <span>1,000.00</span>
        </div>
        <div style={{ display: "flex", justifycontent: "space-between", fontWeight: "bold", fontSize: 12 }}>
          <span>BALANCE</span>
          <span>110.18</span>
        </div>
      </div>

      {/* ── Time / Piece Count ── */}
      <div style={{ borderTop: "1px solid #000", marginTop: 2, paddingTop: 2 }}>
        <div style={{ display: "flex", justifycontent: "space-between", fontSize: 9 }}>
          <span>Time</span>
          <span>No Of Pieces : 3.06</span>
        </div>
        <div style={{ display: "flex", justifycontent: "space-between", fontSize: 9 }}>
          <span>Mar 13, 2026 10:10 AM</span>
          <span>No Of Items &nbsp;&nbsp;: 3</span>
        </div>
      </div>

      {/* ── Discount Box ── */}
      <div style={{ border: "1px solid #000", textAlign: "center", fontSize: 10, fontWeight: 600, padding: "3px 6px", margin: "4px 0" }}>
        Your Discount For Bill 80.00
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: "center", fontSize: 9, margin: "3px 0", whiteSpace: "pre-line" }}>
        {form.policyLine || "NO EXCHANGE ARE POSSIBLE."}
      </div>
      <div style={{
        background: "#000", color: "#fff", textAlign: "center",
        fontWeight: "bold", fontSize: 11, padding: "4px 8px",
        margin: "4px 0", letterSpacing: 1,
      }}>
        {form.thankYouLine || "THANK YOU COME AGAIN !!!"}
      </div>
      <div style={{ textAlign: "center", fontSize: 9, whiteSpace: "pre-line" }}>
        {form.poweredByLine || "System By ( ROCS )"}
      </div>
      {form.footerExtraLine && (
        <div style={{ textAlign: "center", fontSize: 9, whiteSpace: "pre-line" }}>
          {form.footerExtraLine}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BillTemplateDesigner() {
  const [branches, setBranches]               = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [form, setForm]                       = useState(defaultFormFromSettings(printHeaderFooterDefaults));
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [notice, setNotice]                   = useState(null);

  const normalizedBranches = useMemo(
    () => branches
      .map((branch) => ({ ...branch, _normalizedId: getBranchId(branch) }))
      .filter((branch) => branch._normalizedId !== null && branch._normalizedId !== undefined && branch._normalizedId !== ""),
    [branches]
  );

  const selectedBranch = useMemo(
    () => normalizedBranches.find((b) => String(b._normalizedId) === String(selectedBranchId)) || null,
    [selectedBranchId, normalizedBranches]
  );

  // Load branches on mount
  useEffect(() => {
    let mounted = true;
    const loadBranches = async () => {
      setLoading(true);
      try {
        const data = await getAllBranches();
        if (!mounted) return;
        const nextBranches = Array.isArray(data) ? data : [];
        setBranches(nextBranches);

        const firstSelectable = nextBranches.find((b) => getBranchId(b) !== null && getBranchId(b) !== undefined && getBranchId(b) !== "");
        if (!selectedBranchId && firstSelectable) {
          setSelectedBranchId(String(getBranchId(firstSelectable)));
        }
      } catch {
        if (!mounted) return;
        setBranches([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadBranches();
    return () => { mounted = false; };
  }, []);

  // Load settings when branch changes
  useEffect(() => {
    const loadScopeSettings = async () => {
      if (!selectedBranchId) return;
      const branchObj = normalizedBranches.find((b) => String(b._normalizedId) === String(selectedBranchId));
      if (!branchObj) return;
      const settings = await fetchBranchPrintHeaderFooterSettings(branchObj);
      setForm(defaultFormFromSettings(settings));
    };
    loadScopeSettings();
  }, [selectedBranchId, normalizedBranches]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const saveSettings = async () => {
    if (!selectedBranch) {
      setNotice({ type: "error", text: "Please select a branch." });
      return;
    }
    setSaving(true);
    try {
      const payload = mapFormToSettings(form);
      await saveBranchPrintHeaderFooterSettingsRemote(selectedBranch, payload);
      setNotice({ type: "success", text: "Print header/footer saved successfully." });
    } catch {
      setNotice({ type: "error", text: "Failed to save print settings." });
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const resetCurrent = async () => {
    if (!selectedBranch) return;
    await clearBranchPrintHeaderFooterSettingsRemote(selectedBranch);
    const settings = await fetchBranchPrintHeaderFooterSettings(selectedBranch);
    setForm(defaultFormFromSettings(settings));
    setNotice({ type: "success", text: "Branch override removed. Global default now applies." });
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Print Header &amp; Footer Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure receipt header and footer lines for real-world branch-wise printing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetCurrent}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset Current
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-70 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* ── Notice ── */}
      {notice && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {notice.type === "success"
            ? <CheckCircle className="w-4 h-4" />
            : <ShieldAlert className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Form ── */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 space-y-5">

          {/* Branch selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Branch Scope</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={loading}
              >
                <option value="" key="__select_placeholder">Select a branch</option>
                {normalizedBranches.map((branch, idx) => (
                  <option key={`branch-${branch._normalizedId}-${idx}`} value={String(branch._normalizedId)}>{getBranchName(branch)}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Settings are saved per branch and loaded from backend permanently.
            </p>
          </div>

          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Header: Business Name</label>
              <textarea
                value={form.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder={"SILVERLINE SUPER\n& MOBILE"}
                rows={2}
              />
              <p className="text-xs text-slate-400">Use Enter / ↵ to break into multiple lines</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Header: Branch Line</label>
              <input
                value={form.branchLine}
                onChange={(e) => setField("branchLine", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder="Colombo Branch"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Header: Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="No 24, Kandy Road, Mawathagama"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Header: Contact Number</label>
            <textarea
              value={form.contact}
              onChange={(e) => setField("contact", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder={"TEL : 037 7824631 / 0776818151\n      077 8631 631"}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Header: Extra Line <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              value={form.headerExtraLine}
              onChange={(e) => setField("headerExtraLine", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="VAT No: 123456789"
              rows={2}
            />
          </div>

          <hr className="border-slate-200" />

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Footer: Policy Line</label>
            <textarea
              value={form.policyLine}
              onChange={(e) => setField("policyLine", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="NO EXCHANGE ARE POSSIBLE."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Footer: Thank You Line</label>
            <textarea
              value={form.thankYouLine}
              onChange={(e) => setField("thankYouLine", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="THANK YOU COME AGAIN !!!"
              rows={2}
            />
            <p className="text-xs text-slate-400">This line will be printed with a bold inverted (black) background.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Footer: Powered By</label>
              <textarea
                value={form.poweredByLine}
                onChange={(e) => setField("poweredByLine", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder={"System By ( ROCS )\n0776 776 396"}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Footer: Extra Line <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea
                value={form.footerExtraLine}
                onChange={(e) => setField("footerExtraLine", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder="Hotline: 0763731831"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* ── Live Preview ── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Live Preview
          </h2>
          <div className="overflow-y-auto max-h-[780px]">
            <ReceiptPreview form={form} selectedBranch={selectedBranch} />
          </div>
        </div>

      </div>
    </div>
  );
}
