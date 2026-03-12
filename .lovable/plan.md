
# CloudZoo 360 – Print Workshop ERP

## App Overview
A full-prototype ERP web app for a print workshop. Clean, professional UI with a green brand accent, collapsible sidebar navigation, and mock/sample data across all 9 modules. All screens will be navigable.

---

## Design System
- **Color:** Green primary accent (`#16a34a` / `green-600`) with white/light gray backgrounds
- **Layout:** Left collapsible sidebar + top header bar
- **Typography:** Clean sans-serif, data-dense tables with proper spacing
- **Components:** Cards, data tables, charts (Recharts), badges, modals

---

## Navigation Structure (Sidebar)

| Section | Icon | Route |
|---|---|---|
| Dashboard | LayoutDashboard | `/` |
| Contacts | Users | `/contacts` |
| Sales | ShoppingCart | `/sales` |
| Purchase | Package | `/purchase` |
| Accounting | BookOpen | `/accounting` |
| Inventory | Warehouse | `/inventory` |
| Products | Tag | `/products` |
| Reports | BarChart2 | `/reports` |
| Settings | Settings | `/settings` |

---

## Pages & Screens

### 1. Dashboard (`/`)
- **Top stat cards:** Today's Sales, Last Month Sales, Last 60 Days Sales, Active Customers
- **Sales vs Purchase trend chart** (Recharts bar/line combo, last 12 months)
- **Receivable vs Payable summary cards** (amounts outstanding)
- **Low stock alert table** (items below minimum, out-of-stock badge)

### 2. Contacts (`/contacts`)
- Tabs: **Customers (B2B / B2C)**, **Suppliers**, **Employees**
- Searchable, filterable data table with columns: Name, Type, Mobile, WhatsApp, GST No., Status (Active/Inactive), Approval badge
- **Contact Detail Modal:** Name, billing/shipping address, GST info, contact persons, email
- **Add Contact form**

### 3. Sales (`/sales`)
- Sub-nav tabs: **Invoices**, **Quotations**, **Sales Returns**, **Receipts**, **Proforma / SO**, **OBF**
- Each tab has a data table with: Date, Number, Customer, Amount, Status badge
- **Create Invoice / Quotation modal:** Customer select, line items (product, qty, price, GST), totals
- **Customer Pricing** tab: price list per customer

### 4. Purchase (`/purchase`)
- Sub-nav tabs: **Purchase Entries**, **Purchase Returns**, **Purchase Orders**, **Supplier Quotations**, **Material Indent**, **Expense Vouchers**, **Estimations**
- Similar table + create form pattern as Sales
- PO creation with supplier, items, expected delivery date

### 5. Accounting (`/accounting`)
- Sub-nav: **Chart of Accounts**, **Ledger**, **Contra**, **Debit Notes**, **Credit Notes**, **Receivables**, **Payables**
- Chart of Accounts: tree-style account list grouped by type (Assets, Liabilities, Income, Expense)
- Ledger page: account selector + date range + transaction table
- Receivable/Payable: customer-wise/supplier-wise outstanding with aging

### 6. Inventory (`/inventory`)
- Sub-nav: **Stock Inward**, **Stock Outward**, **GRN**, **Dispatch**, **Packing List**
- Stock summary cards at top (total items, low stock count, out of stock count)
- Each tab: date-filtered table with transaction reference, product, qty, warehouse
- **Adjustments** and **Rate Adjustment** tools

### 7. Products (`/products`)
- Sub-nav: **Product List**, **Categories**, **Brands**, **Price Lists**, **Batch Management**, **Warehouse**
- Product table: SKU, name, category, brand, sell price, stock qty, status badge
- **Add/Edit Product modal:** full fields including barcode, MRP, rack location, HSN, part number
- Bulk import button (UI only for prototype)

### 8. Reports (`/reports`)
- Sub-nav cards/tabs for: Daily Sales, Inventory, GST, Invoice Ledger, Expense Summary, Agent Commission, Outstanding, Production Inward, Transaction History
- Each opens a date-range filtered table with export button (UI only)
- GST report table with CGST/SGST/IGST columns

### 9. Settings (`/settings`)
- Company profile (name, address, GST, logo placeholder)
- Agent configuration
- HSN/Category config
- Warehouse list

---

## Mock Data
Rich sample data across all modules: 20+ products, 15+ contacts, 30+ invoices, purchase entries, stock movements, chart data for 12 months

---

## Key UI Patterns
- Sidebar collapses to icon-only mini mode
- All tables: sortable headers, search input, pagination
- Status badges: color-coded (Paid=green, Pending=yellow, Cancelled=red)
- Breadcrumb on inner pages
- Toast notifications for form actions
