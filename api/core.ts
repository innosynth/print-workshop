import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index.js';
import { contacts, products, companyProfile, printSettings, users, roles, paymentQrs, productCategories, productBrands, priceLists, priceListItems } from '../db/schema.js';
import { eq, desc, and, not } from 'drizzle-orm';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { resource, type } = request.query;
  const method = request.method;

  try {
    if (resource === 'profile') {
      if (method === 'GET') {
        const profile = await db.select().from(companyProfile).limit(1);
        return response.status(200).json(profile[0] || {});
      }
      if (method === 'POST') {
        const existing = await db.select().from(companyProfile).limit(1);
        if (existing.length > 0) {
          const updated = await db.update(companyProfile).set(request.body).where(eq(companyProfile.id, existing[0].id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(companyProfile).values(request.body).returning();
          return response.status(200).json(inserted[0]);
        }
      }
    }

    if (resource === 'print_settings') {
      if (method === 'GET') {
        const settings = await db.select().from(printSettings).limit(1);
        return response.status(200).json(settings[0] || {});
      }
      if (method === 'POST') {
        const existing = await db.select().from(printSettings).limit(1);
        if (existing.length > 0) {
          const updated = await db.update(printSettings).set(request.body).where(eq(printSettings.id, existing[0].id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(printSettings).values(request.body).returning();
          return response.status(200).json(inserted[0]);
        }
      }
    }

    if (resource === 'payment_qrs') {
      if (method === 'GET') {
        const qrs = await db.select().from(paymentQrs).orderBy(desc(paymentQrs.createdAt));
        return response.status(200).json(qrs);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.isActiveForInvoice) {
          await db.update(paymentQrs).set({ isActiveForInvoice: false });
        }
        if (data.isActiveForEstimate) {
          await db.update(paymentQrs).set({ isActiveForEstimate: false });
        }
        if (data.id) {
          const updated = await db.update(paymentQrs).set(data).where(eq(paymentQrs.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(paymentQrs).values(data).returning();
          return response.status(200).json(inserted[0]);
        }
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        await db.delete(paymentQrs).where(eq(paymentQrs.id, parseInt(id as string)));
        return response.status(200).json({ success: true });
      }
    }

    if (resource === 'roles') {
      if (method === 'GET') {
        const allRoles = await db.select().from(roles).orderBy(desc(roles.createdAt));
        return response.status(200).json(allRoles);
      }
      if (method === 'POST') {
        const data = request.body;
        const newRole = await db.insert(roles).values({
          name: data.name,
          permissions: JSON.stringify(data.permissions)
        }).returning();
        return response.status(200).json(newRole[0]);
      }
    }

    if (resource === 'contacts') {
      if (method === 'GET') {
        const allContacts = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
        return response.status(200).json(allContacts);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          const updated = await db.update(contacts).set(data).where(eq(contacts.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const newContact = await db.insert(contacts).values(data).returning();
          return response.status(200).json(newContact[0]);
        }
      }
    }

    if (resource === 'categories') {
      if (method === 'GET') {
        const all = await db.select().from(productCategories).orderBy(desc(productCategories.createdAt));
        return response.status(200).json(all);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          const updated = await db.update(productCategories).set(data).where(eq(productCategories.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(productCategories).values(data).returning();
          return response.status(200).json(inserted[0]);
        }
      }
    }

    if (resource === 'brands') {
      if (method === 'GET') {
        const all = await db.select().from(productBrands).orderBy(desc(productBrands.createdAt));
        return response.status(200).json(all);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          const updated = await db.update(productBrands).set(data).where(eq(productBrands.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(productBrands).values(data).returning();
          return response.status(200).json(inserted[0]);
        }
      }
    }

    if (resource === 'products') {
      if (method === 'GET') {
        const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
        return response.status(200).json(allProducts);
      }
      if (method === 'POST') {
        const data = request.body;
        const { createdAt, ...saveData } = data;
        if (data.id) {
          const updated = await db.update(products).set(saveData).where(eq(products.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const newProduct = await db.insert(products).values(saveData).returning();
          return response.status(200).json(newProduct[0]);
        }
      }
    }

    if (resource === 'settings') {
      if (method === 'GET') {
        const profile = await db.select().from(companyProfile).limit(1);
        const settings = await db.select().from(printSettings).limit(1);
        return response.status(200).json({ profile: profile[0] || {}, settings: settings[0] || {} });
      }
      if (method === 'POST') {
        const { type: settingsType, ...payload } = request.body;
        if (settingsType === 'profile') {
          const existing = await db.select().from(companyProfile).limit(1);
          if (existing.length > 0) {
            const updated = await db.update(companyProfile).set(payload).where(eq(companyProfile.id, existing[0].id)).returning();
            return response.status(200).json(updated[0]);
          } else {
            const inserted = await db.insert(companyProfile).values(payload).returning();
            return response.status(200).json(inserted[0]);
          }
        } else if (settingsType === 'print') {
          const existing = await db.select().from(printSettings).limit(1);
          if (existing.length > 0) {
            const updated = await db.update(printSettings).set(payload).where(eq(printSettings.id, existing[0].id)).returning();
            return response.status(200).json(updated[0]);
          } else {
            const inserted = await db.insert(printSettings).values(payload).returning();
            return response.status(200).json(inserted[0]);
          }
        }
      }
    }

    if (resource === 'auth') {
      if (method === 'POST') {
        const { email, password } = request.body;
        const user = await db.select().from(users).where(and(eq(users.email, email), eq(users.password, password))).limit(1);
        if (user.length === 0) return response.status(401).json({ error: 'Invalid credentials' });
        
        const role = user[0].roleId ? await db.select().from(roles).where(eq(roles.id, user[0].roleId)).limit(1) : null;
        return response.status(200).json({ user: user[0], role: role ? role[0] : null });
      }
    }

    if (resource === 'pricelists') {
      if (method === 'GET') {
        const all = await db.select().from(priceLists).orderBy(desc(priceLists.createdAt));
        return response.status(200).json(all);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          const updated = await db.update(priceLists).set(data).where(eq(priceLists.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(priceLists).values(data).returning();
          return response.status(200).json(inserted[0]);
        }
      }
    }

    if (resource === 'pricelistitems') {
      const priceListId = request.query.priceListId ? parseInt(request.query.priceListId as string) : null;
      if (method === 'GET') {
        const query = db.select().from(priceListItems);
        if (priceListId) {
          const items = await query.where(eq(priceListItems.priceListId, priceListId)).orderBy(desc(priceListItems.createdAt));
          return response.status(200).json(items);
        }
        const all = await query.orderBy(desc(priceListItems.createdAt));
        return response.status(200).json(all);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          const updated = await db.update(priceListItems).set(data).where(eq(priceListItems.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const inserted = await db.insert(priceListItems).values(data).returning();
          return response.status(200).json(inserted[0]);
        }
      }
    }

    if (resource === 'users') {
      if (method === 'GET') {
        const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
        return response.status(200).json(allUsers);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          const updated = await db.update(users).set(data).where(eq(users.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          const newUser = await db.insert(users).values(data).returning();
          return response.status(200).json(newUser[0]);
        }
      }
    }

    if (resource === 'auth') {
      if (method === 'POST') {
        const { email, password } = request.body;
        const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (userList.length === 0 || userList[0].password !== password) {
          return response.status(401).json({ error: 'Invalid credentials' });
        }
        let roleData = null;
        if (userList[0].roleId) {
          const dbRoles = await db.select().from(roles).where(eq(roles.id, userList[0].roleId)).limit(1);
          roleData = dbRoles[0] || null;
        }
        const { password: _, ...userWithoutPassword } = userList[0];
        return response.status(200).json({ user: userWithoutPassword, role: roleData });
      }
    }

    return response.status(404).json({ error: 'Resource not found' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
