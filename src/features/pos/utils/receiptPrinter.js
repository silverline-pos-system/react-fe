/**
 * POS Receipt Printer
 *
 * Uses admin-configured header/footer settings (global or branch-level overrides)
 * and prints 80mm thermal receipts styled to match the Silverline Super format.
 */

import { resolvePrintHeaderFooterForBranchRemote } from "@/features/admin/services/printHeaderFooterService";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatQty = (value) =>
  Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
};

const multilineHtml = (text) => escapeHtml(text || "").replace(/\n/g, "<br />");

const openPrintWindow = (html, title = "Print") => {
  const printWindow = window.open("", "_blank", "width=380,height=700");
  if (!printWindow) {
    alert("Popup blocked. Please allow popups to print.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;
  printWindow.focus();
  printWindow.print();
};

const getHeaderFooter = async (branchInfo) => {
  const settings = await resolvePrintHeaderFooterForBranchRemote(branchInfo);
  const branchName = branchInfo?.name || branchInfo?.branchName || "";

  const header = {
    businessName: settings?.header?.businessName || "Silverline",
    branchLine: settings?.header?.branchLine || branchName,
    address: settings?.header?.address || branchInfo?.address || "",
    contact: settings?.header?.contact || branchInfo?.phone || "",
    extraLine: settings?.header?.extraLine || "",
  };

  const footer = {
    thankYouLine: settings?.footer?.thankYouLine || "THANK YOU COME AGAIN !!!",
    policyLine: settings?.footer?.policyLine || "NO EXCHANGE ARE POSSIBLE.",
    poweredByLine: settings?.footer?.poweredByLine || "System By ( ROCS )",
    extraLine: settings?.footer?.extraLine || "",
  };

  return { header, footer };
};

// ─── CSS ─────────────────────────────────────────────────────────────────────

const buildBaseCss = () => `
  @page { size: 80mm auto; margin: 2mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.45;
    color: #000;
    width: 76mm;
    margin: 0 auto;
    padding: 4px 2px;
  }
  .center { text-align: center; }
  .right  { text-align: right; }
  .bold   { font-weight: bold; }
  .divider        { border: none; border-top: 1px dashed #666; margin: 4px 0; }
  .solid-divider  { border: none; border-top: 1px solid #000;  margin: 3px 0; }
  .double-divider { border: none; border-top: 2px solid #000;  margin: 4px 0; }

  /* Header */
  .original-bill { font-size: 9px; letter-spacing: 2px; color: #444; margin-bottom: 2px; }
  .store-name    { font-size: 16px; font-weight: bold; letter-spacing: 0.5px; line-height: 1.2; }

  /* Items */
  table { width: 100%; border-collapse: collapse; }
  td, th { vertical-align: top; padding: 0 1px; }
  .items-table { table-layout: fixed; }
  .items-table th { font-size: 11px; font-weight: bold; padding-bottom: 2px; }
  .items-table .col-orig  { width: 22%; font-size: 10px; }
  .items-table .col-disc  { width: 12%; font-size: 10px; text-align: right; }
  .items-table .col-price { width: 22%; font-size: 10px; text-align: right; }
  .items-table .col-qty   { width: 14%; font-size: 10px; text-align: right; }
  .items-table .col-amt   { width: 30%; font-size: 10px; text-align: right; }

  /* Totals */
  .total-section td { font-size: 13px; font-weight: bold; padding: 2px 0; }

  /* Discount box */
  .discount-box {
    border: 1px solid #000;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 6px;
    margin: 5px 0;
  }

  /* Thank-you inverted box */
  .thank-you-box {
    background: #000;
    color: #fff;
    text-align: center;
    font-weight: bold;
    font-size: 12px;
    padding: 4px 8px;
    margin: 5px 0;
    letter-spacing: 1px;
  }

  /* Footer text */
  .footer-text { font-size: 10px; color: #333; text-align: center; white-space: pre-line; margin: 2px 0; }

  /* Admin docs */
  .invoice-no { font-size: 14px; font-weight: bold; }
  .total-row td   { font-size: 15px; font-weight: bold; padding: 3px 0; }
  .change-row td  { font-size: 16px; font-weight: bold; padding: 3px 0; }
  .shift-section td { font-size: 11px; padding: 2px 0; }
  .signature-area { margin-top: 20px; border-bottom: 1px solid #000; height: 20px; margin-bottom: 5px; }
`;

// ─── Header builder ───────────────────────────────────────────────────────────

/** Shared header for every receipt – "ORIGINAL BILL" label + store info */
const buildHeaderHtml = (header) => `
  <div class="center">
    <div class="original-bill">ORIGINAL BILL</div>
    <div class="store-name">${multilineHtml(escapeHtml(header.businessName))}</div>
    ${header.branchLine ? `<div style="font-size:11px;white-space:pre-line;">${multilineHtml(header.branchLine)}</div>` : ""}
    ${header.address    ? `<div style="font-size:10px;white-space:pre-line;">${multilineHtml(header.address)}</div>`    : ""}
    ${header.contact    ? `<div style="font-size:10px;white-space:pre-line;">${multilineHtml(header.contact)}</div>`    : ""}
    ${header.extraLine  ? `<div style="font-size:10px;white-space:pre-line;">${multilineHtml(header.extraLine)}</div>`  : ""}
  </div>
`;

// ─── Footer builder ───────────────────────────────────────────────────────────

/** Shared footer for every receipt – policy → inverted THANK YOU box → powered by */
const buildFooterHtml = (footer) => `
  <div style="margin-top:6px;">
    ${footer.policyLine    ? `<div class="footer-text">${multilineHtml(footer.policyLine)}</div>`    : ""}
    ${footer.thankYouLine  ? `<div class="thank-you-box">${escapeHtml(footer.thankYouLine)}</div>`   : ""}
    ${footer.poweredByLine ? `<div class="footer-text">${multilineHtml(footer.poweredByLine)}</div>` : ""}
    ${footer.extraLine     ? `<div class="footer-text">${multilineHtml(footer.extraLine)}</div>`     : ""}
  </div>
`;

// Footer for non-repair receipts: removes thank you and policy, but ensures powered by and extra line always show
const getNonRepairFooter = (footer) => ({
  thankYouLine: footer.thankYouLine || "",
  policyLine: footer.policyLine || "",
  poweredByLine: footer.poweredByLine || "System By ( ROCS )",
  extraLine: footer.extraLine || "",
});

// ─── Sales Receipt ────────────────────────────────────────────────────────────

export async function printReceiptPDF({
  invoiceId,
  branchInfo,
  cashierName,
  customer,
  cart,
  totals,
  payments,
  paidAmount,
  changeAmount,
  billDiscount = 0,
  unitNo = 1,
}) {
  try {
    const now = formatDate(new Date());
    const { header, footer } = await getHeaderFooter(branchInfo);
    const nonRepairFooter = getNonRepairFooter(footer);

    const totalQty   = totals?.totalQty ?? (cart || []).reduce((s, i) => s + Number(i.qty || 0), 0);
    const totalItems = (cart || []).length;

    // ── Item rows ──────────────────────────────────────────────────────────────
    const itemRows = (cart || [])
      .map((item, idx) => {
        const basePrice      = Number(item.price    || 0);
        const discountPerUnit = Number(item.discount || 0);
        const sellingPrice   = basePrice - discountPerUnit;
        const qty            = Number(item.qty      || 0);
        const lineTotal      = sellingPrice * qty;

        return `
          <tr>
            <td colspan="5" style="padding-top:4px;font-weight:600;font-size:11px;">
              ${idx + 1}) ${escapeHtml(item.name || "Item")}
            </td>
          </tr>
          <tr style="padding-bottom:4px;">
            <td class="col-orig">${formatMoney(basePrice)}</td>
            <td class="col-disc">${discountPerUnit > 0 ? formatMoney(discountPerUnit) : ""}</td>
            <td class="col-price">${formatMoney(sellingPrice)}&nbsp;*</td>
            <td class="col-qty">${formatQty(qty)}</td>
            <td class="col-amt" style="font-weight:600;">${formatMoney(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    // ── Payment rows ───────────────────────────────────────────────────────────
    const paymentRows =
      payments && payments.length > 0
        ? payments
            .map(
              (p) => `
              <tr>
                <td style="padding:2px 0;font-weight:bold;">${escapeHtml(p.paymentType || "CASH")}</td>
                <td style="text-align:right;padding:2px 0;font-weight:bold;">${formatMoney(p.amount)}</td>
              </tr>`
            )
            .join("")
        : `<tr>
            <td style="padding:2px 0;font-weight:bold;">CASH</td>
            <td style="text-align:right;padding:2px 0;font-weight:bold;">${formatMoney(paidAmount)}</td>
          </tr>`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Receipt - ${escapeHtml(invoiceId || "SALE")}</title>
        <style>${buildBaseCss()}</style>
      </head>
      <body>

        ${buildHeaderHtml(header)}

        <hr class="solid-divider" />

        <!-- Bill Meta -->
        <table style="font-size:10px;">
          <tr>
            <td>Bill No &nbsp;: ${escapeHtml(invoiceId || "N/A")}</td>
            <td style="text-align:right;">Unit No &nbsp;: ${escapeHtml(String(unitNo))}</td>
          </tr>
          <tr>
            <td>CASHIER &nbsp;: ${escapeHtml(cashierName || "--")}</td>
            <td style="text-align:right;"></td>
          </tr>
        </table>

        ${customer
          ? `<hr class="divider" />
             <div class="center" style="font-size:11px;">
               <div class="bold">${escapeHtml(customer.name || "")}</div>
               ${customer.phone ? `<div>${escapeHtml(customer.phone)}</div>` : ""}
             </div>`
          : ""
        }

        <hr class="solid-divider" />

        <!-- Items -->
        <table class="items-table">
          <thead>
            <tr style="border-bottom:1px solid #000;">
              <th class="col-orig" style="text-align:left;">Item</th>
              <th class="col-disc">%</th>
              <th class="col-price">Price</th>
              <th class="col-qty">Qty</th>
              <th class="col-amt">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <hr class="solid-divider" />

        <!-- Net Total -->
        <table class="total-section">
          <tr>
            <td>NET TOTAL</td>
            <td style="text-align:right;">${formatMoney(totals?.netTotal)}</td>
          </tr>
        </table>

        <hr class="solid-divider" />

        <!-- Cash / Balance -->
        <table class="total-section">
          ${paymentRows}
          <tr>
            <td>BALANCE</td>
            <td style="text-align:right;">${formatMoney(changeAmount)}</td>
          </tr>
        </table>

        <hr class="solid-divider" />

        <!-- Time / Piece count -->
        <table style="font-size:10px;margin-top:2px;">
          <tr>
            <td>Date & Time</td>
            <td style="text-align:right;">No Of Pieces : ${formatQty(totalQty)}</td>
          </tr>
          <tr>
            <td style="font-size:9px;">${escapeHtml(now)}</td>
            <td style="text-align:right;">No Of Items &nbsp;&nbsp;: ${totalItems}</td>
          </tr>
        </table>

        ${(billDiscount || totals?.billDiscountAmount || 0) > 0
          ? `<div class="discount-box">Your Discount For Bill ${formatMoney(billDiscount || totals?.billDiscountAmount)}</div>`
          : ""}

        ${buildFooterHtml(nonRepairFooter)}

      </body>
      </html>
    `;

    openPrintWindow(html, "Receipt");
  } catch (error) {
    console.error("Error printing receipt:", error);
    alert("Failed to print receipt. Please try again.");
  }
}

// ─── Mobile Repair Receipt ────────────────────────────────────────────────────

export async function printMobileRepairReceipt({ repair, branchInfo, cashierName }) {
  try {
    const now = formatDate(new Date());
    const { header, footer } = await getHeaderFooter(branchInfo);

    const repairNo = repair?.repairNo
      || (repair?.repairId ? `REP-${String(repair.repairId).padStart(6, "0")}` : "N/A");
    const advancePayment = Number(repair?.advancePayment || 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Repair Intake - ${escapeHtml(repairNo)}</title>
        <style>${buildBaseCss()}</style>
      </head>
      <body>
        ${buildHeaderHtml(header)}

        <hr class="solid-divider" />

        <div class="center">
          <div class="invoice-no">MOBILE REPAIR</div>
          <div style="font-size:12px;font-weight:bold;">${escapeHtml(repairNo)}</div>
          <div style="font-size:10px;">Received by: ${escapeHtml(cashierName || "--")}</div>
          <div style="font-size:10px;">${escapeHtml(now)}</div>
        </div>

        <hr class="solid-divider" />

        <table>
          <tr><td class="bold">Customer</td><td style="text-align:right;">${escapeHtml(repair?.customerName || "Walk-in")}</td></tr>
          <tr><td class="bold">Phone</td>   <td style="text-align:right;">${escapeHtml(repair?.customerPhone || repair?.contactNo || "-")}</td></tr>
          <tr><td class="bold">Device</td>  <td style="text-align:right;">${escapeHtml(`${repair?.deviceBrand || "-"} ${repair?.deviceModel || ""}`.trim())}</td></tr>
          <tr><td class="bold">IMEI</td>    <td style="text-align:right;">${escapeHtml(repair?.imeiNo || "N/A")}</td></tr>
          <tr><td class="bold">Status</td>  <td style="text-align:right;">${escapeHtml((repair?.status || "RECEIVED").replace(/_/g, " "))}</td></tr>
        </table>

        <hr class="solid-divider" />

        <div class="bold" style="margin-bottom:4px;">Issue Description</div>
        <div style="font-size:11px;white-space:pre-line;">${multilineHtml(repair?.problemDescription || "-")}</div>

        <hr class="solid-divider" />

        <table>
          <tr><td class="bold">Advance Paid</td>    <td style="text-align:right;">LKR ${formatMoney(advancePayment)}</td></tr>
          ${advancePayment > 0 ? `<tr><td class="bold">Payment Method</td>  <td style="text-align:right;">${escapeHtml(repair?.paymentMethod || "CASH")}</td></tr>` : ""}
        </table>

        <hr class="solid-divider" />
        ${buildFooterHtml(footer)}
      </body>
      </html>
    `;

    openPrintWindow(html, "Mobile Repair Receipt");
  } catch (error) {
    console.error("Error printing mobile repair receipt:", error);
    alert("Failed to print receipt. Please try again.");
  }
}

// ─── Shift Summary ────────────────────────────────────────────────────────────

export async function printShiftSummary({
  cashierName,
  shiftId,
  shiftTotals = {},
  closingCash = 0,
  denominations = [],
  branchInfo,
}) {
  try {
    const now = formatDate(new Date());
    const { header, footer } = await getHeaderFooter(branchInfo);
    const nonRepairFooter = getNonRepairFooter(footer);
    const systemCash = Number(shiftTotals.expectedCash || 0);
    const variance   = Number(closingCash || 0) - systemCash;

    const denomRows =
      (denominations || []).length
        ? denominations
            .map(
              (d) => `
              <tr>
                <td style="padding:2px 0;">${Number(d.denominationValue || 0).toLocaleString()}</td>
                <td style="text-align:center;padding:2px 0;">x ${Number(d.quantity || 0)}</td>
                <td style="text-align:right;padding:2px 0;">${formatMoney(Number(d.denominationValue || 0) * Number(d.quantity || 0))}</td>
              </tr>`
            )
            .join("")
        : '<tr><td colspan="3" style="text-align:center;color:#999;padding:4px 0;">No denomination data</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Shift Summary - #${escapeHtml(shiftId || "")}</title>
        <style>${buildBaseCss()}</style>
      </head>
      <body>
        ${buildHeaderHtml(header)}

        <hr class="solid-divider" />

        <div class="center bold">SHIFT SUMMARY REPORT</div>
        <div class="center" style="font-size:11px;">Shift #${escapeHtml(shiftId || "-")}</div>
        <div class="center" style="font-size:10px;">${escapeHtml(now)}</div>

        <hr class="solid-divider" />

        <table class="shift-section">
          <tr><td class="bold">Cashier</td>      <td style="text-align:right;">${escapeHtml(cashierName || "--")}</td></tr>
          <tr><td>Transactions</td>               <td style="text-align:right;">${Number(shiftTotals.transactionCount || 0)}</td></tr>
        </table>

        <hr class="solid-divider" />

        <table class="shift-section">
          <tr><td>Cash Sales</td>  <td style="text-align:right;">${formatMoney(shiftTotals.cashSales)}</td></tr>
          <tr><td>Card Sales</td>  <td style="text-align:right;">${formatMoney(shiftTotals.cardTotal)}</td></tr>
          <tr><td>QR / Other</td>  <td style="text-align:right;">${formatMoney(shiftTotals.otherPayments)}</td></tr>
        </table>

        <hr class="solid-divider" />

        <table class="shift-section">
          <tr><td>Opening Float</td>  <td style="text-align:right;">${formatMoney(shiftTotals.openingFloat || shiftTotals.openingCash)}</td></tr>
          <tr><td>Total Sales</td>    <td style="text-align:right;">+${formatMoney(shiftTotals.totalSales)}</td></tr>
          <tr><td>Total Returns</td>  <td style="text-align:right;">-${formatMoney(shiftTotals.totalReturns)}</td></tr>
          <tr><td>Paid In</td>        <td style="text-align:right;">+${formatMoney(shiftTotals.paidIn || shiftTotals.totalPaidIn)}</td></tr>
          <tr><td>Paid Out</td>       <td style="text-align:right;">-${formatMoney(shiftTotals.paidOut || shiftTotals.totalPaidOut)}</td></tr>
        </table>

        <hr class="solid-divider" />

        <table>
          <tr class="total-row">
            <td>Expected Cash</td>
            <td style="text-align:right;">LKR ${formatMoney(systemCash)}</td>
          </tr>
        </table>

        <hr class="solid-divider" />

        <table>
          <tr style="font-weight:bold;border-bottom:1px solid #000;">
            <td>Denom</td><td style="text-align:center;">Qty</td><td style="text-align:right;">Amount</td>
          </tr>
          ${denomRows}
        </table>

        <hr class="solid-divider" />

        <table>
          <tr class="total-row">
            <td>Declared Cash</td>
            <td style="text-align:right;">LKR ${formatMoney(closingCash)}</td>
          </tr>
          <tr>
            <td class="bold">Variance</td>
            <td style="text-align:right;" class="bold">${variance >= 0 ? "+" : "-"} ${formatMoney(Math.abs(variance))}</td>
          </tr>
        </table>

        <hr class="solid-divider" />
        ${buildFooterHtml(nonRepairFooter)}
      </body>
      </html>
    `;

    openPrintWindow(html, "Shift Summary");
  } catch (error) {
    console.error("Error printing shift summary:", error);
    alert("Failed to print shift summary. Please try again.");
  }
}

// ─── Pay In / Pay Out Receipt ─────────────────────────────────────────────────

export async function printPayInOutReceipt({ type, amount, reason, cashierName, branchInfo, timestamp }) {
  try {
    const isPayIn  = type === "PAY_IN"  || type === "PAID_IN";
    const now      = timestamp ? formatDate(new Date(timestamp)) : formatDate(new Date());
    const { header, footer } = await getHeaderFooter(branchInfo);
    const payInOutFooter = getNonRepairFooter(footer);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>${isPayIn ? "Pay In" : "Pay Out"} Receipt</title>
        <style>
          ${buildBaseCss()}
          .signature-area { margin-top:20px; border-bottom:1px solid #000; height:20px; margin-bottom:5px; }
        </style>
      </head>
      <body>
        ${buildHeaderHtml(header)}

        <hr class="solid-divider" />
        <div class="center bold" style="font-size:14px;">${isPayIn ? "CASH PAY-IN" : "CASH PAY-OUT"}</div>
        <hr class="solid-divider" />

        <div>Date: ${escapeHtml(now)}</div>
        <div>Cashier: ${escapeHtml(cashierName || "--")}</div>
        <div style="margin-bottom:10px;font-size:18px;font-weight:700;">Amount: ${formatMoney(amount)}</div>
        <div>Reason: ${escapeHtml(reason || "N/A")}</div>

        <hr class="solid-divider" />

        <div style="margin-top:15px;">Cashier Signature:</div>
        <div class="signature-area"></div>
        ${!isPayIn ? '<div style="margin-top:10px;">Carrier Signature:</div><div class="signature-area"></div>' : ""}

        <hr class="solid-divider" />
        ${buildFooterHtml(payInOutFooter)}
      </body>
      </html>
    `;

    openPrintWindow(html, isPayIn ? "Pay In Receipt" : "Pay Out Receipt");
  } catch (error) {
    console.error("Error printing pay in/out receipt:", error);
    alert("Failed to print receipt. Please try again.");
  }
}

export async function printSupplierPaymentReceipt({
  poNumber,
  supplierName,
  amount,
  paymentMethod,
  paymentReference,
  notes,
  cashierName,
  supervisorName,
  branchInfo,
  timestamp,
}) {
  try {
    const now = timestamp ? formatDate(new Date(timestamp)) : formatDate(new Date());
    const { header, footer } = await getHeaderFooter(branchInfo);
    const supplierPaymentFooter = getNonRepairFooter(footer);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Supplier Payment Receipt</title>
        <style>${buildBaseCss()}</style>
      </head>
      <body>
        ${buildHeaderHtml(header)}

        <hr class="solid-divider" />
        <div class="center bold" style="font-size:14px;">SUPPLIER PAYMENT RECEIPT</div>
        <hr class="solid-divider" />

        <table style="font-size:11px;">
          <tr><td style="padding:2px 0;">PO Number</td><td style="text-align:right;padding:2px 0;">${escapeHtml(poNumber || "-")}</td></tr>
          <tr><td style="padding:2px 0;">Supplier</td><td style="text-align:right;padding:2px 0;">${escapeHtml(supplierName || "-")}</td></tr>
          <tr><td style="padding:2px 0;">Date/Time</td><td style="text-align:right;padding:2px 0;">${escapeHtml(now)}</td></tr>
          <tr><td style="padding:2px 0;">Cashier</td><td style="text-align:right;padding:2px 0;">${escapeHtml(cashierName || "-")}</td></tr>
          <tr><td style="padding:2px 0;">Authorized By</td><td style="text-align:right;padding:2px 0;">${escapeHtml(supervisorName || "-")}</td></tr>
          <tr><td style="padding:2px 0;">Payment Method</td><td style="text-align:right;padding:2px 0;">${escapeHtml(paymentMethod || "CASH")}</td></tr>
          ${paymentReference ? `<tr><td style="padding:2px 0;">Reference</td><td style="text-align:right;padding:2px 0;">${escapeHtml(paymentReference)}</td></tr>` : ""}
        </table>

        <hr class="solid-divider" />
        <div class="bold" style="font-size:18px;text-align:right;">Amount: LKR ${formatMoney(amount)}</div>

        ${notes ? `<div style="margin-top:8px;font-size:11px;"><span class="bold">Notes:</span><br/>${multilineHtml(notes)}</div>` : ""}

        <div style="margin-top:15px;">Cashier Signature:</div>
        <div class="signature-area"></div>

        <hr class="solid-divider" />
        ${buildFooterHtml(supplierPaymentFooter)}
      </body>
      </html>
    `;

    openPrintWindow(html, "Supplier Payment Receipt");
  } catch (error) {
    console.error("Error printing supplier payment receipt:", error);
    alert("Supplier payment was processed, but receipt printing failed.");
  }
}
