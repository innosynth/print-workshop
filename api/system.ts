import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/index';
import { invoices, contacts, products, expenses, accounts, meterReadings, users } from '../src/db/schema';
import { sql, desc, eq } from 'drizzle-orm';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { resource, type } = request.query;
  const method = request.method;

  try {
    if (resource === 'meter_readings') {
      if (method === 'GET') {
        const readingsData = await db.select({
          id: meterReadings.id,
          machineName: meterReadings.machineName,
          date: meterReadings.date,
          bwLarge: meterReadings.bwLarge,
          bwSmall: meterReadings.bwSmall,
          colorLarge: meterReadings.colorLarge,
          colorSmall: meterReadings.colorSmall,
          lsColor: meterReadings.lsColor,
          lsMono: meterReadings.lsMono,
          openingReading: meterReadings.openingReading,
          closingReading: meterReadings.closingReading,
          totalUsage: meterReadings.totalUsage,
          userName: users.name,
          createdAt: meterReadings.createdAt
        })
        .from(meterReadings)
        .leftJoin(users, eq(meterReadings.userId, users.id))
        .orderBy(desc(meterReadings.date), desc(meterReadings.createdAt));
        return response.status(200).json(readingsData);
      }
      if (method === 'POST') {
        const data = request.body;
        const bwl = parseFloat(data.bwLarge || "0");
        const bws = parseFloat(data.bwSmall || "0");
        const cl = parseFloat(data.colorLarge || "0");
        const cs = parseFloat(data.colorSmall || "0");
        const lsc = parseFloat(data.lsColor || "0");
        const lsm = parseFloat(data.lsMono || "0");
        const op = parseFloat(data.openingReading || "0");

        const closingReading = (bwl + bws + cl + cs + lsc + lsm).toString();
        const totalUsage = (parseFloat(closingReading) - op).toString();

        const payload = {
          ...data,
          closingReading,
          totalUsage
        };

        if (data.id) {
          const updated = await db.update(meterReadings).set(payload).where(eq(meterReadings.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(meterReadings).values(payload).returning();
          return response.status(200).json(inserted[0]);
        }
      }
    }

    if (resource === 'dashboard') {
      const todaySales = await db.select({ total: sql<number>`sum(${invoices.total}::numeric)` }).from(invoices).where(sql`date(${invoices.date}) = CURRENT_DATE`);
      const totalSales = await db.select({ total: sql<number>`sum(${invoices.total}::numeric)` }).from(invoices);
      const activeCustomers = await db.select({ count: sql<number>`count(*)` }).from(contacts).where(sql`${contacts.type} IN ('B2B', 'B2C')`);
      const lowStock = await db.select({ count: sql<number>`count(*)` }).from(products).where(sql`${products.stock}::numeric < ${products.minStock}::numeric`);
      return response.status(200).json({
        todaySales: todaySales[0]?.total || 0,
        totalSales: totalSales[0]?.total || 0,
        activeCustomers: activeCustomers[0]?.count || 0,
        lowStockCount: lowStock[0]?.count || 0,
      });
    }

    if (resource === 'accounting') {
      if (type === 'coa') {
        const data = await db.select().from(accounts).orderBy(desc(accounts.createdAt));
        return response.status(200).json(data.length > 0 ? data : [
          { id: '1', code: '1001', name: 'Cash in Hand', group: 'Current Assets', type: 'Asset', balance: 45000 },
          { id: '2', code: '1002', name: 'HDFC Bank', group: 'Current Assets', type: 'Asset', balance: 250000 },
          { id: '3', code: '2001', name: 'Sales Revenue', group: 'Revenue', type: 'Income', balance: 850000 },
        ]);
      }
    }

    if (resource === 'expenses') {
      const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
      return response.status(200).json(allExpenses);
    }

    if (resource === 'inventory') {
      const allProducts = await db.select().from(products);
      const summary = {
        totalProducts: allProducts.length,
        lowStock: allProducts.filter(p => (Number(p.stock || 0) > 0 && Number(p.stock || 0) < 10)).length,
        outOfStock: allProducts.filter(p => Number(p.stock || 0) <= 0).length,
      };
      const movements = [
        { id: 'MOV-1001', date: '2024-04-10', product: 'Art Paper 300gsm', qty: 50, unit: 'Reams', warehouse: 'Main Hub', ref: 'PUR-2024-015', type: 'Inward' },
        { id: 'MOV-1002', date: '2024-04-12', product: 'Vinyl Glossy', qty: 10, unit: 'Rolls', warehouse: 'Main Hub', ref: 'INV-2024-042', type: 'Outward' },
      ];
      return response.status(200).json({ summary, movements, products: allProducts });
    }

    return response.status(404).json({ error: 'Resource not found' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
