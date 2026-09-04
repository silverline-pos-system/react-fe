# GRN Rollout and Item Dispatcher Removal: Implementation Plan

Status: in progress. Branch `feat/grn-replace-dispatch` off `dev` in both repos
(react-fe and springboot-be). Commits land batch wise, one phase per batch.

## Goal

Replace the "Item Dispatcher" with a proper GRN (Goods Received Note) inbound
receiving flow, remove the dispatcher completely from code and database, remove
the STORE_KEEPER role and give cashiers full inventory access, and add a POS
entry point to the inventory system.

## Confirmed decisions

1. A GRN receives into ONE branch per document. The old per line `to_branch_id`
   multi branch distribution is dropped.
2. Keep the supplier payment request workflow (supervisor approve, transfer to
   manager, process payment). It is re keyed from dispatch to GRN, not deleted.
3. Fresh GRN. No data migration. Dispatch tables and all dispatch rows are
   dropped. Fresh GRN tables are created.
4. Cashiers get full inventory access. The STORE_KEEPER role is removed and its
   former users become CASHIER.
5. No global product price. Pricing moves per branch. GRN stops overwriting the
   global `products` price columns.

## Sequencing principle

Receiving and supplier payments must never be broken. GRN is built and made the
source of truth before dispatch is deleted. Additive phases (1 to 3) can merge
first; the breaking phases (4 removal, 5 role) merge together with their
migrations. Backend and frontend deploy in lockstep at the 4/5 boundary.

Gates after every phase: backend `mvnw compile`; frontend `npm run build` then
`npm run lint`. Red gate stops the next phase.

---

## Phase 1: GRN backend (springboot-be)

New Flyway migration `V9__grn_and_branch_product.sql`:
- `grn`: grn_id PK, grn_no unique, branch_id, supplier_id, po_id, grn_date,
  invoice_no, invoice_date, total_amount, net_amount, payment_status, status,
  received_by, created_at.
- `grn_items`: grn_item_id PK, grn_id, product_id, batch_id, batch_code,
  expiry_date, qty_received, unit_price, selling_price, mrp, total, item_type,
  serial_no. No `to_branch_id` (branch is on the header).
- `grn_payment_requests`: same shape as `dispatch_payment_requests` with
  grn_id / grn_no in place of dispatch_id / dispatch_no.
- `branch_product` (per branch price and carry list): branch_id, product_id,
  cost_price, selling_price, mrp, reorder_level, is_active, added_by_branch_id,
  added_by_user_id, unique(branch_id, product_id). This is the per branch price
  source and the "branch carries this product" link.
- Add column `product_serials.grn_id` (nullable). Keep `dispatch_id` until
  Phase 4.

New Java under `module.procurement.grn`:
- Entities `Grn`, `GrnItem`, `GrnPaymentRequest`; entity `BranchProduct` under
  `domain.inventory`.
- Repositories for each.
- `GrnService` / `GrnServiceImpl`, porting the reusable logic from
  `DispatchServiceImpl`: stock upsert (was `updateStockFromDispatch`), PO
  received quantity and status transition to PARTIALLY_RECEIVED / FULLY_RECEIVED
  (was `updatePOReceivedQuantities`), batch creation (was `createBatch`), serial
  upsert (was `upsertSerialsForDispatchedItem`, now writes `grn_id`), IMEI
  validation. Per decision 5 it writes price to `branch_product` and `batch`,
  and does NOT touch the global `products` price columns.
- `GrnController`: POST create, POST `{id}/post` (confirm), GET by branch, POST
  search, GET by id, PDF.
- `GrnReceivedEvent` and a listener using
  `@TransactionalEventListener(AFTER_COMMIT)` (fixes the current async race) that
  calls `grnPaymentRequestService.createPaymentRequest(grnId, receivedBy)` and
  does not swallow failures.
- `GrnPaymentRequestService` ported from `DispatchPaymentRequestServiceImpl`.
  `processPayment` / `reject` write back `grn.paymentStatus`.
- SecurityConfig: add `/api/v1/grn-payments/**` matcher mirroring the dispatch
  one.

## Phase 2: GRN frontend (react-fe)

- New `GrnScreen.jsx` replacing `ItemDispatcherScreen`, 3 step layout: select PO,
  receive lines (batch and IMEI editors inline), review and post. History reads
  `qty_received` (fixes the always zero quantity bug), row expand for full
  contents, real error and skeleton states.
- `inventoryService.js`: replace getDispatches / createDispatch / approveDispatch
  with getGrns / createGrn / postGrn against the new endpoints.
- Rename `dispatchPaymentService.js` to `grnPaymentService.js` and
  `dispatchPaymentModal.jsx` to `grnPaymentModal.jsx`; endpoints
  `/api/v1/grn-payments/**`. Update ManagerPayments, SupplierPayments, Approvals.
- Manager `PendingDispatches` widget and QuickActionsPanel become "Pending GRNs".
- `InventorySystem.jsx`: swap the dispatcher screen for the GRN screen.

## Phase 3: Cut dependents from dispatch to GRN (springboot-be)

- Analytics: DashboardServiceImpl, AlertServiceImpl, DashboardService,
  DashboardController `/dispatches/pending`, PendingDispatchDTO become GRN based.
- Reports: SalesAnalyticsController `/reports/dispatches/pdf`,
  JasperReportService.generateDispatchListPdf, inventory_dispatch_list.jrxml
  become GRN variants or are removed if unused.
- ProductRepository.isUsedInDispatches (JPQL on DispatchItem) becomes
  isUsedInGrns on GrnItem; update ProductServiceImpl usage guard.
- ProductSerialServiceImpl, ProductSerialDTO, ProductSerial: dispatchId to grnId.
- SupplierPaymentAllocation.dispatch_id (dead code) re pointed to grn_id or
  dropped.
- InventoryUtils dead dispatch methods removed.

This is the cutover point: GRN now owns receiving, payments, serials, analytics.

## Phase 4: Remove Item Dispatcher completely

Frontend deletions: ItemDispatcherScreen, dispatch methods in inventoryService /
inventoryApi / inventoryMapper, dispatch refs in POManagementScreen,
IMEISearchScreen, managerService, PendingDispatches, barrels.

Backend deletions: both DispatchControllers, DispatchServiceImpl x2,
DispatchServiceValidator, DispatchPaymentRequest chain, DispatchRepository
(procurement and manager), DispatchItemRepository, all Dispatch DTOs, Dispatch
and DispatchItem entities, DispatchReceivedEvent, DispatchException, tests
DispatchFlowIntegrationTest and dispatch parts of DashboardServiceImplTest,
SecurityConfig `/api/v1/dispatch-payments/**` rule.

DB drop `V10__drop_dispatch.sql`: drop item_dispatches, item_dispatch_lines,
dispatch_payment_requests, index idx_dispatch_branch_status, column
product_serials.dispatch_id.

Gate: both repos compile, build, lint green with zero dispatch references.

## Phase 5: Remove STORE_KEEPER, cashier inventory, POS nav

Backend:
- Role.java: delete STORE_KEEPER.
- LogInResponseDTO.determineRedirectPath: remove the STORE_KEEPER case.
- SecurityConfig: add CASHIER to `/api/inventory/**` and `/api/v1/inventory/**`,
  to StockController `@PreAuthorize` (adjust, add, remove) and
  AdjustmentController.
- SecondaryRoleService.ALLOWED_ROLES and AssignSecondaryRoleRequest: drop
  STORE_KEEPER. Update JwtFilterTest, SecondaryRoleServiceTest.
- Migration `V11__remove_store_keeper.sql`: UPDATE user_profiles SET
  role='CASHIER' WHERE role='STORE_KEEPER'; handle secondary_role_assignments
  rows with secondary_role='STORE_KEEPER'; drop and recreate the anonymous
  user_profiles.role CHECK constraint without STORE_KEEPER (discover the
  generated name first).

Frontend:
- roleRouting.js and LoginPage.jsx: remove STORE_KEEPER cases (former store
  keepers are CASHIER and land on /pos).
- AppRoutes.jsx: change the /inventory guard to allowedRoles CASHIER, SUPERVISOR
  (MANAGER and SUPER_ADMIN already have implicit access).
- UserRegistrations.jsx, SecondaryRoleAssignment.jsx, SecondaryRoleBanner.jsx:
  remove STORE_KEEPER entries.
- POS to Inventory button in POSScreen header cluster, navigate('/inventory').
- Back to POS control in InventoryHeader for cashiers.

## Phase 6: Per branch pricing cutover (react-fe and springboot-be)

- Map every read of the global `products` price (POS pricing, PO defaults,
  displays). Switch those reads to `branch_product` for the active branch, with
  `batch` as the batch level source.
- POS product lookup filters to products the branch carries (branch_product rows)
  and available stock, enforcing "sell only own items".
- Final cleanup migration drops the `products` cost_price, selling_price, mrp
  columns once no reader references them. Highest risk item, done last with its
  own verification.

## Phase 7: Verify

- Backend: migrations against a scratch DB; smoke test create GRN, post, stock
  increment, PO status, payment request created, process payment writes back.
- Frontend: build and lint; POS to inventory nav, create a GRN, history shows
  correct quantity.
- Grep both repos for `dispatch` and `STORE_KEEPER` to confirm zero live refs.

## Rollout

One PR per repo to `dev`. Phases 1 to 3 additive. Phases 4 and 5 breaking, merge
together with migrations. Phase 6 pricing is a separate follow up PR because it
touches the POS pricing path.
