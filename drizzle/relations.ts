import { relations } from "drizzle-orm/relations";
import { contacts, invoices, purchaseOrders, quotations, invoiceItems, purchaseEntries, salesReturns, roles, users, meterReadings } from "./schema";

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
	purchaseEntries: many(purchaseEntries),
	salesReturns: many(salesReturns),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({one}) => ({
	contact: one(contacts, {
		fields: [purchaseOrders.supplierId],
		references: [contacts.id]
	}),
}));

export const quotationsRelations = relations(quotations, ({one}) => ({
	contact: one(contacts, {
		fields: [quotations.customerId],
		references: [contacts.id]
	}),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({one}) => ({
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id]
	}),
}));

export const purchaseEntriesRelations = relations(purchaseEntries, ({one}) => ({
	contact: one(contacts, {
		fields: [purchaseEntries.supplierId],
		references: [contacts.id]
	}),
}));

export const salesReturnsRelations = relations(salesReturns, ({one}) => ({
	contact: one(contacts, {
		fields: [salesReturns.customerId],
		references: [contacts.id]
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