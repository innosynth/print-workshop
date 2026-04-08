import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/index';
import { invoices, invoiceItems, quotations, salesReturns, purchaseEntries, purchaseOrders, contacts } from '../src/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { resource, type } = request.query;
  const method = request.method;

  try {
    if (resource === 'invoices') {
      if (method === 'GET') {
        const data = await db.select({
          id: invoices.id, invoiceNo: invoices.invoiceNo, date: invoices.date,
          amount: invoices.amount, tax: invoices.tax, total: invoices.total,
          status: invoices.status, customerName: contacts.name, customerId: contacts.id,
        }).from(invoices).leftJoin(contacts, eq(invoices.customerId, contacts.id)).orderBy(desc(invoices.createdAt));
        return response.status(200).json(data);
      }
      if (method === 'POST') {
        const { items, ...invoiceData } = request.body;
        const newInvoice = await db.insert(invoices).values(invoiceData).returning();
        if (items?.length > 0) {
          const itemsWithId = items.map((item: any) => ({ ...item, invoiceId: newInvoice[0].id }));
          await db.insert(invoiceItems).values(itemsWithId);
        }
        return response.status(200).json(newInvoice[0]);
      }
    }

    if (resource === 'quotations') {
      if (method === 'GET') {
        const data = await db.select({
          id: quotations.id, quotationNo: quotations.quotationNo, date: quotations.date,
          amount: quotations.amount, status: quotations.status, customerName: contacts.name,
        }).from(quotations).leftJoin(contacts, eq(quotations.customerId, contacts.id)).orderBy(desc(quotations.createdAt));
        return response.status(200).json(data);
      }
    }

    if (resource === 'returns') {
      if (method === 'GET') {
        const data = await db.select({
          id: salesReturns.id, returnNo: salesReturns.returnNo, date: salesReturns.date,
          amount: salesReturns.amount, status: salesReturns.status, customerName: contacts.name,
        }).from(salesReturns).leftJoin(contacts, eq(salesReturns.customerId, contacts.id)).orderBy(desc(salesReturns.createdAt));
        return response.status(200).json(data);
      }
    }

    if (resource === 'gst_report') {
      const { returnFor } = request.query;
      // For now, we mainly support Invoice-based GST reporting
      const lines = await db.select({
        companyName: contacts.name,
        gstin: contacts.gst,
        invoiceNo: invoices.invoiceNo,
        date: invoices.date,
        lineName: invoiceItems.name,
        qty: invoiceItems.qty,
        rate: invoiceItems.rate,
        taxableValue: invoiceItems.amount,
        totalTax: invoices.tax, // Note: This is invoice-level, ideally we want line-level tax
        grandTotal: invoices.total,
        placeOfSupply: contacts.city
      })
      .from(invoiceItems)
      .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .leftJoin(contacts, eq(invoices.customerId, contacts.id))
      .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
      
      return response.status(200).json(lines);
    }

    if (resource === 'purchases') {
      if (method === 'GET') {
        if (type === 'orders') {
          const data = await db.select({
            id: purchaseOrders.id, orderNo: purchaseOrders.orderNo, date: purchaseOrders.date,
            amount: purchaseOrders.amount, status: purchaseOrders.status, supplierName: contacts.name,
          }).from(purchaseOrders).leftJoin(contacts, eq(purchaseOrders.supplierId, contacts.id)).orderBy(desc(purchaseOrders.createdAt));
          return response.status(200).json(data);
        } else {
          const data = await db.select({
            id: purchaseEntries.id, purchaseNo: purchaseEntries.purchaseNo, date: purchaseEntries.date,
            amount: purchaseEntries.amount, status: purchaseEntries.status, supplierName: contacts.name,
          }).from(purchaseEntries).leftJoin(contacts, eq(purchaseEntries.supplierId, contacts.id)).orderBy(desc(purchaseEntries.createdAt));
          return response.status(200).json(data);
        }
      }
    }

    return response.status(404).json({ error: 'Resource not found' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
