import { pgTable, serial, text, timestamp, date, boolean, integer, numeric } from "drizzle-orm/pg-core";

// ─── Contacts ────────────────────────────────────────────────────────────────
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'B2B', 'B2C', 'Supplier', 'Employee'
  mobile: text("mobile"),
  whatsapp: text("whatsapp"),
  gst: text("gst"),
  email: text("email"),
  status: text("status").default("Active"), // 'Active', 'Inactive'
  approval: text("approval").default("Approved"), // 'Approved', 'Pending', 'Rejected'
  city: text("city"),
  balance: numeric("balance").default("0"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Products ────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").unique(),
  name: text("name").notNull(),
  category: text("category"),
  type: text("type"), // Offset, Digital etc
  description: text("description"),
  gstRate: numeric("gstRate").default("18"),
  hsnCode: text("hsnCode"),
  unit: text("unit").default("PCS"),
  purchasePrice: numeric("purchasePrice").default("0"),
  sellPrice: numeric("sellPrice").default("0"),
  stock: numeric("stock").default("0"),
  minStock: numeric("minStock").default("10"),
  status: text("status").default("Active"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Sales Invoices ───────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoiceNo").unique().notNull(),
  date: date("date").notNull().defaultNow(),
  customerId: integer("customerId").references(() => contacts.id),
  amount: numeric("amount").notNull(),
  tax: numeric("tax").notNull(),
  total: numeric("total").notNull(),
  status: text("status").default("Paid"), // 'Paid', 'Pending', 'Cancelled', 'Draft', 'Partial'
  createdAt: timestamp("createdAt").defaultNow(),
});

export const invoiceItems = pgTable("invoiceItems", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoiceId").references(() => invoices.id),
  name: text("name").notNull(),
  qty: integer("qty").notNull(),
  rate: numeric("rate").notNull(),
  amount: numeric("amount").notNull(),
});

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNo: text("quotationNo").unique().notNull(),
  date: date("date").notNull().defaultNow(),
  customerId: integer("customerId").references(() => contacts.id),
  amount: numeric("amount").notNull(),
  status: text("status").default("Pending"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Sales Returns ────────────────────────────────────────────────────────────
export const salesReturns = pgTable("salesReturns", {
  id: serial("id").primaryKey(),
  returnNo: text("returnNo").unique().notNull(),
  date: date("date").notNull().defaultNow(),
  customerId: integer("customerId").references(() => contacts.id),
  refInvoiceNo: text("refInvoiceNo"),
  amount: numeric("amount").notNull(),
  status: text("status").default("Paid"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Purchase Entries ─────────────────────────────────────────────────────────
export const purchaseEntries = pgTable("purchaseEntries", {
  id: serial("id").primaryKey(),
  purchaseNo: text("purchaseNo").unique().notNull(),
  date: date("date").notNull().defaultNow(),
  supplierId: integer("supplierId").references(() => contacts.id),
  amount: numeric("amount").notNull(),
  tax: numeric("tax").notNull(),
  total: numeric("total").notNull(),
  status: text("status").default("Paid"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const purchaseOrders = pgTable("purchaseOrders", {
  id: serial("id").primaryKey(),
  orderNo: text("orderNo").unique().notNull(),
  date: date("date").notNull().defaultNow(),
  supplierId: integer("supplierId").references(() => contacts.id),
  expectedDate: date("expectedDate"),
  amount: numeric("amount").notNull(),
  status: text("status").default("Pending"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Accounting ──────────────────────────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'Asset', 'Liability', 'Equity', 'Income', 'Expense'
  group: text("group"),
  balance: numeric("balance").default("0"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Stock Movements ──────────────────────────────────────────────────────────
export const stockMovements = pgTable("stockMovements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'Inward', 'Outward'
  date: date("date").notNull().defaultNow(),
  productName: text("productName").notNull(),
  qty: integer("qty").notNull(),
  unit: text("unit"),
  ref: text("ref"), // Could be Invoice # or Purchase #
  createdAt: timestamp("createdAt").defaultNow(),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseNo: text("expenseNo"),
  date: date("date").notNull().defaultNow(),
  category: text("category").notNull(),
  description: text("description"),
  amount: numeric("amount").notNull(),
  payTo: text("payTo"),
  status: text("status").default("Paid"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const companyProfile = pgTable("companyProfile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slogan: text("slogan"),
  address: text("address"),
  gst: text("gst"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  pan: text("pan"),
  state: text("state"),
  pincode: text("pincode"),
  logoUrl: text("logoUrl"),
  bankName: text("bankName"),
  bankBranch: text("bankBranch"),
  accountNumber: text("accountNumber"),
  ifscCode: text("ifscCode"),
  accountName: text("accountName"),
});

export const printSettings = pgTable("printSettings", {
  id: serial("id").primaryKey(),
  defaultPaperSize: text("defaultPaperSize").default("A4"),
  a4Margin: integer("a4Margin").default(10),
  a4FontSize: integer("a4FontSize").default(12),
  thermalWidth: text("thermalWidth").default("80"),
  thermalHeight: text("thermalHeight").default("297"),
  thermalMargin: integer("thermalMargin").default(2),
  thermalFontSize: integer("thermalFontSize").default(10),
});

// ─── RBAC ─────────────────────────────────────────────────────────────────────
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  permissions: text("permissions").notNull(), // JSON string: { module: string, view: boolean, create: boolean, edit: boolean, delete: boolean }[]
  createdAt: timestamp("createdAt").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  roleId: integer("roleId").references(() => roles.id),
  status: text("status").default("Active"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const paymentQrs = pgTable("paymentQrs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("imageUrl").notNull(),
  isActiveForInvoice: boolean("isActiveForInvoice").default(false),
  isActiveForEstimate: boolean("isActiveForEstimate").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  status: text("status").default("Active"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const meterReadings = pgTable("meterReadings", {
  id: serial("id").primaryKey(),
  machineName: text("machineName").notNull(),
  date: date("date").notNull().defaultNow(),
  // Granular Closing Counters
  bwLarge: numeric("bwLarge").default("0"),
  bwSmall: numeric("bwSmall").default("0"),
  colorLarge: numeric("colorLarge").default("0"),
  colorSmall: numeric("colorSmall").default("0"),
  lsColor: numeric("lsColor").default("0"),
  lsMono: numeric("lsMono").default("0"),
  // Derived/Aggregated Fields
  openingReading: numeric("openingReading").notNull(),
  closingReading: numeric("closingReading"),
  totalUsage: numeric("totalUsage"),
  userId: integer("userId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow(),
});
