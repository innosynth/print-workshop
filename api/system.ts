import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index.js';
import { invoices, contacts, products, expenses, accounts, meterReadings, users, machines, stockMovements } from '../db/schema.js';
import { sql, desc, eq } from 'drizzle-orm';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { resource, type } = request.query;
  const method = request.method;

  try {
    if (resource === 'machines') {
      if (method === 'GET') {
        const allMachines = await db.select().from(machines).orderBy(desc(machines.createdAt));
        return response.status(200).json(allMachines);
      }
      if (method === 'POST') {
        const newMachine = await db.insert(machines).values(request.body).returning();
        return response.status(200).json(newMachine[0]);
      }
    }
    
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

        const manualClosing = parseFloat(data.closingReading || "0");
        const sumCounters = bwl + bws + cl + cs + lsc + lsm;
        
        // Priority: Manual entry > Automated Sum
        const finalClosing = manualClosing > 0 ? manualClosing : sumCounters;
        
        const { id, ...rest } = data;
        const payload = {
          ...rest,
          closingReading: finalClosing.toString(),
          totalUsage: (finalClosing - op).toString()
        };

        if (id) {
          const updated = await db.update(meterReadings).set(payload).where(eq(meterReadings.id, id)).returning();
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
      if (method === 'GET') {
        const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
        return response.status(200).json(allExpenses);
      }
      if (method === 'POST') {
        const data = request.body;
        const newExpense = await db.insert(expenses).values({
          ...data,
          expenseNo: `EXP-${Date.now().toString().slice(-6)}`
        }).returning();
        return response.status(200).json(newExpense[0]);
      }
    }

    if (resource === 'inventory') {
      const allProducts = await db.select().from(products);
      if (method === 'GET') {
        const summary = {
          totalProducts: allProducts.length,
          lowStock: allProducts.filter(p => (Number(p.stock || 0) > 0 && Number(p.stock || 0) < 10)).length,
          outOfStock: allProducts.filter(p => Number(p.stock || 0) <= 0).length,
        };
        const movements = await db.select().from(stockMovements).orderBy(desc(stockMovements.date), desc(stockMovements.createdAt));
        return response.status(200).json({ summary, movements, products: allProducts });
      }
      if (method === 'POST') {
        const data = request.body;
        const newMovement = await db.insert(stockMovements).values(data).returning();
        
        // Update product stock
        const product = allProducts.find(p => p.name === data.productName);
        if (product) {
          const currentStock = Number(product.stock || 0);
          const moveQty = Number(data.qty || 0);
          const newStock = data.type === 'Inward' ? currentStock + moveQty : currentStock - moveQty;
          await db.update(products).set({ stock: newStock.toString() }).where(eq(products.id, product.id));
        }
        
        return response.status(200).json(newMovement[0]);
      }
    }

    return response.status(404).json({ error: 'Resource not found' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
