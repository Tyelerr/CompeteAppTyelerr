# Universal Scroll Reset Implementation - All App Pages

## Task: Fix scroll position reset for ALL pages in the app

**Requirement**: Automatically scroll to top immediately when users navigate away from any page (on blur/leave, not on return)

## Implementation Plan:

### ✅ Step 1: Create TODO file

- [x] Document implementation plan and track progress

### ✅ Step 2: Enhance ScreenScrollView component

- [x] Add scroll reset functionality with useRef and useImperativeHandle
- [x] Add scrollToTop method for external control
- [x] Implement immediate scroll-to-top (no animation needed since user is leaving)

### ✅ Step 3: Update ScreenBilliardHome

- [x] Add navigation blur listener to detect when screen loses focus
- [x] Implement scroll reset when leaving screen
- [x] Add scroll view ref for controlling scroll position

### ✅ Step 4: Verify other billiard screens

- [x] Confirmed ScreenDailyTournaments uses ScreenBilliardHome (covered automatically)
- [x] Confirmed ScreenFargoRatedTournaments uses ScreenBilliardHome (covered automatically)
- [x] All billiard screens now have scroll reset functionality

### ✅ Step 5: Add scroll reset to Home page

- [x] Updated ScreenHome.tsx with same scroll reset functionality
- [x] Added navigation blur listener and scroll view ref
- [x] Home page now resets scroll position when navigating away

### 🔄 Step 6: Add scroll reset to ALL remaining screens

**Found 34 screens using ScreenScrollView - implementing universal scroll reset:**

**Main Active Screens to Update:**

- [ ] Home screens: ScreenHomePlayerSpotlight, ScreenHomeFeaturedPlayer, ScreenHomeFeaturedBar, ScreenHomeBarOfTheMonth
- [ ] Profile/Auth screens: ScreenProfileLogin, ScreenProfileRegister, ScreenForgotPassword, ScreenProfileRegisterTest
- [ ] Submit screens: ScreenSubmit, ScreenSubmitAfter
- [ ] FAQ screens: ScreenFAQs, SupportMessagesTab_Clean
- [ ] Profile logged screens: ProfileLoggedFavoriteTournaments, ProfileLoggedSearchAlerts, ScreenUserMessages
- [ ] Admin screens: ScreenAdminAnalytics, ScreenAdminApproved, ScreenAdminDeleted, ScreenAdminMessages, ScreenAdminPending, ScreenAdminTournaments, ScreenAdminUsers, ScreenAdminVenues

**Skipping backup/test/fixed versions to avoid duplicates**

### 🔄 Step 7: Testing and Verification

- [ ] Test scroll reset across all major screen categories
- [ ] Verify immediate reset behavior
- [ ] Ensure no conflicts with refresh functionality

## Files Modified:

1. ✅ `CompeteApp/screens/ScreenScrollView.tsx` - Core scroll functionality with forwardRef and scrollToTop method
2. ✅ `CompeteApp/screens/Billiard/ScreenBilliardHome.tsx` - Main billiard screen with navigation blur listener
3. ✅ `CompeteApp/screens/Home/ScrenHome.tsx` - Home screen with navigation blur listener

## Expected Behavior:

- When user navigates away from ANY screen in the app, scroll position immediately resets to top
- Immediate reset (no animation since user is leaving)
- Works consistently across ALL screens that use ScreenScrollView
- Universal user experience - every screen starts from the top when returned to
- No interference with existing refresh functionality
- Consistent behavior across Home, Billiard, Profile, Admin, Submit, FAQ, and all other sections
