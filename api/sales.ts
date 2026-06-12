import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index.js';
import { invoices, invoiceItems, quotations, quotationItems, salesReturns, purchaseEntries, purchaseOrders, purchaseItems, contacts } from '../db/schema.js';
import { eq, desc, sql, like, notLike, and, ne } from 'drizzle-orm';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { resource, type } = request.query;
  const method = request.method;

  try {
    if (resource === 'invoices' || resource === 'estimates') {
      if (method === 'GET') {
        const { id, page, pageSize, search, status, customerId, dateFrom, dateTo } = request.query;
        if (id) {
          const rows = await db.select({
            id: invoices.id, invoiceNo: invoices.invoiceNo, date: invoices.date,
            amount: invoices.amount, tax: invoices.tax, total: invoices.total,
            status: invoices.status, customerId: contacts.id,
            fileName: invoices.fileName,
            isIgst: invoices.isIgst,
            customerName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
            customerGst: contacts.gst,
            customerAddress: contacts.address,
            customerCity: contacts.city,
            customerState: contacts.state,
            customerPincode: contacts.pincode,
            itemId: invoiceItems.id,
            itemName: invoiceItems.name,
            itemCategory: invoiceItems.category,
            itemSubCategory: invoiceItems.subCategory,
            itemQty: invoiceItems.qty,
            itemRate: invoiceItems.rate,
            itemAmount: invoiceItems.amount,
            itemHsnCode: invoiceItems.hsnCode,
            itemGstRate: invoiceItems.gstRate
          })
          .from(invoices)
          .leftJoin(contacts, eq(invoices.customerId, contacts.id))
          .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
          .where(eq(invoices.id, parseInt(id as string)));

          if (rows.length === 0) return response.status(404).json({ error: 'Invoice not found' });

          const items = rows
            .map(row => row.itemId ? ({
              id: row.itemId,
              invoiceId: row.id,
              name: row.itemName,
              category: row.itemCategory,
              subCategory: row.itemSubCategory,
              qty: row.itemQty,
              rate: row.itemRate,
              amount: row.itemAmount,
              hsnCode: row.itemHsnCode,
              gstRate: row.itemGstRate
            }) : null)
            .filter(Boolean);

          const { itemId, itemName, itemCategory, itemSubCategory, itemQty, itemRate, itemAmount, itemHsnCode, itemGstRate, ...invoiceData } = rows[0];
          return response.status(200).json({ ...invoiceData, items });
        }

        const conditions = [];
        if (resource === 'estimates') {
          conditions.push(like(invoices.invoiceNo, 'EST%'));
        } else {
          conditions.push(notLike(invoices.invoiceNo, 'EST%'));
        }
        if (status) {
          conditions.push(eq(invoices.status, status as string));
        }
        if (customerId) {
          conditions.push(eq(invoices.customerId, parseInt(customerId as string)));
        }
        if (dateFrom) {
          conditions.push(sql`${invoices.date} >= ${dateFrom}`);
        }
        if (dateTo) {
          conditions.push(sql`${invoices.date} <= ${dateTo}`);
        }
        if (search) {
          conditions.push(
            sql`(${invoices.invoiceNo} ILIKE ${'%' + search + '%'} OR ${contacts.name} ILIKE ${'%' + search + '%'} OR ${invoices.customerName} ILIKE ${'%' + search + '%'})`
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        if (page) {
          const pageNum = parseInt(page as string) || 1;
          const limitVal = parseInt(pageSize as string) || 50;
          const offsetVal = (pageNum - 1) * limitVal;

          const [countQueryResult, data] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
              .from(invoices)
              .leftJoin(contacts, eq(invoices.customerId, contacts.id))
              .where(whereClause),
            db.select({
              id: invoices.id, invoiceNo: invoices.invoiceNo, date: invoices.date,
              amount: invoices.amount, tax: invoices.tax, total: invoices.total,
              status: invoices.status, customerId: contacts.id,
              isIgst: invoices.isIgst,
              customerName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              productSummary: sql<string>`string_agg(${invoiceItems.name}, ', ')`,
              totalQty: sql<number>`SUM(CAST(${invoiceItems.qty} AS NUMERIC))`,
              potentialTax: sql<number>`COALESCE(SUM(CAST(${invoiceItems.amount} AS NUMERIC) * CAST(COALESCE(${invoiceItems.gstRate}, '18') AS NUMERIC) / 100), 0)`
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
            .where(whereClause)
            .groupBy(invoices.id, contacts.id, invoices.customerName, invoices.invoiceNo, invoices.date, invoices.amount, invoices.tax, invoices.total, invoices.status, invoices.isIgst)
            .orderBy(desc(invoices.createdAt))
            .limit(limitVal)
            .offset(offsetVal)
          ]);

          const total = Number(countQueryResult[0]?.count || 0);

          return response.status(200).json({
            data,
            pagination: {
              total,
              page: pageNum,
              pageSize: limitVal,
              totalPages: Math.ceil(total / limitVal)
            }
          });
        }

        const data = await db.select({
          id: invoices.id, invoiceNo: invoices.invoiceNo, date: invoices.date,
          amount: invoices.amount, tax: invoices.tax, total: invoices.total,
          status: invoices.status, customerId: contacts.id,
          isIgst: invoices.isIgst,
          customerName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
          productSummary: sql<string>`string_agg(${invoiceItems.name}, ', ')`,
          totalQty: sql<number>`SUM(CAST(${invoiceItems.qty} AS NUMERIC))`,
          potentialTax: sql<number>`COALESCE(SUM(CAST(${invoiceItems.amount} AS NUMERIC) * CAST(COALESCE(${invoiceItems.gstRate}, '18') AS NUMERIC) / 100), 0)`
        })
        .from(invoices)
        .leftJoin(contacts, eq(invoices.customerId, contacts.id))
        .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
        .where(whereClause)
        .groupBy(invoices.id, contacts.id, invoices.customerName, invoices.invoiceNo, invoices.date, invoices.amount, invoices.tax, invoices.total, invoices.status, invoices.isIgst)
        .orderBy(desc(invoices.createdAt));
        return response.status(200).json(data);
      }
      if (method === 'POST') {
        const { items, ...invoiceData } = request.body;
        const result = await db.transaction(async (tx) => {
          let currentNo = invoiceData.invoiceNo;
          const isEstimate = typeof currentNo === 'string' && currentNo.startsWith('EST-');
          const prefix = isEstimate ? 'EST' : 'INV';
          const startNum = isEstimate ? 1000 : 136;

          const exists = await tx.select({ id: invoices.id })
            .from(invoices)
            .where(eq(invoices.invoiceNo, currentNo))
            .limit(1);

          if (exists.length > 0 || currentNo === `${prefix}-${startNum}`) {
            const allNo = await tx.select({ invoiceNo: invoices.invoiceNo })
              .from(invoices)
              .where(like(invoices.invoiceNo, `${prefix}-%`));

            const existingNumbers = allNo.map(r => r.invoiceNo);
            const nums = existingNumbers
              .map(val => {
                if (!val || typeof val !== 'string' || !val.startsWith(prefix + '-')) return 0;
                const parts = val.split('-');
                const lastPart = parts[parts.length - 1];
                const num = parseInt(lastPart);
                if (num < startNum) return 0;
                return isNaN(num) ? 0 : num;
              })
              .filter(n => n >= startNum);

            const max = nums.length > 0 ? Math.max(...nums) : (startNum - 1);
            invoiceData.invoiceNo = `${prefix}-${max + 1}`;
          }

          const newInvoice = await tx.insert(invoices).values(invoiceData).returning();
          if (items?.length > 0) {
            const itemsWithId = items.map((item: any) => ({ ...item, invoiceId: newInvoice[0].id }));
            await tx.insert(invoiceItems).values(itemsWithId);
          }
          return newInvoice[0];
        });
        return response.status(200).json(result);
      }
      if (method === 'PUT') {
        const { id } = request.query;
        const { items, ...invoiceData } = request.body;
        if (invoiceData.id) delete invoiceData.id;

        const result = await db.transaction(async (tx) => {
          const updated = await tx.update(invoices).set(invoiceData)
            .where(eq(invoices.id, parseInt(id as string)))
            .returning();

          if (items) {
            await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, parseInt(id as string)));
            if (items.length > 0) {
              const itemsWithId = items.map((item: any) => ({ ...item, invoiceId: parseInt(id as string) }));
              await tx.insert(invoiceItems).values(itemsWithId);
            }
          }
          return updated[0];
        });
        return response.status(200).json(result);
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        await db.transaction(async (tx) => {
          await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, parseInt(id as string)));
          await tx.delete(invoices).where(eq(invoices.id, parseInt(id as string)));
        });
        return response.status(200).json({ success: true });
      }
    }

    if (resource === 'quotations') {
      if (method === 'GET') {
        const { id, page, pageSize, search, status, customerId, dateFrom, dateTo } = request.query;
        if (id) {
          const rows = await db.select({
            id: quotations.id, quotationNo: quotations.quotationNo, date: quotations.date,
            amount: quotations.amount, tax: quotations.tax, total: quotations.total,
            status: quotations.status, customerId: contacts.id,
            fileName: quotations.fileName, isIgst: quotations.isIgst,
            customerName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
            customerGst: contacts.gst,
            customerAddress: contacts.address,
            customerCity: contacts.city,
            customerState: contacts.state,
            customerPincode: contacts.pincode,
            itemId: quotationItems.id,
            itemName: quotationItems.name,
            itemCategory: quotationItems.category,
            itemSubCategory: quotationItems.subCategory,
            itemQty: quotationItems.qty,
            itemRate: quotationItems.rate,
            itemAmount: quotationItems.amount,
            itemHsnCode: quotationItems.hsnCode,
            itemGstRate: quotationItems.gstRate
          })
          .from(quotations)
          .leftJoin(contacts, eq(quotations.customerId, contacts.id))
          .leftJoin(quotationItems, eq(quotations.id, quotationItems.quotationId))
          .where(eq(quotations.id, parseInt(id as string)));
          
          if (rows.length === 0) return response.status(404).json({ error: 'Quotation not found' });

          const items = rows
            .map(row => row.itemId ? ({
              id: row.itemId,
              quotationId: row.id,
              name: row.itemName,
              category: row.itemCategory,
              subCategory: row.itemSubCategory,
              qty: row.itemQty,
              rate: row.itemRate,
              amount: row.itemAmount,
              hsnCode: row.itemHsnCode,
              gstRate: row.itemGstRate
            }) : null)
            .filter(Boolean);

          const { itemId, itemName, itemCategory, itemSubCategory, itemQty, itemRate, itemAmount, itemHsnCode, itemGstRate, ...quotationData } = rows[0];
          return response.status(200).json({ ...quotationData, items });
        }

        const conditions = [];
        if (status) {
          conditions.push(eq(quotations.status, status as string));
        }
        if (customerId) {
          conditions.push(eq(quotations.customerId, parseInt(customerId as string)));
        }
        if (dateFrom) {
          conditions.push(sql`${quotations.date} >= ${dateFrom}`);
        }
        if (dateTo) {
          conditions.push(sql`${quotations.date} <= ${dateTo}`);
        }
        if (search) {
          conditions.push(
            sql`(${quotations.quotationNo} ILIKE ${'%' + search + '%'} OR ${contacts.name} ILIKE ${'%' + search + '%'} OR ${quotations.customerName} ILIKE ${'%' + search + '%'})`
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        if (page) {
          const countQuery = await db.select({ count: sql<number>`count(*)` })
            .from(quotations)
            .leftJoin(contacts, eq(quotations.customerId, contacts.id))
            .where(whereClause);
          const total = Number(countQuery[0]?.count || 0);

          const pageNum = parseInt(page as string) || 1;
          const limitVal = parseInt(pageSize as string) || 50;
          const offsetVal = (pageNum - 1) * limitVal;

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
          .where(whereClause)
          .groupBy(quotations.id, contacts.id, quotations.customerName, quotations.quotationNo, quotations.date, quotations.amount, quotations.tax, quotations.total, quotations.status, quotations.isIgst)
          .orderBy(desc(quotations.createdAt))
          .limit(limitVal)
          .offset(offsetVal);

          return response.status(200).json({
            data,
            pagination: {
              total,
              page: pageNum,
              pageSize: limitVal,
              totalPages: Math.ceil(total / limitVal)
            }
          });
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
        .where(whereClause)
        .groupBy(quotations.id, contacts.id, quotations.customerName, quotations.quotationNo, quotations.date, quotations.amount, quotations.tax, quotations.total, quotations.status, quotations.isIgst)
        .orderBy(desc(quotations.createdAt));
        return response.status(200).json(data);
      }
      if (method === 'POST') {
        const { items, ...quotationData } = request.body;
        const result = await db.transaction(async (tx) => {
          let currentNo = quotationData.quotationNo;
          const prefix = 'QT';
          const startNum = 1;

          const exists = await tx.select({ id: quotations.id })
            .from(quotations)
            .where(eq(quotations.quotationNo, currentNo))
            .limit(1);

          if (exists.length > 0 || currentNo === `${prefix}-${startNum}`) {
            const allNo = await tx.select({ quotationNo: quotations.quotationNo })
              .from(quotations)
              .where(like(quotations.quotationNo, `${prefix}-%`));

            const existingNumbers = allNo.map(r => r.quotationNo);
            const nums = existingNumbers
              .map(val => {
                if (!val || typeof val !== 'string' || !val.startsWith(prefix + '-')) return 0;
                const parts = val.split('-');
                const lastPart = parts[parts.length - 1];
                const num = parseInt(lastPart);
                if (num < startNum) return 0;
                return isNaN(num) ? 0 : num;
              })
              .filter(n => n >= startNum);

            const max = nums.length > 0 ? Math.max(...nums) : (startNum - 1);
            quotationData.quotationNo = `${prefix}-${max + 1}`;
          }

          const newQt = await tx.insert(quotations).values(quotationData).returning();
          if (items?.length > 0) {
            const itemsWithId = items.map((item: any) => ({ ...item, quotationId: newQt[0].id }));
            await tx.insert(quotationItems).values(itemsWithId);
          }
          return newQt[0];
        });
        return response.status(200).json(result);
      }
      if (method === 'PUT') {
        const { id } = request.query;
        const { items, ...quotationData } = request.body;
        if (quotationData.id) delete quotationData.id;

        const result = await db.transaction(async (tx) => {
          const updated = await tx.update(quotations).set(quotationData)
            .where(eq(quotations.id, parseInt(id as string)))
            .returning();

          if (items) {
            await tx.delete(quotationItems).where(eq(quotationItems.quotationId, parseInt(id as string)));
            if (items.length > 0) {
              const itemsWithId = items.map((item: any) => ({ ...item, quotationId: parseInt(id as string) }));
              await tx.insert(quotationItems).values(itemsWithId);
            }
          }
          return updated[0];
        });
        return response.status(200).json(result);
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        await db.transaction(async (tx) => {
          await tx.delete(quotationItems).where(eq(quotationItems.quotationId, parseInt(id as string)));
          await tx.delete(quotations).where(eq(quotations.id, parseInt(id as string)));
        });
        return response.status(200).json({ success: true });
      }
    }

    if (resource === 'returns') {
      if (method === 'GET') {
        const { page, pageSize, search, status, customerId, dateFrom, dateTo } = request.query;

        const conditions = [];
        if (status) {
          conditions.push(eq(salesReturns.status, status as string));
        }
        if (customerId) {
          conditions.push(eq(salesReturns.customerId, parseInt(customerId as string)));
        }
        if (dateFrom) {
          conditions.push(sql`${salesReturns.date} >= ${dateFrom}`);
        }
        if (dateTo) {
          conditions.push(sql`${salesReturns.date} <= ${dateTo}`);
        }
        if (search) {
          conditions.push(
            sql`(${salesReturns.returnNo} ILIKE ${'%' + search + '%'} OR ${contacts.name} ILIKE ${'%' + search + '%'})`
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        if (page) {
          const countQuery = await db.select({ count: sql<number>`count(*)` })
            .from(salesReturns)
            .leftJoin(contacts, eq(salesReturns.customerId, contacts.id))
            .where(whereClause);
          const total = Number(countQuery[0]?.count || 0);

          const pageNum = parseInt(page as string) || 1;
          const limitVal = parseInt(pageSize as string) || 50;
          const offsetVal = (pageNum - 1) * limitVal;

          const data = await db.select({
            id: salesReturns.id,
            returnNo: salesReturns.returnNo,
            date: salesReturns.date,
            amount: salesReturns.amount,
            status: salesReturns.status,
            customerName: contacts.name,
          })
          .from(salesReturns)
          .leftJoin(contacts, eq(salesReturns.customerId, contacts.id))
          .where(whereClause)
          .orderBy(desc(salesReturns.createdAt))
          .limit(limitVal)
          .offset(offsetVal);

          return response.status(200).json({
            data,
            pagination: {
              total,
              page: pageNum,
              pageSize: limitVal,
              totalPages: Math.ceil(total / limitVal)
            }
          });
        }

        const data = await db.select({
          id: salesReturns.id,
          returnNo: salesReturns.returnNo,
          date: salesReturns.date,
          amount: salesReturns.amount,
          status: salesReturns.status,
          customerName: contacts.name,
        })
        .from(salesReturns)
        .leftJoin(contacts, eq(salesReturns.customerId, contacts.id))
        .where(whereClause)
        .orderBy(desc(salesReturns.createdAt));

        return response.status(200).json(data);
      }
    }

    if (resource === 'gst_report') {
      const { returnFor, page, pageSize, dateFrom, dateTo } = request.query;
      
      const pageNum = page ? parseInt(page as string) : null;
      const limitVal = pageSize ? parseInt(pageSize as string) : 50;
      const offsetVal = pageNum ? (pageNum - 1) * limitVal : 0;

      let lines;
      let total = 0;

      if (returnFor === 'quotation') {
        const conditions = [];
        if (dateFrom) conditions.push(sql`${quotations.date} >= ${dateFrom}`);
        if (dateTo) conditions.push(sql`${quotations.date} <= ${dateTo}`);
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        if (pageNum !== null) {
          const countQuery = await db.select({ count: sql<number>`count(distinct ${quotations.id})` })
            .from(quotations)
            .leftJoin(contacts, eq(quotations.customerId, contacts.id))
            .where(whereClause);
          total = Number(countQuery[0]?.count || 0);

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
          .where(whereClause)
          .groupBy(quotations.id, contacts.id)
          .orderBy(desc(quotations.date), desc(quotations.quotationNo))
          .limit(limitVal)
          .offset(offsetVal);
        } else {
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
          .where(whereClause)
          .groupBy(quotations.id, contacts.id)
          .orderBy(desc(quotations.date), desc(quotations.quotationNo));
        }
      } else if (returnFor === 'estimate') {
        const conditions = [like(invoices.invoiceNo, 'EST%')];
        if (dateFrom) conditions.push(sql`${invoices.date} >= ${dateFrom}`);
        if (dateTo) conditions.push(sql`${invoices.date} <= ${dateTo}`);
        const whereClause = and(...conditions);

        if (pageNum !== null) {
          const countQuery = await db.select({ count: sql<number>`count(distinct ${invoices.id})` })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(whereClause);
          total = Number(countQuery[0]?.count || 0);

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
          .where(whereClause)
          .groupBy(invoices.id, contacts.id)
          .orderBy(desc(invoices.date), desc(invoices.invoiceNo))
          .limit(limitVal)
          .offset(offsetVal);
        } else {
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
          .where(whereClause)
          .groupBy(invoices.id, contacts.id)
          .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
        }
      } else {
        const conditions = [notLike(invoices.invoiceNo, 'EST%')];
        if (dateFrom) conditions.push(sql`${invoices.date} >= ${dateFrom}`);
        if (dateTo) conditions.push(sql`${invoices.date} <= ${dateTo}`);
        const whereClause = and(...conditions);

        if (pageNum !== null) {
          const countQuery = await db.select({ count: sql<number>`count(distinct ${invoices.id})` })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(whereClause);
          total = Number(countQuery[0]?.count || 0);

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
          .where(whereClause)
          .groupBy(invoices.id, contacts.id)
          .orderBy(desc(invoices.date), desc(invoices.invoiceNo))
          .limit(limitVal)
          .offset(offsetVal);
        } else {
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
          .where(whereClause)
          .groupBy(invoices.id, contacts.id)
          .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
        }
      }
      
      if (pageNum !== null) {
        return response.status(200).json({
          data: lines,
          pagination: {
            total,
            page: pageNum,
            pageSize: limitVal,
            totalPages: Math.ceil(total / limitVal)
          }
        });
      }

      return response.status(200).json(lines);
    }

    if (resource === 'daily_sales_report') {
      const { type = 'invoice', mode = 'itemized', page, pageSize, dateFrom, dateTo } = request.query;

      const pageNum = page ? parseInt(page as string) : null;
      const limitVal = pageSize ? parseInt(pageSize as string) : 50;
      const offsetVal = pageNum ? (pageNum - 1) * limitVal : 0;

      let lines;
      let total = 0;

      if (type === 'quotation') {
        const conditions = [];
        if (dateFrom) conditions.push(sql`${quotations.date} >= ${dateFrom}`);
        if (dateTo) conditions.push(sql`${quotations.date} <= ${dateTo}`);
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        if (mode === 'itemized') {
          if (pageNum !== null) {
            const countQuery = await db.select({ count: sql<number>`count(*)` })
              .from(quotationItems)
              .leftJoin(quotations, eq(quotations.id, quotationItems.quotationId))
              .leftJoin(contacts, eq(quotations.customerId, contacts.id))
              .where(whereClause);
            total = Number(countQuery[0]?.count || 0);

            lines = await db.select({
              date: quotations.date,
              docNo: quotations.quotationNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
              itemName: quotationItems.name,
              qty: quotationItems.qty,
              rate: quotationItems.rate,
              amount: quotationItems.amount,
            })
            .from(quotationItems)
            .leftJoin(quotations, eq(quotations.id, quotationItems.quotationId))
            .leftJoin(contacts, eq(quotations.customerId, contacts.id))
            .where(whereClause)
            .orderBy(desc(quotations.date), desc(quotations.quotationNo))
            .limit(limitVal)
            .offset(offsetVal);
          } else {
            lines = await db.select({
              date: quotations.date,
              docNo: quotations.quotationNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
              itemName: quotationItems.name,
              qty: quotationItems.qty,
              rate: quotationItems.rate,
              amount: quotationItems.amount,
            })
            .from(quotationItems)
            .leftJoin(quotations, eq(quotations.id, quotationItems.quotationId))
            .leftJoin(contacts, eq(quotations.customerId, contacts.id))
            .where(whereClause)
            .orderBy(desc(quotations.date), desc(quotations.quotationNo));
          }
        } else {
          if (pageNum !== null) {
            const countQuery = await db.select({ count: sql<number>`count(distinct ${quotations.id})` })
              .from(quotations)
              .leftJoin(contacts, eq(quotations.customerId, contacts.id))
              .where(whereClause);
            total = Number(countQuery[0]?.count || 0);

            lines = await db.select({
              date: quotations.date,
              docNo: quotations.quotationNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
              qty: sql<number>`COALESCE(SUM(CAST(${quotationItems.qty} AS NUMERIC)), 0)`,
              amount: quotations.amount,
              tax: quotations.tax,
              total: quotations.total
            })
            .from(quotations)
            .leftJoin(contacts, eq(quotations.customerId, contacts.id))
            .leftJoin(quotationItems, eq(quotations.id, quotationItems.quotationId))
            .where(whereClause)
            .groupBy(quotations.id, contacts.id)
            .orderBy(desc(quotations.date), desc(quotations.quotationNo))
            .limit(limitVal)
            .offset(offsetVal);
          } else {
            lines = await db.select({
              date: quotations.date,
              docNo: quotations.quotationNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${quotations.customerName})`,
              qty: sql<number>`COALESCE(SUM(CAST(${quotationItems.qty} AS NUMERIC)), 0)`,
              amount: quotations.amount,
              tax: quotations.tax,
              total: quotations.total
            })
            .from(quotations)
            .leftJoin(contacts, eq(quotations.customerId, contacts.id))
            .leftJoin(quotationItems, eq(quotations.id, quotationItems.quotationId))
            .where(whereClause)
            .groupBy(quotations.id, contacts.id)
            .orderBy(desc(quotations.date), desc(quotations.quotationNo));
          }
        }
      } else if (type === 'estimate') {
        const conditions = [like(invoices.invoiceNo, 'EST%')];
        if (dateFrom) conditions.push(sql`${invoices.date} >= ${dateFrom}`);
        if (dateTo) conditions.push(sql`${invoices.date} <= ${dateTo}`);
        const whereClause = and(...conditions);

        if (mode === 'itemized') {
          if (pageNum !== null) {
            const countQuery = await db.select({ count: sql<number>`count(*)` })
              .from(invoiceItems)
              .leftJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
              .leftJoin(contacts, eq(invoices.customerId, contacts.id))
              .where(whereClause);
            total = Number(countQuery[0]?.count || 0);

            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              itemName: invoiceItems.name,
              qty: invoiceItems.qty,
              rate: invoiceItems.rate,
              amount: invoiceItems.amount,
            })
            .from(invoiceItems)
            .leftJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(whereClause)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo))
            .limit(limitVal)
            .offset(offsetVal);
          } else {
            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              itemName: invoiceItems.name,
              qty: invoiceItems.qty,
              rate: invoiceItems.rate,
              amount: invoiceItems.amount,
            })
            .from(invoiceItems)
            .leftJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(whereClause)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
          }
        } else {
          if (pageNum !== null) {
            const countQuery = await db.select({ count: sql<number>`count(distinct ${invoices.id})` })
              .from(invoices)
              .leftJoin(contacts, eq(invoices.customerId, contacts.id))
              .where(whereClause);
            total = Number(countQuery[0]?.count || 0);

            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              qty: sql<number>`COALESCE(SUM(CAST(${invoiceItems.qty} AS NUMERIC)), 0)`,
              amount: invoices.amount,
              tax: invoices.tax,
              total: invoices.total
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
            .where(whereClause)
            .groupBy(invoices.id, contacts.id)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo))
            .limit(limitVal)
            .offset(offsetVal);
          } else {
            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              qty: sql<number>`COALESCE(SUM(CAST(${invoiceItems.qty} AS NUMERIC)), 0)`,
              amount: invoices.amount,
              tax: invoices.tax,
              total: invoices.total
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
            .where(whereClause)
            .groupBy(invoices.id, contacts.id)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
          }
        }
      } else {
        const conditions = [notLike(invoices.invoiceNo, 'EST%')];
        if (dateFrom) conditions.push(sql`${invoices.date} >= ${dateFrom}`);
        if (dateTo) conditions.push(sql`${invoices.date} <= ${dateTo}`);
        const whereClause = and(...conditions);

        if (mode === 'itemized') {
          if (pageNum !== null) {
            const countQuery = await db.select({ count: sql<number>`count(*)` })
              .from(invoiceItems)
              .leftJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
              .leftJoin(contacts, eq(invoices.customerId, contacts.id))
              .where(whereClause);
            total = Number(countQuery[0]?.count || 0);

            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              itemName: invoiceItems.name,
              qty: invoiceItems.qty,
              rate: invoiceItems.rate,
              amount: invoiceItems.amount,
            })
            .from(invoiceItems)
            .leftJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(whereClause)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo))
            .limit(limitVal)
            .offset(offsetVal);
          } else {
            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              itemName: invoiceItems.name,
              qty: invoiceItems.qty,
              rate: invoiceItems.rate,
              amount: invoiceItems.amount,
            })
            .from(invoiceItems)
            .leftJoin(invoices, eq(invoices.id, invoiceItems.invoiceId))
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(whereClause)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
          }
        } else {
          if (pageNum !== null) {
            const countQuery = await db.select({ count: sql<number>`count(distinct ${invoices.id})` })
              .from(invoices)
              .leftJoin(contacts, eq(invoices.customerId, contacts.id))
              .where(whereClause);
            total = Number(countQuery[0]?.count || 0);

            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              qty: sql<number>`COALESCE(SUM(CAST(${invoiceItems.qty} AS NUMERIC)), 0)`,
              amount: invoices.amount,
              tax: invoices.tax,
              total: invoices.total
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
            .where(whereClause)
            .groupBy(invoices.id, contacts.id)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo))
            .limit(limitVal)
            .offset(offsetVal);
          } else {
            lines = await db.select({
              date: invoices.date,
              docNo: invoices.invoiceNo,
              companyName: sql<string>`COALESCE(${contacts.name}, ${invoices.customerName})`,
              qty: sql<number>`COALESCE(SUM(CAST(${invoiceItems.qty} AS NUMERIC)), 0)`,
              amount: invoices.amount,
              tax: invoices.tax,
              total: invoices.total
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
            .where(whereClause)
            .groupBy(invoices.id, contacts.id)
            .orderBy(desc(invoices.date), desc(invoices.invoiceNo));
          }
        }
      }

      if (pageNum !== null) {
        return response.status(200).json({
          data: lines,
          pagination: {
            total,
            page: pageNum,
            pageSize: limitVal,
            totalPages: Math.ceil(total / limitVal)
          }
        });
      }

      return response.status(200).json(lines);
    }

    if (resource === 'purchases') {
      if (method === 'GET') {
        const { id, page, pageSize, search, status, supplierId, dateFrom, dateTo } = request.query;
        if (id) {
          const table = type === 'orders' ? purchaseOrders : purchaseEntries;
          
          const rows = await db.select({
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
            supplierName: sql<string>`COALESCE(${contacts.name}, ${table.supplierName})`,
            itemId: purchaseItems.id,
            itemName: purchaseItems.name,
            itemSku: purchaseItems.sku,
            itemQty: purchaseItems.qty,
            itemRate: purchaseItems.rate,
            itemAmount: purchaseItems.amount,
            itemHsnCode: purchaseItems.hsnCode,
            itemGstRate: purchaseItems.gstRate,
            itemPacking: purchaseItems.packing,
            itemUnit: purchaseItems.unit
          })
          .from(table)
          .leftJoin(contacts, eq(table.supplierId, contacts.id))
          .leftJoin(purchaseItems, type === 'orders' ? eq(table.id, purchaseItems.purchaseOrderId) : eq(table.id, purchaseItems.purchaseId))
          .where(eq(table.id, parseInt(id as string)));

          if (rows.length === 0) return response.status(404).json({ error: 'Purchase record not found' });

          const items = rows
            .map(row => row.itemId ? ({
              id: row.itemId,
              purchaseId: type === 'orders' ? undefined : row.id,
              purchaseOrderId: type === 'orders' ? row.id : undefined,
              name: row.itemName,
              sku: row.itemSku,
              qty: row.itemQty,
              rate: row.itemRate,
              amount: row.itemAmount,
              hsnCode: row.itemHsnCode,
              gstRate: row.itemGstRate,
              packing: row.itemPacking,
              unit: row.itemUnit
            }) : null)
            .filter(Boolean);

          const { itemId, itemName, itemSku, itemQty, itemRate, itemAmount, itemHsnCode, itemGstRate, itemPacking, itemUnit, ...purchaseData } = rows[0];
          return response.status(200).json({ ...purchaseData, items });
        }

        if (type === 'orders') {
          const conditions = [];
          if (status) conditions.push(eq(purchaseOrders.status, status as string));
          if (supplierId) conditions.push(eq(purchaseOrders.supplierId, parseInt(supplierId as string)));
          if (dateFrom) conditions.push(sql`${purchaseOrders.date} >= ${dateFrom}`);
          if (dateTo) conditions.push(sql`${purchaseOrders.date} <= ${dateTo}`);
          if (search) {
            conditions.push(
              sql`(${purchaseOrders.orderNo} ILIKE ${'%' + search + '%'} OR ${contacts.name} ILIKE ${'%' + search + '%'} OR ${purchaseOrders.supplierName} ILIKE ${'%' + search + '%'})`
            );
          }
          const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

          if (page) {
            const countQuery = await db.select({ count: sql<number>`count(*)` })
              .from(purchaseOrders)
              .leftJoin(contacts, eq(purchaseOrders.supplierId, contacts.id))
              .where(whereClause);
            const total = Number(countQuery[0]?.count || 0);

            const pageNum = parseInt(page as string) || 1;
            const limitVal = parseInt(pageSize as string) || 50;
            const offsetVal = (pageNum - 1) * limitVal;

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
            .where(whereClause)
            .groupBy(purchaseOrders.id, contacts.id, purchaseOrders.orderNo, purchaseOrders.date, purchaseOrders.amount, purchaseOrders.status, purchaseOrders.tax, purchaseOrders.total, purchaseOrders.supplierName)
            .orderBy(desc(purchaseOrders.createdAt))
            .limit(limitVal)
            .offset(offsetVal);

            return response.status(200).json({
              data,
              pagination: {
                total,
                page: pageNum,
                pageSize: limitVal,
                totalPages: Math.ceil(total / limitVal)
              }
            });
          }

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
          .where(whereClause)
          .groupBy(purchaseOrders.id, contacts.id, purchaseOrders.orderNo, purchaseOrders.date, purchaseOrders.amount, purchaseOrders.status, purchaseOrders.tax, purchaseOrders.total, purchaseOrders.supplierName)
          .orderBy(desc(purchaseOrders.createdAt));
          return response.status(200).json(data);
        } else {
          const conditions = [];
          if (status) conditions.push(eq(purchaseEntries.status, status as string));
          if (supplierId) conditions.push(eq(purchaseEntries.supplierId, parseInt(supplierId as string)));
          if (dateFrom) conditions.push(sql`${purchaseEntries.date} >= ${dateFrom}`);
          if (dateTo) conditions.push(sql`${purchaseEntries.date} <= ${dateTo}`);
          if (search) {
            conditions.push(
              sql`(${purchaseEntries.purchaseNo} ILIKE ${'%' + search + '%'} OR ${purchaseEntries.invNo} ILIKE ${'%' + search + '%'} OR ${contacts.name} ILIKE ${'%' + search + '%'} OR ${purchaseEntries.supplierName} ILIKE ${'%' + search + '%'})`
            );
          }
          const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

          if (page) {
            const countQuery = await db.select({ count: sql<number>`count(*)` })
              .from(purchaseEntries)
              .leftJoin(contacts, eq(purchaseEntries.supplierId, contacts.id))
              .where(whereClause);
            const total = Number(countQuery[0]?.count || 0);

            const pageNum = parseInt(page as string) || 1;
            const limitVal = parseInt(pageSize as string) || 50;
            const offsetVal = (pageNum - 1) * limitVal;

            const data = await db.select({
              id: purchaseEntries.id, purchaseNo: purchaseEntries.purchaseNo, date: purchaseEntries.date,
              invNo: purchaseEntries.invNo,
              amount: purchaseEntries.amount, status: purchaseEntries.status, 
              supplierName: sql<string>`COALESCE(${contacts.name}, ${purchaseEntries.supplierName})`,
              tax: purchaseEntries.tax, total: purchaseEntries.total,
              totalQty: sql<number>`SUM(CAST(${purchaseItems.qty} AS NUMERIC))`
            })
            .from(purchaseEntries)
            .leftJoin(contacts, eq(purchaseEntries.supplierId, contacts.id))
            .leftJoin(purchaseItems, eq(purchaseEntries.id, purchaseItems.purchaseId))
            .where(whereClause)
            .groupBy(purchaseEntries.id, contacts.id, purchaseEntries.purchaseNo, purchaseEntries.date, purchaseEntries.invNo, purchaseEntries.amount, purchaseEntries.status, purchaseEntries.tax, purchaseEntries.total, purchaseEntries.supplierName)
            .orderBy(desc(purchaseEntries.createdAt))
            .limit(limitVal)
            .offset(offsetVal);

            return response.status(200).json({
              data,
              pagination: {
                total,
                page: pageNum,
                pageSize: limitVal,
                totalPages: Math.ceil(total / limitVal)
              }
            });
          }

          const data = await db.select({
            id: purchaseEntries.id, purchaseNo: purchaseEntries.purchaseNo, date: purchaseEntries.date,
            invNo: purchaseEntries.invNo,
            amount: purchaseEntries.amount, status: purchaseEntries.status, 
            supplierName: sql<string>`COALESCE(${contacts.name}, ${purchaseEntries.supplierName})`,
            tax: purchaseEntries.tax, total: purchaseEntries.total,
            totalQty: sql<number>`SUM(CAST(${purchaseItems.qty} AS NUMERIC))`
          })
          .from(purchaseEntries)
          .leftJoin(contacts, eq(purchaseEntries.supplierId, contacts.id))
          .leftJoin(purchaseItems, eq(purchaseEntries.id, purchaseItems.purchaseId))
          .where(whereClause)
          .groupBy(purchaseEntries.id, contacts.id, purchaseEntries.purchaseNo, purchaseEntries.date, purchaseEntries.invNo, purchaseEntries.amount, purchaseEntries.status, purchaseEntries.tax, purchaseEntries.total, purchaseEntries.supplierName)
          .orderBy(desc(purchaseEntries.createdAt));
          return response.status(200).json(data);
        }
      }
      if (method === 'POST') {
        const { items, ...data } = request.body;
        const result = await db.transaction(async (tx) => {
          if (type === 'orders') {
            // Auto-generate orderNo if missing
            if (!data.orderNo && !data.id) {
              const lastOrder = await tx.select({ orderNo: purchaseOrders.orderNo })
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
            const newOrder = await tx.insert(purchaseOrders).values(data).returning();
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
              await tx.insert(purchaseItems).values(itemsWithId);
            }
            return newOrder[0];
          } else {
            // Auto-generate purchaseNo if missing
            if (!data.purchaseNo && !data.id) {
              const lastEntry = await tx.select({ purchaseNo: purchaseEntries.purchaseNo })
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
            // Check for duplicate invoice number
            if (data.invNo && data.invNo.trim()) {
              const existing = await tx.select({ id: purchaseEntries.id })
                .from(purchaseEntries)
                .where(eq(sql`LOWER(${purchaseEntries.invNo})`, data.invNo.trim().toLowerCase()))
                .limit(1);
              if (existing.length > 0) {
                throw new Error(`Invoice number '${data.invNo}' already exists`);
              }
            }

            const newEntry = await tx.insert(purchaseEntries).values(data).returning();
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
              await tx.insert(purchaseItems).values(itemsWithId);
            }
            return newEntry[0];
          }
        });
        return response.status(200).json(result);
      }
      if (method === 'PUT') {
        const { items, id: bodyId, ...data } = request.body;
        const { id: queryId } = request.query;
        const id = queryId || bodyId;
        const parsedId = parseInt(id as string);
        const table = type === 'orders' ? purchaseOrders : purchaseEntries;

        if (isNaN(parsedId)) {
          return response.status(400).json({ error: 'Missing or invalid ID' });
        }

        const result = await db.transaction(async (tx) => {
          if (type !== 'orders' && data.invNo && data.invNo.trim()) {
            const existing = await tx.select({ id: purchaseEntries.id })
              .from(purchaseEntries)
              .where(
                and(
                  eq(sql`LOWER(${purchaseEntries.invNo})`, data.invNo.trim().toLowerCase()),
                  ne(purchaseEntries.id, parsedId)
                )
              )
              .limit(1);
            if (existing.length > 0) {
              throw new Error(`Invoice number '${data.invNo}' already exists`);
            }
          }

          const updated = await tx.update(table).set(data).where(eq(table.id, parsedId)).returning();
          
          if (items) {
            await tx.delete(purchaseItems).where(
              type === 'orders' ? eq(purchaseItems.purchaseOrderId, parsedId) : eq(purchaseItems.purchaseId, parsedId)
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
                ...(type === 'orders' ? { purchaseOrderId: parsedId } : { purchaseId: parsedId })
              }));
              await tx.insert(purchaseItems).values(itemsWithId);
            }
          }
          return updated[0];
        });
        return response.status(200).json(result);
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        const table = type === 'orders' ? purchaseOrders : purchaseEntries;
        await db.transaction(async (tx) => {
          await tx.delete(purchaseItems).where(
            type === 'orders' ? eq(purchaseItems.purchaseOrderId, parseInt(id as string)) : eq(purchaseItems.purchaseId, parseInt(id as string))
          );
          await tx.delete(table).where(eq(table.id, parseInt(id as string)));
        });
        return response.status(200).json({ success: true });
      }
    }

    return response.status(404).json({ error: 'Resource not found' });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return response.status(400).json({ error: error.message });
    }
    return response.status(500).json({ error: error.message });
  }
}
