import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/index';
import { contacts, products, companyProfile, printSettings, users, roles, paymentQrs } from '../src/db/schema';
import { eq, desc, and, not } from 'drizzle-orm';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { resource } = request.query;
  const method = request.method;

  try {
    if (resource === 'payment_qrs') {
      if (method === 'GET') {
        const qrs = await db.select().from(paymentQrs).orderBy(desc(paymentQrs.createdAt));
        return response.status(200).json(qrs);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          // Update active status
          if (data.isActiveForInvoice) {
            await db.update(paymentQrs).set({ isActiveForInvoice: false }).where(not(eq(paymentQrs.id, data.id)));
          }
          if (data.isActiveForEstimate) {
            await db.update(paymentQrs).set({ isActiveForEstimate: false }).where(not(eq(paymentQrs.id, data.id)));
          }
          const updated = await db.update(paymentQrs).set(data).where(eq(paymentQrs.id, data.id)).returning();
          return response.status(200).json(updated[0]);
        } else {
          // Create new
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

    if (resource === 'auth') {
      if (method === 'POST') {
        const { email, password } = request.body;
        const user = await db.select().from(users).where(and(eq(users.email, email), eq(users.password, password))).limit(1);
        if (user.length === 0) return response.status(401).json({ error: 'Invalid credentials' });
        
        const role = user[0].roleId ? await db.select().from(roles).where(eq(roles.id, user[0].roleId)).limit(1) : null;
        return response.status(200).json({ user: user[0], role: role ? role[0] : null });
      }
    }

    if (resource === 'users') {
      if (method === 'GET') {
        const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
        return response.status(200).json(allUsers);
      }
      if (method === 'POST') {
        const data = request.body;
        const newUser = await db.insert(users).values(data).returning();
        return response.status(200).json(newUser[0]);
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
        const newContact = await db.insert(contacts).values(data).returning();
        return response.status(200).json(newContact[0]);
      }
    }

    if (resource === 'products') {
      if (method === 'GET') {
        const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
        return response.status(200).json(allProducts);
      }
      if (method === 'POST') {
        const data = request.body;
        const newProduct = await db.insert(products).values(data).returning();
        return response.status(200).json(newProduct[0]);
      }
    }

    if (resource === 'settings') {
      if (method === 'GET') {
        const profile = await db.select().from(companyProfile).limit(1);
        const settings = await db.select().from(printSettings).limit(1);
        return response.status(200).json({ profile: profile[0] || null, settings: settings[0] || null });
      }
      if (method === 'POST') {
        const { type, ...data } = request.body;
        if (type === 'profile') {
          const existing = await db.select().from(companyProfile).limit(1);
          if (existing.length > 0) await db.update(companyProfile).set(data).where(eq(companyProfile.id, existing[0].id));
          else await db.insert(companyProfile).values(data);
        } else if (type === 'print') {
          const existing = await db.select().from(printSettings).limit(1);
          if (existing.length > 0) await db.update(printSettings).set(data).where(eq(printSettings.id, existing[0].id));
          else await db.insert(printSettings).values(data);
        }
        return response.status(200).json({ success: true });
      }
    }

    return response.status(404).json({ error: 'Resource not found' });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
