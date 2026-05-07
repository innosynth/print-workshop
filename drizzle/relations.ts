import { relations } from "drizzle-orm/relations";
import { contacts, invoices, purchaseOrders, quotations, salesReturns, purchaseEntries, invoiceItems, roles, users, meterReadings, priceLists, priceListItems, products, purchaseItems, quotationItems } from "./schema";

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	contact: one(contacts, {
		fields: [invoices.customerId],
		references: [contacts.id]
	}),
	invoiceItems: many(invoiceItems),
}));

export const contactsRelations = relations(contacts, ({many}) => ({
	invoices: many(invoices),
	purchaseOrders: many(purchaseOrders),
	quotations: many(quotations),
	salesReturns: many(salesReturns),
	purchaseEntries: many(purchaseEntries),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({one, many}) => ({
	contact: one(contacts, {
		fields: [purchaseOrders.supplierId],
		references: [contacts.id]
	}),
	purchaseItems: many(purchaseItems),
}));

export const quotationsRelations = relations(quotations, ({one, many}) => ({
	contact: one(contacts, {
		fields: [quotations.customerId],
		references: [contacts.id]
	}),
	quotationItems: many(quotationItems),
}));

export const salesReturnsRelations = relations(salesReturns, ({one}) => ({
	contact: one(contacts, {
		fields: [salesReturns.customerId],
		references: [contacts.id]
	}),
}));

export const purchaseEntriesRelations = relations(purchaseEntries, ({one, many}) => ({
	contact: one(contacts, {
		fields: [purchaseEntries.supplierId],
		references: [contacts.id]
	}),
	purchaseItems: many(purchaseItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id]
	}),
	meterReadings: many(meterReadings),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(users),
}));

export const meterReadingsRelations = relations(meterReadings, ({one}) => ({
	user: one(users, {
		fields: [meterReadings.userId],
		references: [users.id]
	}),
}));

export const priceListItemsRelations = relations(priceListItems, ({one}) => ({
	priceList: one(priceLists, {
		fields: [priceListItems.priceListId],
		references: [priceLists.id]
	}),
	product: one(products, {
		fields: [priceListItems.productId],
		references: [products.id]
	}),
}));

export const priceListsRelations = relations(priceLists, ({many}) => ({
	priceListItems: many(priceListItems),
}));

export const productsRelations = relations(products, ({many}) => ({
	priceListItems: many(priceListItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({one}) => ({
	purchaseEntry: one(purchaseEntries, {
		fields: [purchaseItems.purchaseId],
		references: [purchaseEntries.id]
	}),
	purchaseOrder: one(purchaseOrders, {
		fields: [purchaseItems.purchaseOrderId],
		references: [purchaseOrders.id]
	}),
}));

export const quotationItemsRelations = relations(quotationItems, ({one}) => ({
	quotation: one(quotations, {
		fields: [quotationItems.quotationId],
		references: [quotations.id]
	}),
}));