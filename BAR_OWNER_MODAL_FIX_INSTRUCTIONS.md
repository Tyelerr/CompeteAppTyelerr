# Bar Owner Dashboard Modal Fix - Build 130

## Problem

After closing modals in the Bar Owner Dashboard, users cannot interact with buttons or select items again. The modals appear to be blocking all touch events even after they're closed.

## Root Cause

The modal backdrop `TouchableOpacity` components have `onPress` handlers that close the modal when clicking outside. However, these are interfering with touch events to the inner content, preventing buttons and selections from working.

## Solution

Replace the outer `TouchableOpacity` backdrop with a `Pressable` component that properly handles touch event propagation.

## Changes Needed in `CompeteApp/screens/BarOwner/ScreenBarOwnerDashboard.tsx`

### 1. Add Pressable to imports (Line 2-12)

```typescript
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  RefreshControl,
  TextInput,
  Alert,
  Pressable, // ADD THIS
} from 'react-native';
```

### 2. Fix Tournament Directors Modal (Around line 617)

**REPLACE:**

```typescript
<Modal visible={showDirectorsModal} transparent animationType="fade">
  <TouchableOpacity
    style={{...}}
    activeOpacity={1}
    onPress={() => setShowDirectorsModal(false)}
  >
    <View style={{...}}>
```

**WITH:**

```typescript
<Modal visible={showDirectorsModal} transparent animationType="fade">
  <Pressable
    style={{...}}
    onPress={() => setShowDirectorsModal(false)}
  >
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={{...}}
    >
```

**AND AT THE END OF THIS MODAL, REPLACE:**

```typescript
    </View>
  </TouchableOpacity>
</Modal>
```

**WITH:**

```typescript
    </Pressable>
  </Pressable>
</Modal>
```

### 3. Fix Add Tournament Director Modal (Around line 717)

**REPLACE:**

```typescript
<Modal visible={showAddDirectorModal} transparent animationType="fade">
  <TouchableOpacity
    style={{...}}
    activeOpacity={1}
    onPress={() => setShowAddDirectorModal(false)}
  >
    <View style={{...}}>
```

**WITH:**

```typescript
<Modal visible={showAddDirectorModal} transparent animationType="fade">
  <Pressable
    style={{...}}
    onPress={() => setShowAddDirectorModal(false)}
  >
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={{...}}
    >
```

**AND AT THE END, REPLACE:**

```typescript
    </View>
  </TouchableOpacity>
</Modal>
```

**WITH:**

```typescript
    </Pressable>
  </Pressable>
</Modal>
```

### 4. Fix Confirmation Modal (Around line 867)

**REPLACE:**

```typescript
<Modal visible={showConfirmModal} transparent animationType="fade">
  <TouchableOpacity
    style={{...}}
    activeOpacity={1}
    onPress={handleCancelConfirmation}
  >
    <View style={{...}}>
```

**WITH:**

```typescript
<Modal visible={showConfirmModal} transparent animationType="fade">
  <Pressable
    style={{...}}
    onPress={handleCancelConfirmation}
  >
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={{...}}
    >
```

**AND AT THE END, REPLACE:**

```typescript
    </View>
  </TouchableOpacity>
</Modal>
```

**WITH:**

```typescript
    </Pressable>
  </Pressable>
</Modal>
```

### 5. Fix Venue Selection Modal (Around line 1007)

**REPLACE:**

```typescript
<Modal visible={showVenueSelection} transparent animationType="fade">
  <TouchableOpacity
    style={{...}}
    activeOpacity={1}
    onPress={handleCancelVenueSelection}
  >
    <View style={{...}}>
```

**WITH:**

```typescript
<Modal visible={showVenueSelection} transparent animationType="fade">
  <Pressable
    style={{...}}
    onPress={handleCancelVenueSelection}
  >
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={{...}}
    >
```

**AND AT THE END, REPLACE:**

```typescript
    </View>
  </TouchableOpacity>
</Modal>
```

**WITH:**

```typescript
    </Pressable>
  </Pressable>
</Modal>
```

## Summary

- Add `Pressable` to imports
- Replace 4 modal backdrop `TouchableOpacity` components with `Pressable`
- Wrap modal content in inner `Pressable` with `onPress={(e) => e.stopPropagation()}`
- This allows the backdrop to close on outside clicks while inner content remains interactive

## Testing

After applying these changes:

1. Open "My Directors" modal - should open and close properly
2. Click "Add New Tournament Director" - should work
3. Search for and select a user - selection should work
4. Venue selection modal should appear and be clickable
5. Confirmation modal should work
6. All buttons and interactions should function normally

## Build Number

Update to Build 130 after applying this fix.
