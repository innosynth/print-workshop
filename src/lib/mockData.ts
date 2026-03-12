// ── CloudZoo 360 – Mock Data ──────────────────────────────────────────────────

export type ContactType = "B2B" | "B2C" | "Supplier" | "Employee";
export type Status = "Active" | "Inactive";
export type ApprovalStatus = "Approved" | "Pending" | "Rejected";
export type TxStatus = "Paid" | "Pending" | "Cancelled" | "Draft" | "Partial";

// ─── Contacts ────────────────────────────────────────────────────────────────
export const contacts = [
  { id: "C001", name: "Raj Prints Pvt Ltd", type: "B2B" as ContactType, mobile: "9876543210", whatsapp: "9876543210", gst: "27AABCR1234F1Z5", email: "raj@rajprints.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Mumbai", balance: 45200 },
  { id: "C002", name: "Suresh Graphics", type: "B2B" as ContactType, mobile: "9812345678", whatsapp: "9812345678", gst: "29AACCS5678G1Z3", email: "suresh@sgfx.in", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Bangalore", balance: 12800 },
  { id: "C003", name: "Meena Sharma", type: "B2C" as ContactType, mobile: "9934567890", whatsapp: "9934567890", gst: "", email: "meena.sharma@gmail.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Delhi", balance: 3200 },
  { id: "C004", name: "Print House Co.", type: "B2B" as ContactType, mobile: "9845678901", whatsapp: "9845678901", gst: "24AABCP2345H1Z8", email: "orders@printhouse.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Ahmedabad", balance: 78900 },
  { id: "C005", name: "Amit Banners", type: "B2B" as ContactType, mobile: "9756789012", whatsapp: "9756789012", gst: "06AABCA6789J1Z1", email: "amit@amitbanners.com", status: "Inactive" as Status, approval: "Pending" as ApprovalStatus, city: "Gurgaon", balance: 0 },
  { id: "C006", name: "Kavita Verma", type: "B2C" as ContactType, mobile: "9867890123", whatsapp: "9867890123", gst: "", email: "kavita.v@hotmail.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Pune", balance: 1500 },
  { id: "C007", name: "Global Flex Media", type: "B2B" as ContactType, mobile: "9978901234", whatsapp: "9978901234", gst: "19AABCG3456K1Z6", email: "info@globalflexmedia.in", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Kolkata", balance: 34600 },
  { id: "C008", name: "Neon Sign Studio", type: "B2B" as ContactType, mobile: "9989012345", whatsapp: "9989012345", gst: "33AABCN4567L1Z2", email: "studio@neonsign.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Chennai", balance: 22100 },
  { id: "S001", name: "Supreme Inks Ltd", type: "Supplier" as ContactType, mobile: "9890123456", whatsapp: "9890123456", gst: "27AABCS7890M1Z9", email: "purchase@supremeinks.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Mumbai", balance: -18500 },
  { id: "S002", name: "Flex Roll Suppliers", type: "Supplier" as ContactType, mobile: "9901234567", whatsapp: "9901234567", gst: "08AABCF8901N1Z4", email: "sales@flexroll.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Jaipur", balance: -9800 },
  { id: "S003", name: "Substrate World", type: "Supplier" as ContactType, mobile: "9812367890", whatsapp: "9812367890", gst: "29AABCS0123P1Z7", email: "info@substrateworld.in", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Bangalore", balance: -31200 },
  { id: "E001", name: "Arjun Kumar", type: "Employee" as ContactType, mobile: "9823456789", whatsapp: "9823456789", gst: "", email: "arjun.k@cloudzoo360.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Mumbai", balance: 0 },
  { id: "E002", name: "Priya Singh", type: "Employee" as ContactType, mobile: "9834567890", whatsapp: "9834567890", gst: "", email: "priya.s@cloudzoo360.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Mumbai", balance: 0 },
  { id: "E003", name: "Rahul Mehta", type: "Employee" as ContactType, mobile: "9745678901", whatsapp: "9745678901", gst: "", email: "rahul.m@cloudzoo360.com", status: "Active" as Status, approval: "Approved" as ApprovalStatus, city: "Mumbai", balance: 0 },
];

// ─── Products ────────────────────────────────────────────────────────────────
export const categories = ["Flex & Vinyl", "Paper & Board", "Inks & Chemicals", "Hardware & Spares", "Laminates", "Fabric Media"];
export const brands = ["3M", "Avery", "HP", "Epson", "Orafol", "LG Hausys", "Neschen", "Aslan"];

export const products = [
  { id: "P001", sku: "FLX-001", name: "Star Flex Banner 280GSM", category: "Flex & Vinyl", brand: "Orafol", sellPrice: 38, purchasePrice: 22, stock: 450, minStock: 100, unit: "Sqft", hsn: "3921", status: "Active" as Status, rack: "A-01", barcode: "8901234567890" },
  { id: "P002", sku: "FLX-002", name: "Premium Backlit Flex", category: "Flex & Vinyl", brand: "Orafol", sellPrice: 55, purchasePrice: 32, stock: 280, minStock: 80, unit: "Sqft", hsn: "3921", status: "Active" as Status, rack: "A-02", barcode: "8901234567891" },
  { id: "P003", sku: "VNL-001", name: "Self Adhesive Vinyl Gloss", category: "Flex & Vinyl", brand: "Avery", sellPrice: 62, purchasePrice: 38, stock: 160, minStock: 50, unit: "Sqft", hsn: "3919", status: "Active" as Status, rack: "A-03", barcode: "8901234567892" },
  { id: "P004", sku: "VNL-002", name: "One Way Vision Film", category: "Flex & Vinyl", brand: "3M", sellPrice: 95, purchasePrice: 58, stock: 40, minStock: 50, unit: "Sqft", hsn: "3919", status: "Active" as Status, rack: "A-04", barcode: "8901234567893" },
  { id: "P005", sku: "PPR-001", name: "Photo Paper Glossy 260GSM", category: "Paper & Board", brand: "Epson", sellPrice: 28, purchasePrice: 15, stock: 0, minStock: 200, unit: "Sqft", hsn: "4810", status: "Active" as Status, rack: "B-01", barcode: "8901234567894" },
  { id: "P006", sku: "PPR-002", name: "Canvas Satin 380GSM", category: "Paper & Board", brand: "HP", sellPrice: 72, purchasePrice: 44, stock: 120, minStock: 60, unit: "Sqft", hsn: "4810", status: "Active" as Status, rack: "B-02", barcode: "8901234567895" },
  { id: "P007", sku: "INK-001", name: "Eco Solvent Ink Cyan 1L", category: "Inks & Chemicals", brand: "Epson", sellPrice: 1200, purchasePrice: 750, stock: 24, minStock: 10, unit: "Bottle", hsn: "3215", status: "Active" as Status, rack: "C-01", barcode: "8901234567896" },
  { id: "P008", sku: "INK-002", name: "Eco Solvent Ink Magenta 1L", category: "Inks & Chemicals", brand: "Epson", sellPrice: 1200, purchasePrice: 750, stock: 18, minStock: 10, unit: "Bottle", hsn: "3215", status: "Active" as Status, rack: "C-02", barcode: "8901234567897" },
  { id: "P009", sku: "INK-003", name: "Eco Solvent Ink Yellow 1L", category: "Inks & Chemicals", brand: "Epson", sellPrice: 1200, purchasePrice: 750, stock: 8, minStock: 10, unit: "Bottle", hsn: "3215", status: "Active" as Status, rack: "C-03", barcode: "8901234567898" },
  { id: "P010", sku: "INK-004", name: "Eco Solvent Ink Black 1L", category: "Inks & Chemicals", brand: "Epson", sellPrice: 1100, purchasePrice: 680, stock: 30, minStock: 12, unit: "Bottle", hsn: "3215", status: "Active" as Status, rack: "C-04", barcode: "8901234567899" },
  { id: "P011", sku: "LAM-001", name: "Gloss Laminate Film 1.27m", category: "Laminates", brand: "Neschen", sellPrice: 45, purchasePrice: 28, stock: 200, minStock: 50, unit: "Sqft", hsn: "3920", status: "Active" as Status, rack: "D-01", barcode: "8901234567900" },
  { id: "P012", sku: "LAM-002", name: "Matte Laminate Film 1.27m", category: "Laminates", brand: "Neschen", sellPrice: 48, purchasePrice: 30, stock: 150, minStock: 50, unit: "Sqft", hsn: "3920", status: "Active" as Status, rack: "D-02", barcode: "8901234567901" },
  { id: "P013", sku: "HRD-001", name: "Print Head Epson DX5", category: "Hardware & Spares", brand: "Epson", sellPrice: 18500, purchasePrice: 14000, stock: 3, minStock: 2, unit: "Pcs", hsn: "8443", status: "Active" as Status, rack: "E-01", barcode: "8901234567902" },
  { id: "P014", sku: "HRD-002", name: "Encoder Strip 180dpi", category: "Hardware & Spares", brand: "Aslan", sellPrice: 850, purchasePrice: 550, stock: 12, minStock: 5, unit: "Pcs", hsn: "8443", status: "Active" as Status, rack: "E-02", barcode: "8901234567903" },
  { id: "P015", sku: "FAB-001", name: "Polyester Fabric 220GSM", category: "Fabric Media", brand: "LG Hausys", sellPrice: 82, purchasePrice: 52, stock: 0, minStock: 100, unit: "Sqft", hsn: "5407", status: "Active" as Status, rack: "F-01", barcode: "8901234567904" },
  { id: "P016", sku: "FAB-002", name: "Dye Sub Transfer Paper", category: "Fabric Media", brand: "Neschen", sellPrice: 18, purchasePrice: 10, stock: 600, minStock: 150, unit: "Sqft", hsn: "4823", status: "Active" as Status, rack: "F-02", barcode: "8901234567905" },
  { id: "P017", sku: "VNL-003", name: "Floor Graphics Laminate", category: "Flex & Vinyl", brand: "3M", sellPrice: 110, purchasePrice: 68, stock: 25, minStock: 30, unit: "Sqft", hsn: "3919", status: "Active" as Status, rack: "A-05", barcode: "8901234567906" },
  { id: "P018", sku: "INK-005", name: "UV Curable Ink Set CMYK", category: "Inks & Chemicals", brand: "HP", sellPrice: 4800, purchasePrice: 3200, stock: 6, minStock: 4, unit: "Set", hsn: "3215", status: "Active" as Status, rack: "C-05", barcode: "8901234567907" },
  { id: "P019", sku: "PPR-003", name: "Backlit Duratrans Film", category: "Paper & Board", brand: "HP", sellPrice: 95, purchasePrice: 60, stock: 80, minStock: 40, unit: "Sqft", hsn: "3921", status: "Active" as Status, rack: "B-03", barcode: "8901234567908" },
  { id: "P020", sku: "HRD-003", name: "Wiper Blade Assembly", category: "Hardware & Spares", brand: "Epson", sellPrice: 650, purchasePrice: 420, stock: 18, minStock: 5, unit: "Pcs", hsn: "8443", status: "Active" as Status, rack: "E-03", barcode: "8901234567909" },
];

// ─── Sales Invoices ───────────────────────────────────────────────────────────
export const invoices = [
  { id: "INV-2024-001", date: "2024-03-01", customer: "Raj Prints Pvt Ltd", customerId: "C001", amount: 18500, tax: 1665, total: 20165, status: "Paid" as TxStatus, items: 4 },
  { id: "INV-2024-002", date: "2024-03-05", customer: "Print House Co.", customerId: "C004", amount: 32400, tax: 2916, total: 35316, status: "Pending" as TxStatus, items: 6 },
  { id: "INV-2024-003", date: "2024-03-08", customer: "Suresh Graphics", customerId: "C002", amount: 9800, tax: 882, total: 10682, status: "Paid" as TxStatus, items: 2 },
  { id: "INV-2024-004", date: "2024-03-10", customer: "Global Flex Media", customerId: "C007", amount: 14200, tax: 1278, total: 15478, status: "Partial" as TxStatus, items: 3 },
  { id: "INV-2024-005", date: "2024-03-12", customer: "Neon Sign Studio", customerId: "C008", amount: 8900, tax: 801, total: 9701, status: "Paid" as TxStatus, items: 2 },
  { id: "INV-2024-006", date: "2024-03-15", customer: "Raj Prints Pvt Ltd", customerId: "C001", amount: 24600, tax: 2214, total: 26814, status: "Pending" as TxStatus, items: 5 },
  { id: "INV-2024-007", date: "2024-03-18", customer: "Print House Co.", customerId: "C004", amount: 41200, tax: 3708, total: 44908, status: "Paid" as TxStatus, items: 8 },
  { id: "INV-2024-008", date: "2024-03-20", customer: "Meena Sharma", customerId: "C003", amount: 3200, tax: 288, total: 3488, status: "Paid" as TxStatus, items: 1 },
  { id: "INV-2024-009", date: "2024-03-22", customer: "Suresh Graphics", customerId: "C002", amount: 15600, tax: 1404, total: 17004, status: "Cancelled" as TxStatus, items: 3 },
  { id: "INV-2024-010", date: "2024-03-25", customer: "Global Flex Media", customerId: "C007", amount: 22300, tax: 2007, total: 24307, status: "Pending" as TxStatus, items: 4 },
  { id: "INV-2024-011", date: "2024-04-01", customer: "Neon Sign Studio", customerId: "C008", amount: 12100, tax: 1089, total: 13189, status: "Paid" as TxStatus, items: 2 },
  { id: "INV-2024-012", date: "2024-04-05", customer: "Raj Prints Pvt Ltd", customerId: "C001", amount: 38900, tax: 3501, total: 42401, status: "Paid" as TxStatus, items: 7 },
  { id: "INV-2024-013", date: "2024-04-08", customer: "Print House Co.", customerId: "C004", amount: 17800, tax: 1602, total: 19402, status: "Pending" as TxStatus, items: 3 },
  { id: "INV-2024-014", date: "2024-04-12", customer: "Kavita Verma", customerId: "C006", amount: 1500, tax: 135, total: 1635, status: "Paid" as TxStatus, items: 1 },
  { id: "INV-2024-015", date: "2024-04-15", customer: "Suresh Graphics", customerId: "C002", amount: 28400, tax: 2556, total: 30956, status: "Paid" as TxStatus, items: 5 },
  { id: "INV-2024-016", date: "2024-05-02", customer: "Global Flex Media", customerId: "C007", amount: 19600, tax: 1764, total: 21364, status: "Paid" as TxStatus, items: 4 },
  { id: "INV-2024-017", date: "2024-05-10", customer: "Print House Co.", customerId: "C004", amount: 52100, tax: 4689, total: 56789, status: "Partial" as TxStatus, items: 9 },
  { id: "INV-2024-018", date: "2024-05-18", customer: "Raj Prints Pvt Ltd", customerId: "C001", amount: 31200, tax: 2808, total: 34008, status: "Paid" as TxStatus, items: 6 },
];

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotations = [
  { id: "QT-2024-001", date: "2024-03-02", customer: "Amit Banners", amount: 12400, status: "Draft" as TxStatus },
  { id: "QT-2024-002", date: "2024-03-09", customer: "Raj Prints Pvt Ltd", amount: 18900, status: "Paid" as TxStatus },
  { id: "QT-2024-003", date: "2024-03-14", customer: "Suresh Graphics", amount: 9200, status: "Pending" as TxStatus },
  { id: "QT-2024-004", date: "2024-04-03", customer: "Print House Co.", amount: 28500, status: "Paid" as TxStatus },
  { id: "QT-2024-005", date: "2024-04-20", customer: "Global Flex Media", amount: 15300, status: "Draft" as TxStatus },
];

// ─── Sales Returns ────────────────────────────────────────────────────────────
export const salesReturns = [
  { id: "SR-2024-001", date: "2024-03-15", customer: "Suresh Graphics", refInvoice: "INV-2024-003", amount: 2400, status: "Paid" as TxStatus },
  { id: "SR-2024-002", date: "2024-04-10", customer: "Print House Co.", refInvoice: "INV-2024-002", amount: 5600, status: "Pending" as TxStatus },
  { id: "SR-2024-003", date: "2024-04-28", customer: "Raj Prints Pvt Ltd", refInvoice: "INV-2024-006", amount: 3100, status: "Paid" as TxStatus },
];

// ─── Purchase Entries ─────────────────────────────────────────────────────────
export const purchaseEntries = [
  { id: "PUR-2024-001", date: "2024-03-03", supplier: "Supreme Inks Ltd", amount: 28500, tax: 5130, total: 33630, status: "Paid" as TxStatus, items: 5 },
  { id: "PUR-2024-002", date: "2024-03-10", supplier: "Flex Roll Suppliers", amount: 18200, tax: 3276, total: 21476, status: "Pending" as TxStatus, items: 3 },
  { id: "PUR-2024-003", date: "2024-03-18", supplier: "Substrate World", amount: 42600, tax: 7668, total: 50268, status: "Paid" as TxStatus, items: 7 },
  { id: "PUR-2024-004", date: "2024-04-02", supplier: "Supreme Inks Ltd", amount: 22400, tax: 4032, total: 26432, status: "Paid" as TxStatus, items: 4 },
  { id: "PUR-2024-005", date: "2024-04-15", supplier: "Flex Roll Suppliers", amount: 31800, tax: 5724, total: 37524, status: "Partial" as TxStatus, items: 6 },
  { id: "PUR-2024-006", date: "2024-04-28", supplier: "Substrate World", amount: 19600, tax: 3528, total: 23128, status: "Pending" as TxStatus, items: 3 },
  { id: "PUR-2024-007", date: "2024-05-08", supplier: "Supreme Inks Ltd", amount: 35200, tax: 6336, total: 41536, status: "Paid" as TxStatus, items: 6 },
  { id: "PUR-2024-008", date: "2024-05-20", supplier: "Flex Roll Suppliers", amount: 14800, tax: 2664, total: 17464, status: "Paid" as TxStatus, items: 2 },
];

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const purchaseOrders = [
  { id: "PO-2024-001", date: "2024-03-01", supplier: "Supreme Inks Ltd", expectedDate: "2024-03-08", amount: 28500, status: "Paid" as TxStatus },
  { id: "PO-2024-002", date: "2024-03-08", supplier: "Flex Roll Suppliers", expectedDate: "2024-03-15", amount: 18200, status: "Pending" as TxStatus },
  { id: "PO-2024-003", date: "2024-04-01", supplier: "Substrate World", expectedDate: "2024-04-10", amount: 42600, status: "Paid" as TxStatus },
  { id: "PO-2024-004", date: "2024-04-12", supplier: "Supreme Inks Ltd", expectedDate: "2024-04-18", amount: 22400, status: "Pending" as TxStatus },
];

// ─── Ledger Accounts ──────────────────────────────────────────────────────────
export const chartOfAccounts = [
  { id: "ACC-001", code: "1001", name: "Cash in Hand", type: "Asset", group: "Current Assets", balance: 124500 },
  { id: "ACC-002", code: "1002", name: "Bank - HDFC Current", type: "Asset", group: "Current Assets", balance: 845200 },
  { id: "ACC-003", code: "1003", name: "Accounts Receivable", type: "Asset", group: "Current Assets", balance: 198700 },
  { id: "ACC-004", code: "1010", name: "Machinery & Equipment", type: "Asset", group: "Fixed Assets", balance: 1250000 },
  { id: "ACC-005", code: "1011", name: "Accumulated Depreciation", type: "Asset", group: "Fixed Assets", balance: -180000 },
  { id: "ACC-006", code: "2001", name: "Accounts Payable", type: "Liability", group: "Current Liabilities", balance: -59500 },
  { id: "ACC-007", code: "2002", name: "GST Payable", type: "Liability", group: "Current Liabilities", balance: -42800 },
  { id: "ACC-008", code: "2010", name: "Bank Loan - HDFC", type: "Liability", group: "Long-term Liabilities", balance: -450000 },
  { id: "ACC-009", code: "3001", name: "Owner's Capital", type: "Equity", group: "Equity", balance: -1200000 },
  { id: "ACC-010", code: "3002", name: "Retained Earnings", type: "Equity", group: "Equity", balance: -286100 },
  { id: "ACC-011", code: "4001", name: "Sales Revenue", type: "Income", group: "Revenue", balance: -892400 },
  { id: "ACC-012", code: "4002", name: "Service Income", type: "Income", group: "Revenue", balance: -124800 },
  { id: "ACC-013", code: "5001", name: "Cost of Goods Sold", type: "Expense", group: "Direct Expenses", balance: 542600 },
  { id: "ACC-014", code: "5002", name: "Purchase - Inks", type: "Expense", group: "Direct Expenses", balance: 128400 },
  { id: "ACC-015", code: "5003", name: "Purchase - Media", type: "Expense", group: "Direct Expenses", balance: 214800 },
  { id: "ACC-016", code: "6001", name: "Salaries & Wages", type: "Expense", group: "Operating Expenses", balance: 186000 },
  { id: "ACC-017", code: "6002", name: "Rent Expense", type: "Expense", group: "Operating Expenses", balance: 84000 },
  { id: "ACC-018", code: "6003", name: "Electricity Charges", type: "Expense", group: "Operating Expenses", balance: 32400 },
  { id: "ACC-019", code: "6004", name: "Printing Supplies", type: "Expense", group: "Operating Expenses", balance: 18600 },
  { id: "ACC-020", code: "6005", name: "Freight & Transport", type: "Expense", group: "Operating Expenses", balance: 24800 },
];

// ─── Stock Movements ──────────────────────────────────────────────────────────
export const stockMovements = [
  { id: "GRN-2024-001", type: "Inward", date: "2024-03-04", product: "Star Flex Banner 280GSM", qty: 500, unit: "Sqft", warehouse: "Main Store", ref: "PUR-2024-001" },
  { id: "GRN-2024-002", type: "Inward", date: "2024-03-11", product: "Eco Solvent Ink Cyan 1L", qty: 24, unit: "Bottle", warehouse: "Main Store", ref: "PUR-2024-002" },
  { id: "GRN-2024-003", type: "Inward", date: "2024-03-19", product: "Self Adhesive Vinyl Gloss", qty: 200, unit: "Sqft", warehouse: "Main Store", ref: "PUR-2024-003" },
  { id: "DSP-2024-001", type: "Outward", date: "2024-03-06", product: "Star Flex Banner 280GSM", qty: 120, unit: "Sqft", warehouse: "Main Store", ref: "INV-2024-001" },
  { id: "DSP-2024-002", type: "Outward", date: "2024-03-12", product: "Premium Backlit Flex", qty: 80, unit: "Sqft", warehouse: "Main Store", ref: "INV-2024-002" },
  { id: "DSP-2024-003", type: "Outward", date: "2024-03-22", product: "Eco Solvent Ink Cyan 1L", qty: 6, unit: "Bottle", warehouse: "Main Store", ref: "INV-2024-005" },
  { id: "GRN-2024-004", type: "Inward", date: "2024-04-03", product: "Photo Paper Glossy 260GSM", qty: 300, unit: "Sqft", warehouse: "Main Store", ref: "PUR-2024-004" },
  { id: "GRN-2024-005", type: "Inward", date: "2024-04-16", product: "Gloss Laminate Film 1.27m", qty: 400, unit: "Sqft", warehouse: "Branch Store", ref: "PUR-2024-005" },
  { id: "DSP-2024-004", type: "Outward", date: "2024-04-08", product: "Canvas Satin 380GSM", qty: 60, unit: "Sqft", warehouse: "Main Store", ref: "INV-2024-011" },
  { id: "DSP-2024-005", type: "Outward", date: "2024-04-18", product: "Self Adhesive Vinyl Gloss", qty: 90, unit: "Sqft", warehouse: "Main Store", ref: "INV-2024-013" },
];

// ─── Chart / Dashboard Data ───────────────────────────────────────────────────
export const monthlySalesPurchase = [
  { month: "Apr '23", sales: 284000, purchase: 168000 },
  { month: "May '23", sales: 312000, purchase: 194000 },
  { month: "Jun '23", sales: 298000, purchase: 182000 },
  { month: "Jul '23", sales: 341000, purchase: 208000 },
  { month: "Aug '23", sales: 325000, purchase: 196000 },
  { month: "Sep '23", sales: 368000, purchase: 220000 },
  { month: "Oct '23", sales: 402000, purchase: 248000 },
  { month: "Nov '23", sales: 445000, purchase: 272000 },
  { month: "Dec '23", sales: 512000, purchase: 310000 },
  { month: "Jan '24", sales: 389000, purchase: 235000 },
  { month: "Feb '24", sales: 418000, purchase: 256000 },
  { month: "Mar '24", sales: 476000, purchase: 290000 },
];

export const dashboardStats = {
  todaySales: 38450,
  lastMonthSales: 418000,
  last60DaysSales: 894000,
  activeCustomers: 8,
  receivableOutstanding: 198700,
  payableOutstanding: 59500,
  lowStockCount: products.filter(p => p.stock > 0 && p.stock < p.minStock).length,
  outOfStockCount: products.filter(p => p.stock === 0).length,
};

// ─── Expense Vouchers ─────────────────────────────────────────────────────────
export const expenses = [
  { id: "EXP-2024-001", date: "2024-03-02", category: "Rent", description: "Office & workshop rent - March", amount: 42000, payTo: "Property Owner", status: "Paid" as TxStatus },
  { id: "EXP-2024-002", date: "2024-03-05", category: "Electricity", description: "MSEB bill February", amount: 8200, payTo: "MSEB", status: "Paid" as TxStatus },
  { id: "EXP-2024-003", date: "2024-03-10", category: "Salary", description: "Staff salaries - March advance", amount: 62000, payTo: "Staff", status: "Paid" as TxStatus },
  { id: "EXP-2024-004", date: "2024-03-18", category: "Transport", description: "Freight charges - delivery", amount: 4800, payTo: "Logistic Co.", status: "Paid" as TxStatus },
  { id: "EXP-2024-005", date: "2024-04-01", category: "Rent", description: "Office & workshop rent - April", amount: 42000, payTo: "Property Owner", status: "Paid" as TxStatus },
  { id: "EXP-2024-006", date: "2024-04-06", category: "Maintenance", description: "Printer maintenance service", amount: 12500, payTo: "TechPrint Services", status: "Pending" as TxStatus },
  { id: "EXP-2024-007", date: "2024-04-15", category: "Salary", description: "Staff salaries - April", amount: 62000, payTo: "Staff", status: "Paid" as TxStatus },
  { id: "EXP-2024-008", date: "2024-05-01", category: "Rent", description: "Office & workshop rent - May", amount: 42000, payTo: "Property Owner", status: "Pending" as TxStatus },
];

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const warehouses = [
  { id: "WH-001", name: "Main Store", location: "Mumbai - Andheri East", capacity: 10000, incharge: "Arjun Kumar" },
  { id: "WH-002", name: "Branch Store", location: "Mumbai - Bandra West", capacity: 4000, incharge: "Priya Singh" },
  { id: "WH-003", name: "Production Floor", location: "Mumbai - Andheri East", capacity: 2000, incharge: "Rahul Mehta" },
];
