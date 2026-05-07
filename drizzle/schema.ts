import { pgTable, unique, serial, text, numeric, timestamp, date, foreignKey, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const accounts = pgTable("accounts", {
	id: serial().primaryKey().notNull(),
	code: text().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	group: text(),
	balance: numeric().default('0'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	unique("accounts_code_unique").on(table.code),
]);

export const companyProfile = pgTable("companyProfile", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	address: text(),
	gst: text(),
	phone: text(),
	email: text(),
	website: text(),
	pan: text(),
	state: text(),
	pincode: text(),
	logoUrl: text(),
	slogan: text(),
	bankName: text(),
	bankBranch: text(),
	accountNumber: text(),
	ifscCode: text(),
	accountName: text(),
});

export const expenses = pgTable("expenses", {
	id: serial().primaryKey().notNull(),
	expenseNo: text(),
	date: date().defaultNow().notNull(),
	category: text().notNull(),
	description: text(),
	amount: numeric().notNull(),
	payTo: text(),
	status: text().default('Paid'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	invoiceNo: text().notNull(),
	date: date().defaultNow().notNull(),
	customerId: integer(),
	amount: numeric().notNull(),
	tax: numeric().notNull(),
	total: numeric().notNull(),
	status: text().default('Paid'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	customerName: text(),
	fileName: text(),
	isIgst: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [contacts.id],
			name: "invoices_customerId_contacts_id_fk"
		}),
	unique("invoices_invoiceNo_unique").on(table.invoiceNo),
]);

export const printSettings = pgTable("printSettings", {
	id: serial().primaryKey().notNull(),
	defaultPaperSize: text().default('A4'),
	a4Margin: integer().default(10),
	a4FontSize: integer().default(12),
	thermalWidth: text().default('80'),
	thermalHeight: text().default('297'),
	thermalMargin: integer().default(2),
	thermalFontSize: integer().default(10),
});

export const contacts = pgTable("contacts", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	mobile: text(),
	whatsapp: text(),
	gst: text(),
	email: text(),
	status: text().default('Active'),
	approval: text().default('Approved'),
	city: text(),
	balance: numeric().default('0'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	contactPerson: text(),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	sku: text(),
	name: text().notNull(),
	category: text(),
	sellPrice: numeric().default('0'),
	purchasePrice: numeric().default('0'),
	stock: numeric().default('0'),
	minStock: numeric().default('10'),
	unit: text().default('PCS'),
	status: text().default('Active'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	type: text(),
	description: text(),
	gstRate: numeric().default('18'),
	hsnCode: text(),
	subCategory: text(),
	brand: text(),
	rack: text(),
	partNo: text(),
	barcode: text(),
}, (table) => [
	unique("products_sku_unique").on(table.sku),
]);

export const purchaseOrders = pgTable("purchaseOrders", {
	id: serial().primaryKey().notNull(),
	orderNo: text().notNull(),
	date: date().defaultNow().notNull(),
	supplierId: integer(),
	dueDate: date(),
	amount: numeric().notNull(),
	status: text().default('Pending'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	invNo: text(),
	ourPoNo: text(),
	ourDcNo: text(),
	isIgst: boolean().default(false),
	tax: numeric().notNull(),
	total: numeric().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [contacts.id],
			name: "purchaseOrders_supplierId_contacts_id_fk"
		}),
	unique("purchaseOrders_orderNo_unique").on(table.orderNo),
]);

export const quotations = pgTable("quotations", {
	id: serial().primaryKey().notNull(),
	quotationNo: text().notNull(),
	date: date().defaultNow().notNull(),
	customerId: integer(),
	amount: numeric().notNull(),
	status: text().default('Pending'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	customerName: text(),
	fileName: text(),
	isIgst: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [contacts.id],
			name: "quotations_customerId_contacts_id_fk"
		}),
	unique("quotations_quotationNo_unique").on(table.quotationNo),
]);

export const stockMovements = pgTable("stockMovements", {
	id: serial().primaryKey().notNull(),
	type: text().notNull(),
	date: date().defaultNow().notNull(),
	productName: text().notNull(),
	qty: integer().notNull(),
	unit: text(),
	ref: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const salesReturns = pgTable("salesReturns", {
	id: serial().primaryKey().notNull(),
	returnNo: text().notNull(),
	date: date().defaultNow().notNull(),
	customerId: integer(),
	refInvoiceNo: text(),
	amount: numeric().notNull(),
	status: text().default('Paid'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [contacts.id],
			name: "salesReturns_customerId_contacts_id_fk"
		}),
	unique("salesReturns_returnNo_unique").on(table.returnNo),
]);

export const purchaseEntries = pgTable("purchaseEntries", {
	id: serial().primaryKey().notNull(),
	purchaseNo: text().notNull(),
	date: date().defaultNow().notNull(),
	supplierId: integer(),
	amount: numeric().notNull(),
	tax: numeric().notNull(),
	total: numeric().notNull(),
	status: text().default('Paid'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	dueDate: date(),
	invNo: text(),
	orderNo: text(),
	ourPoNo: text(),
	ourDcNo: text(),
	isIgst: boolean().default(false),
	receivedAmount: numeric().default('0'),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [contacts.id],
			name: "purchaseEntries_supplierId_contacts_id_fk"
		}),
	unique("purchaseEntries_purchaseNo_unique").on(table.purchaseNo),
]);

export const invoiceItems = pgTable("invoiceItems", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer(),
	name: text().notNull(),
	qty: integer().notNull(),
	rate: numeric().notNull(),
	amount: numeric().notNull(),
	hsnCode: text(),
	gstRate: numeric().default('18'),
	category: text(),
	subCategory: text(),
}, (table) => [
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoiceItems_invoiceId_invoices_id_fk"
		}),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	permissions: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	roleId: integer(),
	status: text().default('Active'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "users_roleId_roles_id_fk"
		}),
	unique("users_email_unique").on(table.email),
]);

export const meterReadings = pgTable("meterReadings", {
	id: serial().primaryKey().notNull(),
	machineName: text().notNull(),
	date: date().defaultNow().notNull(),
	openingReading: numeric().notNull(),
	closingReading: numeric(),
	totalUsage: numeric(),
	userId: integer(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	bwLarge: numeric().default('0'),
	bwSmall: numeric().default('0'),
	colorLarge: numeric().default('0'),
	colorSmall: numeric().default('0'),
	lsColor: numeric().default('0'),
	lsMono: numeric().default('0'),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "meterReadings_userId_users_id_fk"
		}),
]);

export const machines = pgTable("machines", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	status: text().default('Active'),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	unique("machines_name_unique").on(table.name),
]);

export const priceLists = pgTable("priceLists", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	effectiveFrom: date(),
	status: text().default('Active'),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
});

export const priceListItems = pgTable("priceListItems", {
	id: serial().primaryKey().notNull(),
	priceListId: integer(),
	productId: integer(),
	customPrice: numeric().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.priceListId],
			foreignColumns: [priceLists.id],
			name: "priceListItems_priceListId_priceLists_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "priceListItems_productId_products_id_fk"
		}),
]);

export const purchaseItems = pgTable("purchaseItems", {
	id: serial().primaryKey().notNull(),
	purchaseId: integer(),
	purchaseOrderId: integer(),
	name: text().notNull(),
	sku: text(),
	qty: numeric().notNull(),
	rate: numeric().notNull(),
	amount: numeric().notNull(),
	hsnCode: text(),
	gstRate: numeric().default('18'),
	packing: text(),
	unit: text().default('Nos'),
}, (table) => [
	foreignKey({
			columns: [table.purchaseId],
			foreignColumns: [purchaseEntries.id],
			name: "purchaseItems_purchaseId_purchaseEntries_id_fk"
		}),
	foreignKey({
			columns: [table.purchaseOrderId],
			foreignColumns: [purchaseOrders.id],
			name: "purchaseItems_purchaseOrderId_purchaseOrders_id_fk"
		}),
]);

export const quotationItems = pgTable("quotationItems", {
	id: serial().primaryKey().notNull(),
	quotationId: integer(),
	name: text(),
	qty: numeric(),
	rate: numeric(),
	amount: numeric(),
	hsnCode: text(),
	gstRate: numeric().default('18'),
	category: text(),
	subCategory: text(),
}, (table) => [
	foreignKey({
			columns: [table.quotationId],
			foreignColumns: [quotations.id],
			name: "quotationItems_quotationId_quotations_id_fk"
		}),
]);

export const paymentQrs = pgTable("paymentQrs", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	imageUrl: text(),
	isActiveForInvoice: boolean().default(false),
	isActiveForEstimate: boolean().default(false),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	upiId: text(),
	payeeName: text(),
	isDynamic: boolean().default(false),
});

export const productBrands = pgTable("productBrands", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	unique("productBrands_name_unique").on(table.name),
]);

export const productCategories = pgTable("productCategories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	unique("productCategories_name_unique").on(table.name),
]);
