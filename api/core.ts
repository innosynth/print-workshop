import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../db/index.js';
import { contacts, products, companyProfile, printSettings, users, roles, paymentQrs, productCategories, productBrands, priceLists, priceListItems } from '../db/schema.js';
import { eq, desc, and, not, sql } from 'drizzle-orm';

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
      try {
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
      } catch (error: any) {
        console.error('Payment QR error:', error);
        return response.status(500).json({ error: error.message || 'Internal Server Error' });
      }
    }

    if (resource === 'roles') {
      if (method === 'GET') {
        const allRoles = await db.select().from(roles).orderBy(desc(roles.createdAt));
        return response.status(200).json(allRoles);
      }
      if (method === 'POST') {
        const data = request.body;
        if (data.id) {
          const updatedRole = await db.update(roles).set({
            name: data.name,
            permissions: JSON.stringify(data.permissions)
          }).where(eq(roles.id, data.id)).returning();
          return response.status(200).json(updatedRole[0]);
        } else {
          const newRole = await db.insert(roles).values({
            name: data.name,
            permissions: JSON.stringify(data.permissions)
          }).returning();
          return response.status(200).json(newRole[0]);
        }
      }
      if (method === 'DELETE') {
        const { id } = request.query;
        if (!id) {
          return response.status(400).json({ error: 'Missing role ID' });
        }
        const roleId = parseInt(id as string);
        
        // Check if role is assigned to any users
        const assignedUsers = await db.select().from(users).where(eq(users.roleId, roleId)).limit(1);
        if (assignedUsers.length > 0) {
          return response.status(400).json({ error: 'Cannot delete role because it is assigned to staff members.' });
        }
        
        await db.delete(roles).where(eq(roles.id, roleId));
        return response.status(200).json({ success: true });
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

    // ─── Bulk Import: Preview ─────────────────────────────────────────────────
    if (resource === 'product_bulk_preview') {
      if (method === 'POST') {
        const rows: any[] = request.body; // array of parsed CSV rows (already mapped to DB fields)
        if (!Array.isArray(rows) || rows.length === 0) {
          return response.status(400).json({ error: 'No rows provided' });
        }

        // Fetch all existing products from DB (keyed by SKU)
        const existing = await db.select().from(products);
        const existingBySku = new Map(existing.map(p => [String(p.sku || '').trim().toLowerCase(), p]));

        const newProducts: any[] = [];
        const changed: any[] = [];      // any field changed
        const unchanged: any[] = [];
        const duplicatesInFile: any[] = [];
        const seenInFile = new Set<string>();

        // Fields to compare: [csvField, dbField, label, isNumeric]
        const COMPARE_FIELDS: [string, string, string, boolean][] = [
          ['name',        'name',        'Product Name', false],
          ['category',    'category',    'Category',     false],
          ['subCategory', 'subCategory', 'Sub Category', false],
          ['hsnCode',     'hsnCode',     'HSN Code',     false],
          ['gstRate',     'gstRate',     'GST %',        true ],
          ['sellPrice',   'sellPrice',   'Selling Price',true ],
        ];

        for (const row of rows) {
          const skuKey = String(row.sku || '').trim().toLowerCase();
          if (!skuKey) continue;

          // Duplicate within the uploaded file itself
          if (seenInFile.has(skuKey)) {
            duplicatesInFile.push({ ...row, _reason: 'Duplicate SKU in file' });
            continue;
          }
          seenInFile.add(skuKey);

          const dbProduct = existingBySku.get(skuKey);
          if (!dbProduct) {
            newProducts.push({ ...row, _status: 'new' });
          } else {
            // Build a diff list for all changed fields
            const diff: { field: string; label: string; oldVal: string; newVal: string }[] = [];

            for (const [csvField, dbField, label, isNumeric] of COMPARE_FIELDS) {
              const csvRaw = String(row[csvField] || '').trim();
              const dbRaw  = String((dbProduct as any)[dbField] ?? '').trim();

              if (isNumeric) {
                const csvNum = parseFloat(csvRaw || '0');
                const dbNum  = parseFloat(dbRaw  || '0');
                if (Math.abs(csvNum - dbNum) > 0.001) {
                  diff.push({ field: csvField, label, oldVal: dbRaw, newVal: csvRaw });
                }
              } else {
                if (csvRaw.toLowerCase() !== dbRaw.toLowerCase()) {
                  diff.push({ field: csvField, label, oldVal: dbRaw, newVal: csvRaw });
                }
              }
            }

            if (diff.length > 0) {
              changed.push({ ...row, _status: 'changed', _dbId: dbProduct.id, _diff: diff });
            } else {
              unchanged.push({ ...row, _status: 'unchanged', _dbId: dbProduct.id });
            }
          }
        }

        return response.status(200).json({
          summary: {
            total:            rows.length,
            new:              newProducts.length,
            changed:          changed.length,
            unchanged:        unchanged.length,
            duplicatesInFile: duplicatesInFile.length,
          },
          newProducts,
          changed,
          unchanged,
          duplicatesInFile,
        });
      }
    }

    // ─── Bulk Import: Confirm & Execute ──────────────────────────────────────
    if (resource === 'product_bulk_confirm') {
      if (method === 'POST') {
        const { newProducts = [], changed = [] } = request.body;

        let inserted = 0;
        let updated = 0;
        const errors: string[] = [];

        // Insert new products
        for (const row of newProducts) {
          try {
            const { _status, _dbId, _diff, _reason, ...data } = row;
            await db.insert(products).values(data);
            inserted++;
          } catch (err: any) {
            errors.push(`Insert failed for SKU "${row.sku}": ${err.message}`);
          }
        }

        // Update changed products — write all changed fields back
        for (const row of changed) {
          try {
            const { _status, _dbId, _diff, _reason, ...data } = row;
            // Build update payload from only the fields that actually changed
            const updatePayload: Record<string, any> = {};
            for (const d of (_diff || [])) {
              updatePayload[d.field] = data[d.field];
            }
            await db.update(products)
              .set(updatePayload)
              .where(eq(products.id, _dbId));
            updated++;
          } catch (err: any) {
            errors.push(`Update failed for SKU "${row.sku}": ${err.message}`);
          }
        }

        return response.status(200).json({ inserted, updated, errors });
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
      if (method === 'DELETE') {
        const { id } = request.query;
        if (!id) {
          return response.status(400).json({ error: 'Missing user ID' });
        }
        await db.delete(users).where(eq(users.id, parseInt(id as string)));
        return response.status(200).json({ success: true });
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
