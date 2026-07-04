import{e as Ne,j as e}from"./index-BiZbTsXT.js";import{r as h}from"./react-aOV2nmk6.js";import{u as je}from"./useEscapeClose-CdczM5ae.js";import{s as ie}from"./servicesService-DQEOkMkc.js";import{W as ne,X as we,u as V,l as Z,U as ee,b0 as te,aD as se,P as $e,B as Se,h as Re,j as oe,g as De,r as Pe,a7 as Ce}from"./icons-FJMWhpad.js";const pe="print_header_footer_settings_v1",Ie="/v1/admin/print-settings/header-footer",k={header:{businessName:"Silverline",branchLine:"",address:"",contact:"",extraLine:""},footer:{thankYouLine:"Thank you for your purchase!",policyLine:"Goods sold are not refundable without receipt.",poweredByLine:"*** Powered by ROCS ***",extraLine:""}};function Ae(t,a){try{return JSON.parse(t)}catch{return a}}function he(t){if(!t)return"global";const a=t.id||t.branchId||t.branch_id;if(a!=null&&a!=="")return`branch:${a}`;const r=String(t.name||t.branchName||"").trim().toLowerCase();return r?`name:${r}`:"global"}function Le(){try{const t=localStorage.getItem("user"),a=t?JSON.parse(t):null;return a?.branchId??a?.branch_id??null}catch{return null}}function ue(t){return t?.id??t?.branchId??t?.branch_id??Le()}function ae(){const t=localStorage.getItem(pe),a=Ae(t,null);return!a||typeof a!="object"?{global:{...k},branches:{},updatedAt:new Date().toISOString()}:{global:{...k,...a.global||{},header:{...k.header,...a.global?.header||{}},footer:{...k.footer,...a.global?.footer||{}}},branches:a.branches||{},updatedAt:a.updatedAt||new Date().toISOString()}}function de(t){localStorage.setItem(pe,JSON.stringify({...t,updatedAt:new Date().toISOString()}))}function ge(){return ae().global}function X(t){const a=ae(),r=he(t),i=a.branches[r];return i?{header:{...a.global.header,...i.header||{}},footer:{...a.global.footer,...i.footer||{}}}:a.global}function be(t){const a=t?.data||t||{};return{header:{...k.header,...a.header||{}},footer:{...k.footer,...a.footer||{}}}}function Ee(t,a){const r=ae(),i=he(t),m=be(a);return i==="global"?(de({...r,global:m}),m):(de({...r,branches:{...r.branches,[i]:{header:{...r.global.header,...m.header||{}},footer:{...r.global.footer,...m.footer||{}}}}}),m)}async function Fe(t){const a=ue(t);if(!a)return ge();try{const r=await Ne.get(Ie,{params:{branchId:a},validateStatus:i=>i<500});if(r.status===200){const i=be(r.data);return Ee(t,i),X(t)}return r.status===403||r.status===404,X(t)}catch{return X(t)}}async function ze(t){const a=ue(t);return a?Fe({...t||{},branchId:a}):ge()}const x=t=>Number(t||0).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2}),ce=t=>Number(t||0).toLocaleString("en-LK",{minimumFractionDigits:2,maximumFractionDigits:2}),A=t=>(t instanceof Date?t:new Date(t)).toLocaleString("en-US",{year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0}),l=t=>{const a=document.createElement("div");return a.textContent=t??"",a.innerHTML},R=t=>l(t||"").replace(/\n/g,"<br />"),B=(t,a="Print")=>{const r=window.open("","_blank","width=380,height=700");if(!r){alert("Popup blocked. Please allow popups to print.");return}r.document.write(t),r.document.close(),r.document.title=a,r.focus(),r.print()},T=async t=>{const a=await ze(t),r=t?.name||t?.branchName||"",i={businessName:a?.header?.businessName||"Silverline",branchLine:a?.header?.branchLine||r,address:a?.header?.address||t?.address||"",contact:a?.header?.contact||t?.phone||"",extraLine:a?.header?.extraLine||""},m={thankYouLine:a?.footer?.thankYouLine||"THANK YOU COME AGAIN !!!",policyLine:a?.footer?.policyLine||"NO EXCHANGE ARE POSSIBLE.",poweredByLine:a?.footer?.poweredByLine||"System By ( ROCS )",extraLine:a?.footer?.extraLine||""};return{header:i,footer:m}},_=()=>`
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
`,Y=t=>`
  <div class="center">
    <div class="original-bill">ORIGINAL BILL</div>
    <div class="store-name">${R(l(t.businessName))}</div>
    ${t.branchLine?`<div style="font-size:11px;white-space:pre-line;">${R(t.branchLine)}</div>`:""}
    ${t.address?`<div style="font-size:10px;white-space:pre-line;">${R(t.address)}</div>`:""}
    ${t.contact?`<div style="font-size:10px;white-space:pre-line;">${R(t.contact)}</div>`:""}
    ${t.extraLine?`<div style="font-size:10px;white-space:pre-line;">${R(t.extraLine)}</div>`:""}
  </div>
`,K=t=>`
  <div style="margin-top:6px;">
    ${t.policyLine?`<div class="footer-text">${R(t.policyLine)}</div>`:""}
    ${t.thankYouLine?`<div class="thank-you-box">${l(t.thankYouLine)}</div>`:""}
    ${t.poweredByLine?`<div class="footer-text">${R(t.poweredByLine)}</div>`:""}
    ${t.extraLine?`<div class="footer-text">${R(t.extraLine)}</div>`:""}
  </div>
`,Q=t=>({thankYouLine:"",policyLine:"",poweredByLine:t.poweredByLine||"System By ( ROCS )",extraLine:t.extraLine||""});async function He({invoiceId:t,branchInfo:a,cashierName:r,customer:i,cart:m,totals:u,payments:p,paidAmount:y,changeAmount:v,billDiscount:N=0,unitNo:b=1}){try{const f=A(new Date),{header:P,footer:C}=await T(a),w=Q(C),D=u?.totalQty??(m||[]).reduce((j,S)=>j+Number(S.qty||0),0),H=(m||[]).length,n=(m||[]).map((j,S)=>{const G=Number(j.price||0),I=Number(j.discount||0),O=G-I,L=Number(j.qty||0),q=O*L;return`
          <tr>
            <td colspan="5" style="padding-top:4px;font-weight:600;font-size:11px;">
              ${S+1}) ${l(j.name||"Item")}
            </td>
          </tr>
          <tr style="padding-bottom:4px;">
            <td class="col-orig">${x(G)}</td>
            <td class="col-disc">${I>0?x(I):""}</td>
            <td class="col-price">${x(O)}&nbsp;*</td>
            <td class="col-qty">${ce(L)}</td>
            <td class="col-amt" style="font-weight:600;">${x(q)}</td>
          </tr>
        `}).join(""),$=p&&p.length>0?p.map(j=>`
              <tr>
                <td style="padding:2px 0;font-weight:bold;">${l(j.paymentType||"CASH")}</td>
                <td style="text-align:right;padding:2px 0;font-weight:bold;">${x(j.amount)}</td>
              </tr>`).join(""):`<tr>
            <td style="padding:2px 0;font-weight:bold;">CASH</td>
            <td style="text-align:right;padding:2px 0;font-weight:bold;">${x(y)}</td>
          </tr>`,U=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Receipt - ${l(t||"SALE")}</title>
        <style>${_()}</style>
      </head>
      <body>

        ${Y(P)}

        <hr class="solid-divider" />

        <!-- Bill Meta -->
        <table style="font-size:10px;">
          <tr>
            <td>Bill No &nbsp;: ${l(t||"N/A")}</td>
            <td style="text-align:right;">Unit No &nbsp;: ${l(String(b))}</td>
          </tr>
          <tr>
            <td></td>
            <td style="text-align:right;">CASHIER &nbsp;: ${l(r||"--")}</td>
          </tr>
        </table>

        ${i?`<hr class="divider" />
             <div class="center" style="font-size:11px;">
               <div class="bold">${l(i.name||"")}</div>
               ${i.phone?`<div>${l(i.phone)}</div>`:""}
             </div>`:""}

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
          <tbody>${n}</tbody>
        </table>

        <hr class="solid-divider" />

        <!-- Net Total -->
        <table class="total-section">
          <tr>
            <td>NET TOTAL</td>
            <td style="text-align:right;">${x(u?.netTotal)}</td>
          </tr>
        </table>

        <hr class="solid-divider" />

        <!-- Cash / Balance -->
        <table class="total-section">
          ${$}
          <tr>
            <td>BALANCE</td>
            <td style="text-align:right;">${x(v)}</td>
          </tr>
        </table>

        <hr class="solid-divider" />

        <!-- Time / Piece count -->
        <table style="font-size:10px;margin-top:2px;">
          <tr>
            <td>Date & Time</td>
            <td style="text-align:right;">No Of Pieces : ${ce(D)}</td>
          </tr>
          <tr>
            <td style="font-size:9px;">${l(f)}</td>
            <td style="text-align:right;">No Of Items &nbsp;&nbsp;: ${H}</td>
          </tr>
        </table>

        ${(N||u?.billDiscountAmount||0)>0?`<div class="discount-box">Your Discount For Bill ${x(N||u?.billDiscountAmount)}</div>`:""}

        ${K(w)}

      </body>
      </html>
    `;B(U,"Receipt")}catch(f){console.error("Error printing receipt:",f),alert("Failed to print receipt. Please try again.")}}async function ke({repair:t,branchInfo:a,cashierName:r}){try{const i=A(new Date),{header:m,footer:u}=await T(a),p=t?.repairNo||(t?.repairId?`REP-${String(t.repairId).padStart(6,"0")}`:"N/A"),y=Number(t?.advancePayment||0),v=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Repair Intake - ${l(p)}</title>
        <style>${_()}</style>
      </head>
      <body>
        ${Y(m)}

        <hr class="solid-divider" />

        <div class="center">
          <div class="invoice-no">MOBILE REPAIR</div>
          <div style="font-size:12px;font-weight:bold;">${l(p)}</div>
          <div style="font-size:10px;">Received by: ${l(r||"--")}</div>
          <div style="font-size:10px;">${l(i)}</div>
        </div>

        <hr class="solid-divider" />

        <table>
          <tr><td class="bold">Customer</td><td style="text-align:right;">${l(t?.customerName||"Walk-in")}</td></tr>
          <tr><td class="bold">Phone</td>   <td style="text-align:right;">${l(t?.customerPhone||t?.contactNo||"-")}</td></tr>
          <tr><td class="bold">Device</td>  <td style="text-align:right;">${l(`${t?.deviceBrand||"-"} ${t?.deviceModel||""}`.trim())}</td></tr>
          <tr><td class="bold">IMEI</td>    <td style="text-align:right;">${l(t?.imeiNo||"N/A")}</td></tr>
          <tr><td class="bold">Status</td>  <td style="text-align:right;">${l((t?.status||"RECEIVED").replace(/_/g," "))}</td></tr>
        </table>

        <hr class="solid-divider" />

        <div class="bold" style="margin-bottom:4px;">Issue Description</div>
        <div style="font-size:11px;white-space:pre-line;">${R(t?.problemDescription||"-")}</div>

        <hr class="solid-divider" />

        <table>
          <tr><td class="bold">Advance Paid</td>    <td style="text-align:right;">LKR ${x(y)}</td></tr>
          ${y>0?`<tr><td class="bold">Payment Method</td>  <td style="text-align:right;">${l(t?.paymentMethod||"CASH")}</td></tr>`:""}
        </table>

        <hr class="solid-divider" />
        ${K(u)}
      </body>
      </html>
    `;B(v,"Mobile Repair Receipt")}catch(i){console.error("Error printing mobile repair receipt:",i),alert("Failed to print receipt. Please try again.")}}async function Ue({cashierName:t,shiftId:a,shiftTotals:r={},closingCash:i=0,denominations:m=[],branchInfo:u}){try{const p=A(new Date),{header:y,footer:v}=await T(u),N=Q(v),b=Number(r.expectedCash||0),f=Number(i||0)-b,P=(m||[]).length?m.map(w=>`
              <tr>
                <td style="padding:2px 0;">${Number(w.denominationValue||0).toLocaleString()}</td>
                <td style="text-align:center;padding:2px 0;">x ${Number(w.quantity||0)}</td>
                <td style="text-align:right;padding:2px 0;">${x(Number(w.denominationValue||0)*Number(w.quantity||0))}</td>
              </tr>`).join(""):'<tr><td colspan="3" style="text-align:center;color:#999;padding:4px 0;">No denomination data</td></tr>',C=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Shift Summary - #${l(a||"")}</title>
        <style>${_()}</style>
      </head>
      <body>
        ${Y(y)}

        <hr class="solid-divider" />

        <div class="center bold">SHIFT SUMMARY REPORT</div>
        <div class="center" style="font-size:11px;">Shift #${l(a||"-")}</div>
        <div class="center" style="font-size:10px;">${l(p)}</div>

        <hr class="solid-divider" />

        <table class="shift-section">
          <tr><td class="bold">Cashier</td>      <td style="text-align:right;">${l(t||"--")}</td></tr>
          <tr><td>Transactions</td>               <td style="text-align:right;">${Number(r.transactionCount||0)}</td></tr>
        </table>

        <hr class="solid-divider" />

        <table class="shift-section">
          <tr><td>Cash Sales</td>  <td style="text-align:right;">${x(r.cashSales)}</td></tr>
          <tr><td>Card Sales</td>  <td style="text-align:right;">${x(r.cardTotal)}</td></tr>
          <tr><td>QR / Other</td>  <td style="text-align:right;">${x(r.otherPayments)}</td></tr>
        </table>

        <hr class="solid-divider" />

        <table class="shift-section">
          <tr><td>Opening Float</td>  <td style="text-align:right;">${x(r.openingFloat||r.openingCash)}</td></tr>
          <tr><td>Total Sales</td>    <td style="text-align:right;">+${x(r.totalSales)}</td></tr>
          <tr><td>Total Returns</td>  <td style="text-align:right;">-${x(r.totalReturns)}</td></tr>
          <tr><td>Paid In</td>        <td style="text-align:right;">+${x(r.paidIn||r.totalPaidIn)}</td></tr>
          <tr><td>Paid Out</td>       <td style="text-align:right;">-${x(r.paidOut||r.totalPaidOut)}</td></tr>
        </table>

        <hr class="solid-divider" />

        <table>
          <tr class="total-row">
            <td>Expected Cash</td>
            <td style="text-align:right;">LKR ${x(b)}</td>
          </tr>
        </table>

        <hr class="solid-divider" />

        <table>
          <tr style="font-weight:bold;border-bottom:1px solid #000;">
            <td>Denom</td><td style="text-align:center;">Qty</td><td style="text-align:right;">Amount</td>
          </tr>
          ${P}
        </table>

        <hr class="solid-divider" />

        <table>
          <tr class="total-row">
            <td>Declared Cash</td>
            <td style="text-align:right;">LKR ${x(i)}</td>
          </tr>
          <tr>
            <td class="bold">Variance</td>
            <td style="text-align:right;" class="bold">${f>=0?"+":"-"} ${x(Math.abs(f))}</td>
          </tr>
        </table>

        <hr class="solid-divider" />
        ${K(N)}
      </body>
      </html>
    `;B(C,"Shift Summary")}catch(p){console.error("Error printing shift summary:",p),alert("Failed to print shift summary. Please try again.")}}async function Ge({type:t,amount:a,reason:r,cashierName:i,branchInfo:m,timestamp:u}){try{const p=t==="PAY_IN"||t==="PAID_IN",y=A(u?new Date(u):new Date),{header:v,footer:N}=await T(m),b=Q(N),f=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>${p?"Pay In":"Pay Out"} Receipt</title>
        <style>
          ${_()}
          .signature-area { margin-top:20px; border-bottom:1px solid #000; height:20px; margin-bottom:5px; }
        </style>
      </head>
      <body>
        ${Y(v)}

        <hr class="solid-divider" />
        <div class="center bold" style="font-size:14px;">${p?"CASH PAY-IN":"CASH PAY-OUT"}</div>
        <hr class="solid-divider" />

        <div>Date: ${l(y)}</div>
        <div>Cashier: ${l(i||"--")}</div>
        <div style="margin-bottom:10px;font-size:18px;font-weight:700;">Amount: ${x(a)}</div>
        <div>Reason: ${l(r||"N/A")}</div>

        <hr class="solid-divider" />

        <div style="margin-top:15px;">Cashier Signature:</div>
        <div class="signature-area"></div>
        ${p?"":'<div style="margin-top:10px;">Carrier Signature:</div><div class="signature-area"></div>'}

        <hr class="solid-divider" />
        ${K(b)}
      </body>
      </html>
    `;B(f,p?"Pay In Receipt":"Pay Out Receipt")}catch(p){console.error("Error printing pay in/out receipt:",p),alert("Failed to print receipt. Please try again.")}}async function qe({poNumber:t,supplierName:a,amount:r,paymentMethod:i,paymentReference:m,notes:u,cashierName:p,supervisorName:y,branchInfo:v,timestamp:N}){try{const b=A(N?new Date(N):new Date),{header:f,footer:P}=await T(v),C=Q(P),w=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Supplier Payment Receipt</title>
        <style>${_()}</style>
      </head>
      <body>
        ${Y(f)}

        <hr class="solid-divider" />
        <div class="center bold" style="font-size:14px;">SUPPLIER PAYMENT RECEIPT</div>
        <hr class="solid-divider" />

        <table style="font-size:11px;">
          <tr><td style="padding:2px 0;">PO Number</td><td style="text-align:right;padding:2px 0;">${l(t||"-")}</td></tr>
          <tr><td style="padding:2px 0;">Supplier</td><td style="text-align:right;padding:2px 0;">${l(a||"-")}</td></tr>
          <tr><td style="padding:2px 0;">Date/Time</td><td style="text-align:right;padding:2px 0;">${l(b)}</td></tr>
          <tr><td style="padding:2px 0;">Cashier</td><td style="text-align:right;padding:2px 0;">${l(p||"-")}</td></tr>
          <tr><td style="padding:2px 0;">Authorized By</td><td style="text-align:right;padding:2px 0;">${l(y||"-")}</td></tr>
          <tr><td style="padding:2px 0;">Payment Method</td><td style="text-align:right;padding:2px 0;">${l(i||"CASH")}</td></tr>
          ${m?`<tr><td style="padding:2px 0;">Reference</td><td style="text-align:right;padding:2px 0;">${l(m)}</td></tr>`:""}
        </table>

        <hr class="solid-divider" />
        <div class="bold" style="font-size:18px;text-align:right;">Amount: LKR ${x(r)}</div>

        ${u?`<div style="margin-top:8px;font-size:11px;"><span class="bold">Notes:</span><br/>${R(u)}</div>`:""}

        <div style="margin-top:15px;">Cashier Signature:</div>
        <div class="signature-area"></div>

        <hr class="solid-divider" />
        ${K(C)}
      </body>
      </html>
    `;B(w,"Supplier Payment Receipt")}catch(b){console.error("Error printing supplier payment receipt:",b),alert("Supplier payment was processed, but receipt printing failed.")}}const xe={RECEIVED:{bg:"bg-yellow-50",text:"text-yellow-700",border:"border-yellow-200",dot:"bg-yellow-500"},DIAGNOSED:{bg:"bg-orange-50",text:"text-orange-700",border:"border-orange-200",dot:"bg-orange-500"},IN_PROGRESS:{bg:"bg-blue-50",text:"text-blue-700",border:"border-blue-200",dot:"bg-blue-500"},WAITING_APPROVAL:{bg:"bg-purple-50",text:"text-purple-700",border:"border-purple-200",dot:"bg-purple-500"},READY_FOR_PAYMENT:{bg:"bg-emerald-50",text:"text-emerald-700",border:"border-emerald-200",dot:"bg-emerald-500"},PAID:{bg:"bg-green-50",text:"text-green-700",border:"border-green-200",dot:"bg-green-500"},DELIVERED:{bg:"bg-slate-50",text:"text-slate-600",border:"border-slate-200",dot:"bg-slate-400"},CANCELLED:{bg:"bg-red-50",text:"text-red-600",border:"border-red-200",dot:"bg-red-500"}};function me({status:t}){const a=xe[t]||xe.RECEIVED;return e.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${a.bg} ${a.text} border ${a.border}`,children:[e.jsx("span",{className:`w-1.5 h-1.5 rounded-full ${a.dot}`}),(t||"").replace(/_/g," ")]})}function Ve({onClose:t,branchId:a,onNotify:r,onAddToCart:i,enablePrintReceipt:m=!1,branchInfo:u=null,cashierName:p=""}){je(t);const y=h.useRef(null),v=h.useRef(null),N=h.useRef(null),b=h.useRef(null),f=h.useRef(null),P=h.useRef(null),C=h.useRef(null),w=h.useRef(null),[D,H]=h.useState("LOG"),[n,$]=h.useState({customerName:"",contactNo:"",deviceBrand:"",deviceModel:"",imeiNo:"",problemDescription:"",advancePayment:"",paymentMethod:"CASH"}),[U,j]=h.useState(!1),[S,G]=h.useState(""),[I,O]=h.useState([]),[L,q]=h.useState(!1),[d,W]=h.useState(null),[Oe,Me]=h.useState(null),J=h.useRef(null);h.useEffect(()=>{D==="FIND"&&J.current&&J.current.focus()},[D]);const M=s=>{const c=String(s?.repairNo||"").trim();if(c&&/[A-Za-z]+[-_/]\d/.test(c))return c;const g=String(s?.repairId||c||"").replace(/\D/g,"").padStart(6,"0"),o=new Date(s?.createdAt||s?.updatedAt||Date.now()),F=o.getFullYear(),z=String(o.getMonth()+1).padStart(2,"0"),ve=String(o.getDate()).padStart(2,"0");return`MR-${F}${z}${ve}-${g}`},fe=async s=>{s.preventDefault(),j(!0);try{let c=null;try{const z=JSON.parse(localStorage.getItem("user"));c=z?.id||z?.userId}catch{c=null}const g=await ie.logRepairJob({...n,branchId:a||1,createdBy:c}),o=g.data?.data||g.data||{},F=M(o);if(m)try{await ke({repair:{...o,customerName:o.customerName||n.customerName,customerPhone:o.customerPhone||n.contactNo,contactNo:o.contactNo||n.contactNo,deviceBrand:o.deviceBrand||n.deviceBrand,deviceModel:o.deviceModel||n.deviceModel,imeiNo:o.imeiNo||n.imeiNo,problemDescription:o.problemDescription||n.problemDescription,advancePayment:o.advancePayment??n.advancePayment,paymentMethod:o.paymentMethod||n.paymentMethod,repairNo:F},branchInfo:u,cashierName:p})}catch(z){console.error("Failed to print mobile repair receipt:",z)}r("success","Repair Logged",`Repair ${F} logged for ${n.customerName}. Sent to Technician.`),t()}catch(c){console.error("Failed to log repair job:",c),r("error","Request Failed",c.response?.data?.message||"Failed to submit the repair request."),j(!1)}},re=async()=>{if(S.trim()){q(!0),W(null);try{const c=(await ie.searchRepairs(S.trim())).data||[];c.sort((g,o)=>g.status==="READY_FOR_PAYMENT"&&o.status!=="READY_FOR_PAYMENT"?-1:o.status==="READY_FOR_PAYMENT"&&g.status!=="READY_FOR_PAYMENT"?1:new Date(o.updatedAt||o.createdAt).getTime()-new Date(g.updatedAt||g.createdAt).getTime()),O(c)}catch(s){console.error("Search failed:",s),O([])}finally{q(!1)}}},le=async s=>{if(!i){r("error","Cart Unavailable","Cannot add repair charges to cart from this context.");return}const c=parseFloat(s.balanceDue)||parseFloat(s.finalCost)||0;if(c<=0){r("info","No Balance","This repair has no outstanding balance.");return}const g={productId:`REPAIR-${s.repairId}`,id:`REPAIR-${s.repairId}`,name:`Repair ${M(s)} | ${s.deviceBrand} ${s.deviceModel} | ${s.customerName||"Walk-in"} | ${s.customerPhone||"-"}`,price:c,sellingPrice:c,qty:1,discount:0,taxRate:0,isService:!0,repairData:{repairId:s.repairId,repairNo:M(s),customerName:s.customerName,customerPhone:s.customerPhone,deviceBrand:s.deviceBrand,deviceModel:s.deviceModel,finalCost:s.finalCost,balanceDue:c}};i(g),r("success","Added to Cart",`Repair charge of LKR ${c.toLocaleString()} for ${s.deviceBrand} ${s.deviceModel} added to cart.`),t()},ye=s=>s?new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-",E=(s,c,g=!1)=>{s.key==="Enter"&&(!g&&s.shiftKey||(s.preventDefault(),c?.current?.focus()))};return e.jsxs("div",{className:"fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4",children:[e.jsxs("div",{className:"bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]",style:{animation:"modalSlideIn 0.3s ease-out"},children:[e.jsxs("div",{className:"bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"bg-white/20 p-2.5 rounded-xl",children:e.jsx(ne,{className:"w-6 h-6 text-white"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-bold text-white tracking-wide",children:"Mobile Repair Center"}),e.jsx("p",{className:"text-emerald-100 text-xs mt-0.5",children:"Log new repairs or find existing repair jobs"})]})]}),e.jsx("button",{onClick:t,className:"p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors",children:e.jsx(we,{size:24})})]}),e.jsxs("div",{className:"flex bg-slate-100 px-4 pt-3 shrink-0",children:[e.jsxs("button",{onClick:()=>H("LOG"),className:`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${D==="LOG"?"bg-white text-emerald-700 shadow-sm border border-slate-200 border-b-white -mb-px z-10":"text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`,children:[e.jsx(ne,{size:16}),"Log New Repair"]}),e.jsxs("button",{onClick:()=>H("FIND"),className:`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${D==="FIND"?"bg-white text-emerald-700 shadow-sm border border-slate-200 border-b-white -mb-px z-10":"text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`,children:[e.jsx(V,{size:16}),"Find Repair Job"]})]}),e.jsxs("div",{className:"flex-1 overflow-hidden flex flex-col border-t border-slate-200",children:[D==="LOG"&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"p-6 overflow-y-auto bg-slate-50 flex-1",children:e.jsxs("form",{id:"repairForm",onSubmit:fe,className:"space-y-6",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("h3",{className:"text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2",children:[e.jsx(Z,{size:14,className:"text-emerald-600"}),"Device Details"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:["Device Brand ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx("input",{ref:y,required:!0,type:"text",placeholder:"e.g. Samsung, Apple",className:"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all",value:n.deviceBrand,onChange:s=>$({...n,deviceBrand:s.target.value}),onKeyDown:s=>E(s,v)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:"Model Number"}),e.jsx("input",{ref:v,type:"text",placeholder:"e.g. S22 Ultra",className:"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all",value:n.deviceModel,onChange:s=>$({...n,deviceModel:s.target.value}),onKeyDown:s=>E(s,N)})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:"IMEI / Serial Number"}),e.jsxs("div",{className:"relative",children:[e.jsx(Z,{className:"absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"}),e.jsx("input",{ref:N,type:"text",placeholder:"Enter 15 digit IMEI",className:"w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono tracking-wider transition-all",value:n.imeiNo,onChange:s=>$({...n,imeiNo:s.target.value}),onKeyDown:s=>E(s,b)})]})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsxs("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:["Problem Description ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx("textarea",{ref:b,required:!0,rows:"3",placeholder:"Describe the issue reported by customer...",className:"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all",value:n.problemDescription,onChange:s=>$({...n,problemDescription:s.target.value}),onKeyDown:s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),f.current?.focus())}})]})]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("h3",{className:"text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2 mt-2",children:[e.jsx(ee,{size:14,className:"text-emerald-600"}),"Customer Info"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:["Name ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx("input",{ref:f,required:!0,type:"text",placeholder:"Customer Name",className:"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all",value:n.customerName,onChange:s=>$({...n,customerName:s.target.value}),onKeyDown:s=>E(s,P)})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:["Contact Phone ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsx("input",{ref:P,required:!0,type:"tel",placeholder:"07X XXX XXXX",className:"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all",value:n.contactNo,onChange:s=>$({...n,contactNo:s.target.value}),onKeyDown:s=>E(s,C)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:"Advance Payment (LKR)"}),e.jsx("input",{ref:C,type:"number",min:"0",placeholder:"e.g. 5000",className:"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all",value:n.advancePayment,onChange:s=>$({...n,advancePayment:s.target.value}),onKeyDown:s=>E(s,w)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-xs font-semibold text-slate-600 mb-1.5 block",children:"Payment Method"}),e.jsxs("select",{ref:w,className:"w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all",value:n.paymentMethod,onChange:s=>$({...n,paymentMethod:s.target.value}),onKeyDown:s=>{s.key==="Enter"&&(s.preventDefault(),document.getElementById("repairForm")?.requestSubmit())},children:[e.jsx("option",{value:"CASH",children:"Cash"}),e.jsx("option",{value:"CARD",children:"Card"})]})]})]})]})]})}),e.jsxs("div",{className:"p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0",children:[e.jsx("button",{type:"button",onClick:t,className:"px-6 py-2.5 text-slate-600 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm",children:"Cancel"}),e.jsx("button",{form:"repairForm",type:"submit",disabled:U,className:"px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 group text-sm disabled:opacity-70 disabled:cursor-not-allowed",children:U?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"}),"Processing..."]}):e.jsxs(e.Fragment,{children:["Log Repair Ticket",e.jsx(te,{className:"w-5 h-5 group-hover:scale-110 transition-transform"})]})})]})]}),D==="FIND"&&!d&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"p-4 bg-white border-b border-slate-200 shrink-0",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(V,{className:"absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"}),e.jsx("input",{ref:J,type:"text",value:S,onChange:s=>G(s.target.value),onKeyDown:s=>s.key==="Enter"&&re(),placeholder:"Search by phone number, device model, brand, or repair no...",className:"w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"})]}),e.jsxs("button",{onClick:re,disabled:L||!S.trim(),className:"px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",children:[L?e.jsx(se,{size:16,className:"animate-spin"}):e.jsx(V,{size:16}),"Search"]})]})}),e.jsx("div",{className:"flex-1 overflow-y-auto bg-slate-50 p-4",children:L?e.jsxs("div",{className:"flex flex-col items-center justify-center py-16 text-slate-400",children:[e.jsx(se,{className:"w-8 h-8 animate-spin mb-3"}),e.jsx("p",{className:"font-medium",children:"Searching repair jobs..."})]}):I.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-16 text-slate-400",children:[e.jsx(V,{className:"w-12 h-12 text-slate-200 mb-4"}),e.jsx("h3",{className:"text-lg font-bold text-slate-500 mb-1",children:S?"No repair jobs found":"Search for repair jobs"}),e.jsx("p",{className:"text-sm text-slate-400",children:S?"Try a different phone number, device model, or repair number.":"Enter a phone number, device model, brand or repair number to search."})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"text-xs font-bold text-slate-500 uppercase tracking-wider px-1",children:[I.length," repair job",I.length!==1?"s":""," found"]}),I.map(s=>{const c=parseFloat(s.balanceDue)||0,g=s.status==="READY_FOR_PAYMENT",o=s.status==="PAID"||s.status==="DELIVERED",F=["RECEIVED","DIAGNOSED","IN_PROGRESS","WAITING_APPROVAL"].includes(s.status);return e.jsxs("div",{className:`bg-white rounded-xl border transition-all hover:shadow-md ${g?"border-emerald-200 shadow-sm shadow-emerald-50":o?"border-green-200 bg-green-50/30":"border-slate-200"}`,children:[o&&e.jsxs("div",{className:"px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-2 rounded-t-xl",children:[e.jsx(te,{size:16}),e.jsx("span",{className:"text-xs font-bold uppercase tracking-wider",children:"✅ Completed — Device Delivered to Customer"})]}),e.jsxs("div",{className:"p-4",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3 mb-3",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[e.jsx("span",{className:"text-xs font-bold text-emerald-600 font-mono",children:M(s)}),e.jsx(me,{status:s.status})]}),e.jsxs("h4",{className:`font-bold text-base ${o?"text-slate-500":"text-slate-800"}`,children:[s.deviceBrand," ",s.deviceModel]})]}),s.finalCost>0&&e.jsxs("div",{className:"text-right shrink-0",children:[e.jsx("div",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Final Cost"}),e.jsxs("div",{className:`text-lg font-black ${o?"text-green-600":"text-slate-800"}`,children:["LKR ",parseFloat(s.finalCost).toLocaleString()]}),c>0&&!o&&e.jsxs("div",{className:"text-xs font-bold text-red-500",children:["Balance: LKR ",c.toLocaleString()]}),o&&e.jsxs("div",{className:"text-xs font-bold text-green-600 flex items-center gap-1 justify-end",children:[e.jsx(te,{size:12})," Fully Paid"]})]})]}),e.jsxs("div",{className:"flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(ee,{size:12})," ",s.customerName||"Unknown"]}),e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx($e,{size:12})," ",s.customerPhone||"N/A"]}),e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(Se,{size:12})," ",ye(s.createdAt)]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("button",{onClick:()=>W(s),className:"px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5",children:[e.jsx(Re,{size:13})," View Details"]}),g&&i&&e.jsxs("button",{onClick:()=>le(s),className:"px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg transition-all flex items-center gap-1.5 shadow-sm",children:[e.jsx(oe,{size:13})," Add to Cart"]}),F&&e.jsxs("span",{className:"px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg flex items-center gap-1.5",children:[e.jsx(se,{size:13})," Still being processed by technician"]})]})]})]},s.repairId)})]})})]}),D==="FIND"&&d&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"p-4 bg-white border-b border-slate-200 shrink-0 flex items-center gap-3",children:[e.jsx("button",{onClick:()=>W(null),className:"p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",children:e.jsx(De,{size:18})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-bold text-slate-800",children:"Repair Details"}),e.jsx("p",{className:"text-xs text-slate-500 font-mono",children:M(d)})]}),e.jsx(me,{status:d.status})]}),e.jsx("div",{className:"flex-1 overflow-y-auto bg-slate-50 p-6",children:e.jsxs("div",{className:"max-w-lg mx-auto space-y-6",children:[e.jsxs("div",{className:"bg-white rounded-xl border border-slate-200 p-5 shadow-sm",children:[e.jsxs("h4",{className:"text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2",children:[e.jsx(Z,{size:14})," Device Information"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Brand"}),e.jsx("p",{className:"font-bold text-slate-800",children:d.deviceBrand})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Model"}),e.jsx("p",{className:"font-bold text-slate-800",children:d.deviceModel||"-"})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"IMEI"}),e.jsx("p",{className:"font-mono text-slate-700",children:d.imeiNo||"N/A"})]})]})]}),e.jsxs("div",{className:"bg-white rounded-xl border border-slate-200 p-5 shadow-sm",children:[e.jsxs("h4",{className:"text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2",children:[e.jsx(ee,{size:14})," Customer Information"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Name"}),e.jsx("p",{className:"font-bold text-slate-800",children:d.customerName})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Phone"}),e.jsx("p",{className:"font-bold text-slate-800",children:d.customerPhone})]})]})]}),e.jsxs("div",{className:"bg-white rounded-xl border border-slate-200 p-5 shadow-sm",children:[e.jsxs("h4",{className:"text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2",children:[e.jsx(Pe,{size:14})," Job Details"]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Problem Description"}),e.jsx("p",{className:"text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mt-1",children:d.problemDescription})]}),d.diagnosisNotes&&e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Diagnosis Notes"}),e.jsx("p",{className:"text-sm text-slate-700 bg-blue-50 p-3 rounded-lg mt-1",children:d.diagnosisNotes})]}),d.costNote&&e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-400 uppercase",children:"Parts & Cost Note"}),e.jsx("p",{className:"text-sm text-slate-700 bg-purple-50 p-3 rounded-lg mt-1",children:d.costNote})]})]})]}),e.jsxs("div",{className:"bg-white rounded-xl border border-emerald-200 p-5 shadow-sm",children:[e.jsxs("h4",{className:"text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2",children:[e.jsx(Ce,{size:14})," Payment Summary"]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{className:"text-slate-500",children:"Estimated Cost"}),e.jsx("span",{className:"font-semibold text-slate-700",children:d.estimatedCost>0?`LKR ${parseFloat(d.estimatedCost).toLocaleString()}`:"-"})]}),e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{className:"text-slate-500",children:"Final Cost (Manager Approved)"}),e.jsx("span",{className:"font-bold text-slate-800",children:d.finalCost>0?`LKR ${parseFloat(d.finalCost).toLocaleString()}`:"-"})]}),e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{className:"text-slate-500",children:"Already Paid"}),e.jsxs("span",{className:"font-semibold text-green-600",children:["LKR ",(parseFloat(d.totalPaid)||0).toLocaleString()]})]}),e.jsxs("div",{className:"border-t border-emerald-100 pt-2 mt-2 flex justify-between",children:[e.jsx("span",{className:"font-bold text-slate-800",children:"Balance Due"}),e.jsxs("span",{className:`text-xl font-black ${(parseFloat(d.balanceDue)||0)>0?"text-red-600":"text-green-600"}`,children:["LKR ",(parseFloat(d.balanceDue)||0).toLocaleString()]})]})]})]}),d.status==="READY_FOR_PAYMENT"&&(parseFloat(d.balanceDue)||0)>0&&e.jsx("div",{className:"flex gap-3",children:i&&e.jsxs("button",{onClick:()=>le(d),className:"flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2",children:[e.jsx(oe,{size:18})," Add to Cart — LKR ",(parseFloat(d.balanceDue)||0).toLocaleString()]})})]})})]})]})]}),e.jsx("style",{children:`
                @keyframes modalSlideIn {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            `})]})}export{Ve as M,qe as a,Ue as b,He as c,Ge as p};
