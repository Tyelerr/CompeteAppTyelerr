# 🚀 GIVEAWAY ARCHIVAL SYSTEM - QUICK SETUP GUIDE

## ⚡ 5-Minute Setup

Follow these steps to get the giveaway archival system up and running.

---

## Step 1: Run SQL Scripts in Supabase (2 minutes)

### 1.1 Create Archive Tables

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of: `CompeteApp/sql/create_giveaways_archive.sql`
3. Click "Run"
4. Wait for success message: ✅ Tables created

### 1.2 Create Functions

1. In SQL Editor, create a new query
2. Copy and paste the contents of: `CompeteApp/sql/giveaway_archival_functions.sql`
3. Click "Run"
4. Wait for success message: ✅ All 4 functions created

---

## Step 2: Test the System (1 minute)

Run the test script:

```bash
cd CompeteApp
node test_giveaway_archival.js
```

Expected output:

```
✅ giveaways_archive table accessible
✅ entries_archive table accessible
✅ get_giveaway_archival_stats function works
✅ All 4 giveaway archival functions created successfully
```

---

## Step 3: Update Your Code (2 minutes)

### Option A: Use the New CrudGiveaway Module

Replace your existing giveaway API calls:

```typescript
// Import the new module
import CrudGiveaway from './ApiSupabase/CrudGiveaway';

// Use archival instead of direct delete
await CrudGiveaway.archiveGiveaway(giveawayId, adminUserId);
```

### Option B: Update ShopManage.tsx

In `CompeteApp/screens/Shop/ShopManage.tsx`, update the delete function:

```typescript
// OLD (line ~149):
async delete(giveawayId: string) {
  const { error } = await supabase
    .from('giveaways')
    .delete()
    .eq('id', giveawayId);
  if (error) throw error;
}

// NEW:
async delete(giveawayId: string) {
  const { data, error } = await supabase.rpc('archive_giveaway_manual', {
    giveaway_id: giveawayId,
    admin_user_id: null,
    reason: 'admin_deletion'
  });
  if (error) throw error;
}
```

---

## Step 4: Set Up Automated Archival (Optional)

### Option A: Cron Job (Recommended)

Add to your crontab:

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/CompeteApp && node run_giveaway_archival_now.js
```

### Option B: Manual Execution

Run anytime:

```bash
node CompeteApp/run_giveaway_archival_now.js
```

---

## ✅ Verification Checklist

- [ ] SQL scripts executed successfully
- [ ] Test script passes all checks
- [ ] Application code updated
- [ ] Automated archival scheduled (optional)

---

## 📊 Quick Commands

### View Statistics

```sql
SELECT * FROM get_giveaway_archival_stats();
```

### View Archived Giveaways

```sql
SELECT title, removal_reason, removal_date
FROM giveaways_archive
ORDER BY removal_date DESC
LIMIT 10;
```

### Archive Expired Giveaways Now

```sql
SELECT * FROM archive_expired_giveaways();
```

### Manually Archive a Giveaway

```sql
SELECT archive_giveaway_manual(
  '<giveaway-uuid>',
  '<admin-user-id>',
  'admin_deletion'
);
```

---

## 🆘 Troubleshooting

### "Function does not exist"

→ Run `giveaway_archival_functions.sql` again

### "Table does not exist"

→ Run `create_giveaways_archive.sql` first

### "Permission denied"

→ Check RLS policies and function permissions

### Test script fails

→ Check Supabase credentials in `.env` file

---

## 📚 Full Documentation

For complete details, see: `GIVEAWAY_ARCHIVAL_SYSTEM_COMPLETE.md`

---

## 🎯 What You Get

✅ **Complete Data Preservation**

- All deleted giveaways saved
- All entries preserved
- Full audit trail

✅ **Automatic Archival**

- Expired giveaways auto-archived
- Scheduled or on-demand

✅ **Easy Integration**

- Drop-in replacement for delete
- Backward compatible
- Type-safe API

✅ **Historical Access**

- Query archived data anytime
- View statistics
- Restore if needed

---

## 🎉 You're Done!

The giveaway archival system is now active and protecting your data!

**Next Steps:**

1. Monitor the system for a few days
2. Check statistics regularly
3. Set up automated archival if not done
4. Update any other code that deletes giveaways

---

**Questions?** Check `GIVEAWAY_ARCHIVAL_SYSTEM_COMPLETE.md` for detailed documentation.
