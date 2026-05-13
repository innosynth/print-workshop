import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index.js';
import { invoices, invoiceItems, quotations, quotationItems, salesReturns, purchaseEntries, purchaseOrders, purchaseItems, contacts } from '../db/schema.js';
import { eq, desc, sql, like, notLike } from 'drizzle-orm';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { resource, type } = request.query;
  const method = request.method;

  try {
    if (resource === 'invoices' || resource === 'estimates') {
      if (method === 'GET') {
        const { id } = request.query;
        if (id) {
          const main = await db.select({
            id: invoices.id, invoiceNo: invoices.invoiceNo, date: invoices.date,
            amount: invoices.amount, tax: invoices.tax, total: invoices.total,
            status: invoices.status, customerId: contacts.id,
            fileName: invoices.fileName,
            isIgst: invoices.isIgst,
            customerName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
            customerGst: contacts.gst
          }).from(invoices).leftJoin(contacts, eq(invoices.customerId, contacts.id)).where(eq(invoices.id, parseInt(id as string))).limit(1);
          if (main.length === 0) return response.status(404).json({ error: 'Invoice not found' });
          const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, main[0].id));
          return response.status(200).json({ ...main[0], items });
        }
        const data = await db.select({
          id: invoices.id, invoiceNo: invoices.invoiceNo, date: invoices.date,
          amount: invoices.amount, tax: invoices.tax, total: invoices.total,
          status: invoices.status, customerId: contacts.id,
          isIgst: invoices.isIgst,
          customerName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
          productSummary: sql<string>`string_agg(${invoiceItems.name}, ', ')`,
          totalQty: sql<number>`SUM(CAST(${invoiceItems.qty} AS NUMERIC))`
        })
        .from(invoices)
        .leftJoin(contacts, eq(invoices.customerId, contacts.id))
        .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
        .groupBy(invoices.id, contacts.id, invoices.customerName, invoices.invoiceNo, invoices.date, invoices.amount, invoices.tax, invoices.total, invoices.status, invoices.isIgst)
        .orderBy(desc(invoices.createdAt));
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
      if (method === 'PUT') {
        const { id } = request.query;
        const { items, ...invoiceData } = request.body;
        if (invoiceData.id) delete invoiceData.id;

        const updated = await db.update(invoices).set(invoiceData)
          .where(eq(invoices.id, parseInt(id as string)))
          .returning();

        if (items) {
          await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, parseInt(id as string)));
          if (items.length > 0) {
            const itemsWithId = items.map((item: any) => ({ ...item, invoiceId: parseInt(id as string) }));
            await db.insert(invoiceItems).values(itemsWithId);
          }
        }
        return response.status(200).json(updated[0]);
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, parseInt(id as string)));
        await db.delete(invoices).where(eq(invoices.id, parseInt(id as string)));
        return response.status(200).json({ success: true });
      }
    }

    if (resource === 'quotations') {
      if (method === 'GET') {
        const { id } = request.query;
        if (id) {
          const main = await db.select({
            id: quotations.id, quotationNo: quotations.quotationNo, date: quotations.date,
            amount: quotations.amount, tax: quotations.tax, total: quotations.total,
            status: quotations.status, customerId: contacts.id,
            fileName: quotations.fileName, isIgst: quotations.isIgst,
            customerName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
            customerGst: contacts.gst
          }).from(quotations).leftJoin(contacts, eq(quotations.customerId, contacts.id)).where(eq(quotations.id, parseInt(id as string))).limit(1);
          
          if (main.length === 0) return response.status(404).json({ error: 'Quotation not found' });
          const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, main[0].id));
          return response.status(200).json({ ...main[0], items });
        }
        const data = await db.select({
          id: quotations.id, quotationNo: quotations.quotationNo, date: quotations.date,
          amount: quotations.amount,
          tax: sql<string>`CASE WHEN ${quotations.tax} IS NULL THEN COALESCE(SUM(CAST(${quotationItems.amount} AS NUMERIC) * CAST(${quotationItems.gstRate} AS NUMERIC) / 100), 0)::text ELSE ${quotations.tax}::text END`,
          total: sql<string>`CASE WHEN ${quotations.total} IS NULL THEN COALESCE(SUM(CAST(${quotationItems.amount} AS NUMERIC) * (1 + CAST(${quotationItems.gstRate} AS NUMERIC) / 100)), ${quotations.amount})::text ELSE ${quotations.total}::text END`,
          status: quotations.status, customerId: contacts.id,
          isIgst: quotations.isIgst,
          customerName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
          productSummary: sql<string>`string_agg(${quotationItems.name}, ', ')`,
          totalQty: sql<number>`SUM(CAST(${quotationItems.qty} AS NUMERIC))`
        })
        .from(quotations)
        .leftJoin(contacts, eq(quotations.customerId, contacts.id))
        .leftJoin(quotationItems, eq(quotations.id, quotationItems.quotationId))
        .groupBy(quotations.id, contacts.id, quotations.customerName, quotations.quotationNo, quotations.date, quotations.amount, quotations.tax, quotations.total, quotations.status, quotations.isIgst)
        .orderBy(desc(quotations.createdAt));
        return response.status(200).json(data);
      }
      if (method === 'POST') {
        const { items, ...quotationData } = request.body;
        const newQt = await db.insert(quotations).values(quotationData).returning();
        if (items?.length > 0) {
          const itemsWithId = items.map((item: any) => ({ ...item, quotationId: newQt[0].id }));
          await db.insert(quotationItems).values(itemsWithId);
        }
        return response.status(200).json(newQt[0]);
      }
      if (method === 'PUT') {
        const { id } = request.query;
        const { items, ...quotationData } = request.body;
        if (quotationData.id) delete quotationData.id;

        const updated = await db.update(quotations).set(quotationData)
          .where(eq(quotations.id, parseInt(id as string)))
          .returning();

        if (items) {
          await db.delete(quotationItems).where(eq(quotationItems.quotationId, parseInt(id as string)));
          if (items.length > 0) {
            const itemsWithId = items.map((item: any) => ({ ...item, quotationId: parseInt(id as string) }));
            await db.insert(quotationItems).values(itemsWithId);
          }
        }
        return response.status(200).json(updated[0]);
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        await db.delete(quotationItems).where(eq(quotationItems.quotationId, parseInt(id as string)));
        await db.delete(quotations).where(eq(quotations.id, parseInt(id as string)));
        return response.status(200).json({ success: true });
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
      
      let lines;
      if (returnFor === 'quotation') {
        // Query from Quotations table (Prefix QT-)
        lines = await db.select({
          companyName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
          gstin: contacts.gst,
          invoiceNo: quotations.quotationNo,
          date: quotations.date,
          taxableValue: sql<string>`SUM(CAST(${quotationItems.amount} AS NUMERIC))`,
          totalTax: quotations.tax,
          grandTotal: quotations.total,
          isIgst: quotations.isIgst,
          placeOfSupply: contacts.city
        })
        .from(quotations)
        .leftJoin(contacts, eq(quotations.customerId, contacts.id))
        .leftJoin(quotationItems, eq(quotations.id, quotationItems.quotationId))
        .groupBy(quotations.id, contacts.id)
        .orderBy(desc(quotations.date), desc(quotations.quotationNo));
      } else if (returnFor === 'estimate') {
        // Query from Invoices table for EST- prefix
        lines = await db.select({
          companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
          gstin: contacts.gst,
          invoiceNo: invoices.invoiceNo,
          date: invoices.date,
          taxableValue: sql<string>`SUM(CAST(${invoiceItems.amount} AS NUMERIC))`,
          totalTax: invoices.tax,
          grandTotal: invoices.total,
          isIgst: invoices.isIgst,
          placeOfSupply: contacts.city
        })
        .from(invoices)
        .leftJoin(contacts, eq(invoices.customerId, contacts.id))
        .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
        .where(like(invoices.invoiceNo, 'EST%'))
        .groupBy(invoices.id, contacts.id)
        .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
      } else {
        // Default (Invoice): Query from Invoices table, excluding EST- prefix
        lines = await db.select({
          companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
          gstin: contacts.gst,
          invoiceNo: invoices.invoiceNo,
          date: invoices.date,
          taxableValue: sql<string>`SUM(CAST(${invoiceItems.amount} AS NUMERIC))`,
          totalTax: invoices.tax,
          grandTotal: invoices.total,
          isIgst: invoices.isIgst,
          placeOfSupply: contacts.city
        })
        .from(invoices)
        .leftJoin(contacts, eq(invoices.customerId, contacts.id))
        .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
        .where(notLike(invoices.invoiceNo, 'EST%'))
        .groupBy(invoices.id, contacts.id)
        .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
      }
      
      return response.status(200).json(lines);
    }

    if (resource === 'purchases') {
      if (method === 'GET') {
        const { id } = request.query;
        if (id) {
          const table = type === 'orders' ? purchaseOrders : purchaseEntries;
          const main = await db.select({
            id: table.id,
            date: table.date,
            dueDate: table.dueDate,
            supplierId: table.supplierId,
            invNo: table.invNo,
            orderNo: table.orderNo,
            ourPoNo: table.ourPoNo,
            ourDcNo: table.ourDcNo,
            isIgst: table.isIgst,
            amount: table.amount,
            tax: table.tax,
            total: table.total,
            status: table.status,
            ...(type === 'entries' ? { receivedAmount: purchaseEntries.receivedAmount } : {}),
            supplierName: sql<string>`COALESCE(${contacts.name}, ${table.supplierName})`
          }).from(table).leftJoin(contacts, eq(table.supplierId, contacts.id)).where(eq(table.id, parseInt(id as string))).limit(1);
          
          if (main.length === 0) return response.status(404).json({ error: 'Purchase record not found' });
          const items = await db.select().from(purchaseItems).where(
            type === 'orders' ? eq(purchaseItems.purchaseOrderId, main[0].id) : eq(purchaseItems.purchaseId, main[0].id)
          );
          return response.status(200).json({ ...main[0], items });
        }

        if (type === 'orders') {
          const data = await db.select({
            id: purchaseOrders.id, orderNo: purchaseOrders.orderNo, date: purchaseOrders.date,
            amount: purchaseOrders.amount, status: purchaseOrders.status, 
            supplierName: sql<string>`COALESCE(${contacts.name}, ${purchaseOrders.supplierName})`,
            tax: purchaseOrders.tax, total: purchaseOrders.total,
            totalQty: sql<number>`SUM(CAST(${purchaseItems.qty} AS NUMERIC))`
          })
          .from(purchaseOrders)
          .leftJoin(contacts, eq(purchaseOrders.supplierId, contacts.id))
          .leftJoin(purchaseItems, eq(purchaseOrders.id, purchaseItems.purchaseOrderId))
          .groupBy(purchaseOrders.id, contacts.id, purchaseOrders.orderNo, purchaseOrders.date, purchaseOrders.amount, purchaseOrders.status, purchaseOrders.tax, purchaseOrders.total, purchaseOrders.supplierName)
          .orderBy(desc(purchaseOrders.createdAt));
          return response.status(200).json(data);
        } else {
          const data = await db.select({
            id: purchaseEntries.id, purchaseNo: purchaseEntries.purchaseNo, date: purchaseEntries.date,
            amount: purchaseEntries.amount, status: purchaseEntries.status, 
            supplierName: sql<string>`COALESCE(${contacts.name}, ${purchaseEntries.supplierName})`,
            tax: purchaseEntries.tax, total: purchaseEntries.total,
            totalQty: sql<number>`SUM(CAST(${purchaseItems.qty} AS NUMERIC))`
          })
          .from(purchaseEntries)
          .leftJoin(contacts, eq(purchaseEntries.supplierId, contacts.id))
          .leftJoin(purchaseItems, eq(purchaseEntries.id, purchaseItems.purchaseId))
          .groupBy(purchaseEntries.id, contacts.id, purchaseEntries.purchaseNo, purchaseEntries.date, purchaseEntries.amount, purchaseEntries.status, purchaseEntries.tax, purchaseEntries.total, purchaseEntries.supplierName)
          .orderBy(desc(purchaseEntries.createdAt));
          return response.status(200).json(data);
        }
      }
      if (method === 'POST') {
        const { items, ...data } = request.body;
        if (type === 'orders') {
          // Auto-generate orderNo if missing
          if (!data.orderNo && !data.id) {
            const lastOrder = await db.select({ orderNo: purchaseOrders.orderNo })
              .from(purchaseOrders)
              .orderBy(desc(purchaseOrders.id))
              .limit(1);
            
            let nextNo = 1000;
            if (lastOrder.length > 0 && lastOrder[0].orderNo) {
              const lastNo = parseInt(lastOrder[0].orderNo.replace("PO-", ""));
              if (!isNaN(lastNo)) nextNo = lastNo + 1;
            }
            data.orderNo = `PO-${nextNo}`;
          }
          const newOrder = await db.insert(purchaseOrders).values(data).returning();
          if (items?.length > 0) {
            const itemsWithId = items.map((item: any) => ({
              name: item.name,
              sku: item.sku,
              qty: item.qty.toString(),
              rate: item.rate.toString(),
              amount: item.amount.toString(),
              hsnCode: item.hsn,
              gstRate: item.gstRate.toString(),
              packing: item.packing,
              unit: item.unit,
              purchaseOrderId: newOrder[0].id
            }));
            await db.insert(purchaseItems).values(itemsWithId);
          }
          return response.status(200).json(newOrder[0]);
        } else {
          // Auto-generate purchaseNo if missing
          if (!data.purchaseNo && !data.id) {
            const lastEntry = await db.select({ purchaseNo: purchaseEntries.purchaseNo })
              .from(purchaseEntries)
              .orderBy(desc(purchaseEntries.id))
              .limit(1);
            
            let nextNo = 1000;
            if (lastEntry.length > 0 && lastEntry[0].purchaseNo) {
              const lastNo = parseInt(lastEntry[0].purchaseNo.replace("PUR-", ""));
              if (!isNaN(lastNo)) nextNo = lastNo + 1;
            }
            data.purchaseNo = `PUR-${nextNo}`;
          }
          const newEntry = await db.insert(purchaseEntries).values(data).returning();
          if (items?.length > 0) {
            const itemsWithId = items.map((item: any) => ({
              name: item.name,
              sku: item.sku,
              qty: item.qty.toString(),
              rate: item.rate.toString(),
              amount: item.amount.toString(),
              hsnCode: item.hsn,
              gstRate: item.gstRate.toString(),
              packing: item.packing,
              unit: item.unit,
              purchaseId: newEntry[0].id
            }));
            await db.insert(purchaseItems).values(itemsWithId);
          }
          return response.status(200).json(newEntry[0]);
        }
      }
      if (method === 'PUT') {
        const { items, ...data } = request.body;
        const { id } = request.query;
        const table = type === 'orders' ? purchaseOrders : purchaseEntries;
        
        if (data.id) delete data.id;
        const updated = await db.update(table).set(data).where(eq(table.id, parseInt(id as string))).returning();
        
        if (items) {
          await db.delete(purchaseItems).where(
            type === 'orders' ? eq(purchaseItems.purchaseOrderId, parseInt(id as string)) : eq(purchaseItems.purchaseId, parseInt(id as string))
          );
          if (items.length > 0) {
            const itemsWithId = items.map((item: any) => ({
              name: item.name,
              sku: item.sku,
              qty: item.qty.toString(),
              rate: item.rate.toString(),
              amount: item.amount.toString(),
              hsnCode: item.hsnCode || item.hsn,
              gstRate: item.gstRate?.toString() || "18",
              packing: item.packing,
              unit: item.unit,
              ...(type === 'orders' ? { purchaseOrderId: parseInt(id as string) } : { purchaseId: parseInt(id as string) })
            }));
            await db.insert(purchaseItems).values(itemsWithId);
          }
        }
        return response.status(200).json(updated[0]);
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        const table = type === 'orders' ? purchaseOrders : purchaseEntries;
        await db.delete(purchaseItems).where(
          type === 'orders' ? eq(purchaseItems.purchaseOrderId, parseInt(id as string)) : eq(purchaseItems.purchaseId, parseInt(id as string))
        );
        await db.delete(table).where(eq(table.id, parseInt(id as string)));
        return response.status(200).json({ success: true });
      }
    }

    return response.status(404).json({ error: 'Resource not found' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
