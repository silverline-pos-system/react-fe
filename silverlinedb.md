```mermaid
classDiagram
direction BT
class accounts {
   varchar(20) code
   timestamp(6) created_at
   boolean is_active
   varchar(120) name
   bigint parent_id
   varchar(20) type
   bigint account_id
}
class approvals {
   text approval_notes
   timestamp(6) approved_at
   bigint approved_by
   bigint branch_id
   timestamp(6) created_at
   text payload_json
   bigint reference_id
   varchar(100) reference_no
   text request_notes
   bigint requested_by
   varchar(20) status
   varchar(50) type
   bigint approval_id
}
class audit_logs {
   varchar(50) action
   bigint branch_id
   timestamp(6) created_at
   varchar(45) ip_address
   text new_values
   text old_values
   bigint record_id
   varchar(100) table_name
   text user_agent
   bigint user_id
   bigint log_id
}
class batches {
   varchar(60) batch_code
   bigint branch_id
   numeric(15,2) cost_price
   timestamp(6) created_at
   date expiry_date
   date manufacturing_date
   numeric(15,2) mrp
   bigint product_id
   numeric(15,3) qty
   numeric(15,2) selling_price
   bigint batch_id
}
class branch_activities {
   varchar(255) action_type
   bigint branch_id
   varchar(500) description
   bigint entity_id
   varchar(255) entity_type
   varchar(45) ip_address
   jsonb metadata
   varchar(20) severity
   varchar(20) status
   timestamp(6) created_at
   text user_agent
   bigint user_id
   bigint activity_id
}
class branches {
   varchar(255) address
   varchar(255) code
   timestamp(6) created_at
   varchar(255) email
   boolean is_active
   varchar(255) location
   varchar(255) name
   varchar(255) phone
   timestamp(6) updated_at
   bigint branch_id
}
class brands {
   timestamp(6) created_at
   text description
   boolean is_active
   varchar(100) name
   bigint brand_id
}
class cash_flows {
   numeric(38,2) amount
   timestamp(6) created_at
   bigint created_by
   varchar(255) reason
   varchar(255) reference_no
   bigint shift_id
   varchar(255) status
   varchar(255) type
   bigint flow_id
}
class cash_shift_denominations {
   numeric(15,2) amount
   timestamp(6) created_at
   numeric(10,2) denomination_value
   integer quantity
   bigint shift_id
   varchar(255) type
   bigint denom_id
}
class cash_shifts {
   timestamp(6) approved_at
   bigint approved_by
   bigint branch_id
   numeric(15,2) cash_difference
   bigint cashier_id
   timestamp(6) closed_at
   numeric(15,2) closing_cash
   timestamp(6) created_at
   numeric(15,2) expected_cash
   text notes
   timestamp(6) opened_at
   numeric(15,2) opening_cash
   varchar(50) shift_no
   varchar(255) status
   numeric(15,2) total_returns
   numeric(15,2) total_sales
   timestamp(6) updated_at
   bigint shift_id
}
class categories {
   timestamp(6) created_at
   text description
   boolean is_active
   varchar(100) name
   bigint category_id
}
class customers {
   varchar(255) address
   varchar(100) city
   varchar(30) code
   timestamp(6) created_at
   date date_of_birth
   varchar(120) email
   boolean is_active
   integer loyalty_points
   varchar(150) name
   varchar(20) phone
   numeric(15,2) total_purchases
   timestamp(6) updated_at
   bigint customer_id
}
class dispatch_payment_requests {
   numeric(15,2) amount
   bigint branch_id
   timestamp(6) created_at
   bigint dispatch_id
   varchar(50) dispatch_no
   timestamp(6) due_date
   varchar(100) invoice_no
   text notes
   varchar(50) payment_method
   varchar(100) payment_reference
   varchar(20) priority
   timestamp(6) processed_at
   bigint processed_by
   bigint requested_by
   varchar(30) status
   timestamp(6) supervisor_approved_at
   bigint supervisor_approved_by
   bigint supplier_id
   varchar(150) supplier_name
   timestamp(6) transferred_at
   bigint transferred_to_manager_by
   timestamp(6) updated_at
   bigint request_id
}
class expense_categories {
   timestamp(6) created_at
   varchar(255) description
   boolean is_active
   varchar(100) name
   bigint category_id
}
class expense_payments {
   numeric(12,2) amount
   timestamp(6) created_at
   bigint created_by
   varchar(255) notes
   date payment_date
   varchar(30) payment_method
   varchar(100) reference_no
   bigint expense_id
   bigint payment_id
}
class expenses {
   numeric(12,2) amount
   timestamp(6) approved_at
   bigint approved_by
   bigint branch_id
   timestamp(6) created_at
   bigint created_by
   varchar(255) description
   date expense_date
   varchar(50) expense_no
   varchar(30) payment_method
   varchar(100) reference_no
   varchar(20) status
   bigint category_id
   bigint expense_id
}
class feature_verification_codes {
   varchar(20) action
   timestamp(6) created_at
   timestamp(6) expires_at
   varchar(50) feature_code
   bigint hashed_code
   boolean is_used
   integer verification_code
   bigint id
}
class item_dispatch_lines {
   varchar(60) batch_code
   bigint batch_id
   bigint dispatch_id
   date expiry_date
   varchar(20) item_type
   numeric(15,2) mrp
   bigint product_id
   numeric(15,3) qty_dispatched
   numeric(15,2) selling_price
   varchar(100) serial_no
   bigint to_branch_id
   numeric(15,2) total
   numeric(15,2) unit_price
   bigint dispatch_line_id
}
class item_dispatches {
   timestamp(6) approved_at
   bigint approved_by
   bigint branch_id
   timestamp(6) created_at
   bigint created_by
   date dispatch_date
   varchar(50) dispatch_no
   date invoice_date
   varchar(100) invoice_no
   numeric(15,2) net_amount
   varchar(30) payment_status
   bigint po_id
   varchar(20) status
   bigint supplier_id
   numeric(15,2) total_amount
   bigint dispatch_id
}
class journal_entries {
   bigint branch_id
   timestamp(6) created_at
   bigint created_by
   date entry_date
   varchar(50) journal_no
   varchar(255) memo
   timestamp(6) posted_at
   bigint posted_by
   varchar(100) reference_no
   varchar(20) status
   numeric(15,2) total_credit
   numeric(15,2) total_debit
   varchar(50) transaction_type
   bigint journal_id
}
class journal_lines {
   bigint account_id
   numeric(15,2) credit
   numeric(15,2) debit
   varchar(255) description
   bigint journal_id
   bigint line_id
}
class loyalty_otps {
   timestamp(6) created_at
   bigint customer_id
   timestamp(6) expires_at
   varchar(10) otp_code
   bigint id
}
class notification_recipients {
   timestamp(6) created_at
   boolean is_read
   timestamp(6) read_at
   bigint user_id
   bigint notification_id
   bigint id
}
class notifications {
   timestamp(6) created_at
   bigint created_by
   text message
   varchar(20) priority
   bigint reference_id
   varchar(50) reference_type
   varchar(200) title
   varchar(50) type
   bigint notification_id
}
class password_reset_requests {
   text admin_notes
   timestamp(6) created_at
   varchar(150) email
   varchar(150) full_name
   varchar(200) new_password_hash
   text request_notes
   timestamp(6) reviewed_at
   bigint reviewed_by
   varchar(20) status
   bigint user_id
   varchar(100) username
   bigint id
}
class payments {
   numeric(38,2) amount
   varchar(255) bank_name
   varchar(255) card_last4
   timestamp(6) created_at
   varchar(255) payment_type
   varchar(255) reference_no
   bigint sale_id
   bigint payment_id
}
class permissions {
   varchar(50) code
   timestamp(6) created_at
   text description
   varchar(50) module
   varchar(100) name
   bigint permission_id
}
class pos_quick_pick_items {
   bigint branch_id
   timestamp(6) created_at
   bigint product_id
   bigint id
}
class print_header_footer_settings {
   bigint branch_id
   timestamp(6) created_at
   varchar(255) footer_extra_line
   varchar(255) footer_policy_line
   varchar(255) footer_powered_by_line
   varchar(255) footer_thank_you_line
   varchar(255) header_address
   varchar(150) header_branch_line
   varchar(150) header_business_name
   varchar(100) header_contact
   varchar(255) header_extra_line
   timestamp(6) updated_at
   bigint id
}
class product_serials {
   varchar(60) barcode
   bigint batch_id
   bigint branch_id
   timestamp(6) created_at
   bigint dispatch_id
   bigint product_id
   bigint sale_id
   varchar(100) serial_no
   timestamp(6) sold_at
   varchar(20) status
   bigint serial_id
}
class products {
   varchar(60) barcode
   bigint brand_id
   bigint category_id
   numeric(15,2) cost_price
   timestamp(6) created_at
   text description
   boolean is_active
   boolean is_serialized
   numeric(15,3) max_stock_level
   numeric(15,2) mrp
   varchar(150) name
   numeric(15,3) reorder_level
   numeric(15,2) selling_price
   varchar(60) sku
   bigint subcategory_id
   bigint unit_id
   timestamp(6) updated_at
   integer warranty_months
   bigint product_id
}
class purchase_order_items {
   numeric(15,2) discount
   numeric(15,2) mrp
   bigint po_id
   bigint product_id
   numeric(15,3) qty_dispatched
   numeric(15,3) qty_ordered
   numeric(15,2) selling_price
   numeric(15,2) total
   numeric(15,2) unit_price
   bigint po_item_id
}
class purchase_order_payments {
   numeric(15,2) amount_paid
   timestamp(6) created_at
   varchar(500) notes
   timestamp(6) paid_at
   bigint paid_by
   varchar(30) payment_method
   varchar(120) payment_reference
   bigint po_id
   bigint po_payment_id
}
class purchase_orders {
   bigint branch_id
   timestamp(6) created_at
   bigint created_by
   numeric(15,2) discount_amount
   date expected_delivery_date
   numeric(15,2) net_amount
   numeric(15,2) paid_amount
   timestamp(6) paid_at
   varchar(30) payment_status
   varchar(50) payment_terms
   date po_date
   varchar(50) po_no
   varchar(30) status
   bigint supplier_id
   numeric(15,2) total_amount
   bigint po_id
}
class repair_jobs {
   bigint approved_by
   bigint branch_id
   text cost_note
   timestamp(6) created_at
   bigint created_by
   bigint customer_id
   varchar(100) device_brand
   varchar(100) device_model
   text diagnosis_notes
   numeric(15,2) estimated_cost
   numeric(15,2) final_cost
   varchar(100) imei_no
   text problem_description
   varchar(50) repair_no
   varchar(30) status
   bigint technician_id
   timestamp(6) updated_at
   bigint repair_id
}
class repair_payments {
   numeric(15,2) amount
   timestamp(6) created_at
   varchar(30) payment_method
   bigint received_by
   bigint repair_id
   bigint payment_id
}
class repair_status_history {
   timestamp(6) changed_at
   bigint changed_by
   varchar(30) new_status
   text notes
   varchar(30) old_status
   bigint repair_id
   bigint history_id
}
class role_permissions {
   bigint permission_id
   varchar(40) role
}
class saas_features {
   timestamp(6) activated_at
   bigint activated_by
   timestamp(6) created_at
   timestamp(6) deactivated_at
   varchar(20) feature_category
   varchar(50) feature_code
   varchar(100) feature_name
   boolean is_active
   timestamp(6) updated_at
   bigint id
}
class sale_items {
   bigint batch_id
   numeric(10,2) discount
   bigint product_id
   numeric(12,3) qty
   bigint sale_id
   bigint serial_id
   numeric(10,2) total
   numeric(10,2) unit_price
   bigint sale_item_id
}
class sale_service_status_history {
   timestamp(6) changed_at
   bigint changed_by
   varchar(30) new_status
   text notes
   varchar(30) old_status
   bigint service_id
   bigint history_id
}
class sale_services {
   text additional_items
   text address
   numeric(15,2) balance_collected
   varchar(20) contact_no
   timestamp(6) created_at
   varchar(150) customer_name
   boolean installation_required
   text notes
   bigint sale_id
   numeric(15,2) service_charge
   varchar(30) service_status
   varchar(50) service_type
   bigint technician_id
   timestamp(6) updated_at
   bigint service_id
}
class sales {
   bigint branch_id
   bigint cashier_id
   numeric(10,2) change_amount
   timestamp(6) created_at
   bigint customer_id
   numeric(10,2) discount
   numeric(12,2) gross_total
   varchar(255) invoice_no
   numeric(12,2) net_total
   varchar(255) notes
   numeric(12,2) paid_amount
   varchar(255) payment_status
   timestamp(6) sale_date
   varchar(255) sale_type
   bigint shift_id
   numeric(10,2) tax_amount
   bigint sale_id
}
class sales_return_items {
   bigint product_id
   numeric(15,3) qty
   bigint sale_item_id
   numeric(15,2) total
   numeric(15,2) unit_price
   bigint return_id
   bigint return_item_id
}
class sales_returns {
   bigint approved_by
   bigint branch_id
   timestamp(6) created_at
   bigint created_by
   text reason
   varchar(30) refund_method
   timestamp(6) return_date
   varchar(50) return_no
   bigint sale_id
   bigint shift_id
   varchar(20) status
   numeric(15,2) total_amount
   bigint return_id
}
class secondary_role_assignments {
   bigint assigned_by_branch_id
   timestamp(6) created_at
   timestamp(6) expires_at
   varchar(255) reason
   boolean revoked
   timestamp(6) revoked_at
   varchar(30) secondary_role
   bigint user_id
   bigint id
}
class stock {
   numeric(15,3) available_qty
   bigint branch_id
   timestamp(6) last_updated
   bigint product_id
   numeric(15,3) quantity
   numeric(15,3) reserved_qty
   bigint stock_id
}
class stock_transfer {
   timestamp(6) approved_time
   timestamp(6) created_at
   numeric(10,2) quantity
   varchar(500) remarks
   timestamp(6) requested_time
   timestamp(6) transfer_date
   varchar(50) transfer_no
   varchar(20) transfer_status
   timestamp(6) updated_at
   bigint approved_by
   bigint batch_id
   bigint from_branch_id
   bigint product_id
   bigint requested_by
   bigint to_branch_id
   bigint id
}
class stock_transfer_item {
   bigint batch_id
   timestamp(6) created_at
   bigint product_id
   numeric(15,3) quantity
   timestamp(6) updated_at
   bigint transfer_id
   bigint id
}
class subcategories {
   bigint category_id
   timestamp(6) created_at
   text description
   boolean is_active
   varchar(100) name
   bigint subcategory_id
}
class supplier_branches {
   timestamp(6) created_at
   numeric(5,2) discount_percentage
   boolean is_preferred
   text notes
   bigint branch_id
   bigint supplier_id
}
class supplier_contacts {
   timestamp(6) created_at
   varchar(150) designation
   varchar(150) email
   boolean is_primary
   varchar(150) name
   varchar(50) phone
   bigint supplier_id
   bigint contact_id
}
class supplier_ledger {
   numeric(15,2) balance
   bigint branch_id
   timestamp(6) created_at
   numeric(15,2) credit
   numeric(15,2) debit
   text description
   varchar(100) reference_no
   bigint supplier_id
   date transaction_date
   varchar(30) transaction_type
   bigint ledger_id
}
class supplier_payment_allocations {
   numeric(15,2) amount
   bigint dispatch_id
   bigint payment_id
   bigint allocation_id
}
class supplier_payments {
   numeric(15,2) amount
   bigint branch_id
   timestamp(6) created_at
   bigint created_by
   text notes
   date payment_date
   varchar(30) payment_method
   varchar(50) payment_no
   varchar(100) reference_no
   bigint supplier_id
   bigint payment_id
}
class supplier_performance {
   bigint branch_id
   text comments
   timestamp(6) created_at
   integer delivery_rating
   bigint evaluated_by
   date evaluation_date
   numeric(3,2) overall_rating
   integer price_rating
   integer quality_rating
   bigint supplier_id
   bigint performance_id
}
class supplier_products {
   numeric(15,2) cost_price
   timestamp(6) created_at
   boolean is_preferred
   integer moq
   bigint product_id
   bigint supplier_id
   varchar(100) supplier_sku
   bigint supplier_product_id
}
class suppliers {
   varchar(255) address_line1
   varchar(255) address_line2
   varchar(100) city
   varchar(30) code
   varchar(200) company_name
   varchar(100) contact_person
   varchar(100) country
   timestamp(6) created_at
   bigint created_by
   integer credit_days
   numeric(15,2) credit_limit
   varchar(120) email
   boolean is_active
   varchar(30) mobile
   varchar(150) name
   varchar(30) phone
   varchar(50) tax_id
   timestamp(6) updated_at
   varchar(150) website
   bigint supplier_id
}
class system_settings {
   timestamp(6) created_at
   varchar(50) setting_key
   varchar(255) setting_value
   timestamp(6) updated_at
   bigint updated_by
   bigint id
}
class units {
   timestamp(6) created_at
   varchar(50) name
   varchar(10) symbol
   bigint unit_id
}
class user_activity_log {
   varchar(50) activity_type
   bigint branch_id
   timestamp(6) created_at
   text description
   varchar(45) ip_address
   bigint performed_by
   text user_agent
   bigint user_id
   bigint activity_id
}
class user_approval_requests {
   timestamp(6) created_at
   text reason
   varchar(30) request_type
   timestamp(6) reviewed_at
   bigint reviewed_by
   text reviewer_notes
   varchar(20) status
   bigint user_id
   bigint request_id
}
class user_profiles {
   varchar(20) account_status
   timestamp(6) approved_at
   timestamp(6) created_at
   varchar(150) email
   boolean email_verified
   timestamp(6) email_verified_at
   varchar(50) employee_id
   integer failed_login_attempts
   varchar(150) full_name
   timestamp(6) last_login
   boolean must_change_password
   varchar(200) password
   varchar(30) phone
   varchar(100) registration_token
   text rejection_reason
   varchar(40) role
   timestamp(6) updated_at
   varchar(100) username
   bigint approved_by
   bigint user_id
}
class user_sessions {
   timestamp(6) created_at
   timestamp(6) expires_at
   varchar(45) ip_address
   boolean is_active
   timestamp(6) last_activity
   varchar(255) token
   text user_agent
   bigint user_id
   bigint session_id
}

expense_payments  -->  expenses : expense_id
expenses  -->  expense_categories : category_id
notification_recipients  -->  notifications : notification_id
products  -->  brands : brand_id
products  -->  categories : category_id
products  -->  subcategories : subcategory_id
products  -->  units : unit_id
sales_return_items  -->  sales_returns : return_id
stock_transfer  -->  batches : batch_id
stock_transfer  -->  branches : from_branch_id:branch_id
stock_transfer  -->  branches : to_branch_id:branch_id
stock_transfer  -->  products : product_id
stock_transfer  -->  user_profiles : requested_by:user_id
stock_transfer  -->  user_profiles : approved_by:user_id
stock_transfer_item  -->  stock_transfer : transfer_id:id
subcategories  -->  categories : category_id
supplier_branches  -->  suppliers : supplier_id
supplier_contacts  -->  suppliers : supplier_id
user_profiles  -->  user_profiles : approved_by:user_id

```