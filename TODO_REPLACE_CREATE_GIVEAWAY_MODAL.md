# Replace Create Giveaway Modal with V1 Version

## ✅ New Simplified Modal Created

**File:** `screens/Shop/ModalCreateGiveaway_V1.tsx`

This new modal is dramatically simplified to match Giveaway v1 specifications:

### What's REMOVED (No longer needed):

- ❌ All tabs (General, Entry Rules, Winner, Notifications, Security, Legal)
- ❌ Date-based ending (start_at, end_at, timezone)
- ❌ Entry methods (single entry, daily, bonus referrals, bonus social)
- ❌ Verification requirements (email, ID, receipt)
- ❌ Winner selection settings (method, number of winners, draw mode, backup winners)
- ❌ Notification templates (winner email, entry email, announcements)
- ❌ Security settings (IP check, CAPTCHA, blocked list, fraud notes)
- ❌ Legal settings (terms, privacy, geo restrictions, compliance checkboxes)

### What's KEPT (Essential fields only):

- ✅ Title \*
- ✅ Prize Name \*
- ✅ Prize ARV (Approximate Retail Value) \*
- ✅ Description
- ✅ Maximum Entries \* (replaces all date logic)
- ✅ Claim Period Days (default 7)
- ✅ Eligibility Text (optional additional requirements)
- ✅ Prize Image Upload

### Hard-Coded Values (Not in UI):

- Min Age: 18 (enforced at database level)
- Status: 'active' (always starts active)
- Entry Count Cached: 0 (auto-updated by trigger)

---

## 🔄 How to Replace

### Step 1: Find Where Modal is Used

The modal is likely imported and used in:

- `screens/Shop/ScreenShop.tsx`
- `screens/Shop/ShopManage.tsx`
- Or similar shop/admin screens

### Step 2: Replace the Import

**OLD:**

```typescript
import ModalCreateGiveaway from './ModalCreateGiveaway';
```

**NEW:**

```typescript
import ModalCreateGiveaway from './ModalCreateGiveaway_V1';
```

### Step 3: No Props Changes Needed

The new modal uses the same props interface:

```typescript
<ModalCreateGiveaway
  visible={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onCreated={(newGiveaway) => {
    // Refresh giveaway list
  }}
/>
```

---

## 📋 Quick Replacement Script

If you want to do a quick find-and-replace:

1. Open `screens/Shop/ScreenShop.tsx` (or wherever the modal is used)
2. Find: `from './ModalCreateGiveaway'`
3. Replace with: `from './ModalCreateGiveaway_V1'`
4. Save and test

---

## 🎨 What the New Modal Looks Like

**Single Screen (No Tabs):**

- Clean, simple form
- Only essential fields
- Info box explaining v1 rules
- Same footer buttons (Cancel / Create Giveaway)

**Fields in Order:**

1. Giveaway Title \*
2. Prize Name \*
3. Prize ARV \*
4. Description
5. Maximum Entries \*
6. Claim Period (days)
7. Additional Eligibility Requirements
8. Prize Image Upload

**Info Box at Bottom:**
Shows the locked-in rules:

- Minimum age: 18 (enforced automatically)
- Ends by entries only (no end dates)
- One entry per user (database enforced)
- Admin-only winner selection
- 1-minute lock during winner draw

---

## ✅ Benefits of New Modal

1. **Simpler UX** - No confusing tabs, just one scrollable form
2. **Faster** - Less fields = quicker giveaway creation
3. **Clearer** - Shows v1 rules upfront
4. **Safer** - Can't misconfigure (rules are enforced)
5. **Matches Database** - Uses exact v1 schema fields

---

## 🧪 Testing the New Modal

After replacing:

1. Open the app
2. Navigate to Shop/Giveaways
3. Click "Create New Giveaway"
4. Verify:
   - ✅ No tabs visible
   - ✅ Only essential fields shown
   - ✅ Info box displays v1 rules
   - ✅ Can upload prize image
   - ✅ Form validates required fields
   - ✅ Creates giveaway with correct schema

---

## 📝 Next Steps After Replacement

Once the modal is replaced and working:

1. **Delete old modal** (optional cleanup):

   - `screens/Shop/ModalCreateGiveaway.tsx` (old version)
   - `screens/Shop/ModalCreateGiveaway_FIXED.tsx` (if exists)

2. **Update Edit Modal** (if you have one):

   - Apply same simplification to ModalEditGiveaway.tsx

3. **Test Full Flow**:
   - Create giveaway
   - Enter giveaway
   - Pick winner (when ready)

---

## 🚀 Ready to Deploy

The new modal is production-ready and matches the Giveaway v1 database schema perfectly. Just replace the import and you're done!
