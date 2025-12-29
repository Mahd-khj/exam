# Timetable Grid Alignment Analysis

## Problem Statement
Class components are vertically misaligned (rendered too high) and occupy more vertical space than their corresponding time cells.

## Root Cause Analysis

### 1. **CRITICAL: Grid Start Time Mismatch**

**Location:** Lines 34-47 (`generateTimeSlots`) vs Lines 238-243, 278, 360

**Issue:**
- `generateTimeSlots()` rounds the earliest time **down to the nearest hour** (line 39: `Math.floor(startMinutes / 60) * 60`)
- Example: If earliest exam is at `09:30`, slots start at `09:00` (rounded down)
- Table rows are generated from these rounded slots (lines 269-275)
- **BUT** class positioning uses the **actual** `earliestTime` (line 360: `gridStartTime={earliestTime}`)
- Class cells calculate position as: `(entryStartMinutes - gridStartMinutes)` where `gridStartMinutes` is from actual `earliestTime`, not rounded

**Impact:**
- If earliest exam is `09:30`, table rows start at `09:00`, but classes position from `09:30`
- This creates a **30-minute (30px) vertical offset** - classes appear too high
- Classes positioned at `09:30` will render at `top: 0px` relative to the grid container, but the first table row represents `09:00-10:00`, causing misalignment

**Evidence:**
```typescript
// Line 39: Rounds down to hour
const roundedStart = Math.floor(startMinutes / 60) * 60;

// Line 360: Uses actual earliestTime (not rounded)
gridStartTime={earliestTime}

// Line 112: Calculates offset from actual earliestTime
const topPixels = (entryStartMinutes - gridStartMinutes);
```

### 2. **Grid Height Calculation Mismatch**

**Location:** Line 280 vs Line 321

**Issue:**
- Grid height is calculated as: `(gridEndMinutes - gridStartMinutes)` in pixels (line 280)
- This uses actual times (e.g., `09:30` to `17:45` = 495 minutes = 495px)
- Table rows are generated from rounded slots (e.g., `09:00` to `18:00` = 9 hours = 540px)
- The positioning layer height (495px) doesn't match the table height (540px)

**Impact:**
- Class positioning layer is shorter than the table, causing classes near the end to be misaligned
- Classes may overflow or be cut off

### 3. **Table Row Height vs Class Height Unit Consistency**

**Location:** Line 85, 321, 116

**Status:** ✅ **CORRECT**
- `ROW_HEIGHT = 60px` per hour = 1px per minute
- Table rows: `height: ${ROW_HEIGHT}px` = 60px per hour
- Class height: `entryEndMinutes - entryStartMinutes` = pixels (1px per minute)
- **This is consistent** - both use 1px per minute

### 4. **Header and Padding Offsets**

**Location:** Lines 290-316 (thead), 340

**Status:** ⚠️ **POTENTIAL ISSUE**
- Header has `px-4 py-3` padding (Tailwind classes)
- Class positioning layer uses `top: ${HEADER_HEIGHT}px` (48px constant)
- The actual header height may not be exactly 48px due to:
  - Padding (`py-3` = 12px top + 12px bottom = 24px)
  - Font size and line height
  - Border thickness
- If actual header height ≠ 48px, there's a vertical offset

**Impact:**
- Small vertical misalignment if header height doesn't match constant

### 5. **Positioning Context**

**Location:** Lines 286, 337-345

**Status:** ✅ **CORRECT**
- Grid container: `position: 'relative'` (line 286)
- Class positioning layer: `position: 'absolute'` (line 344)
- Classes are positioned relative to the grid container ✅

### 6. **CSS Box Model**

**Location:** Line 179

**Status:** ✅ **CORRECT**
- `boxSizing: 'border-box'` is set
- Padding (`p-2` = 8px) and borders are included in height calculations
- However, `minHeight: '30px'` (line 178) could cause classes shorter than 30 minutes to be taller than their time span

**Impact:**
- Very short classes (< 30 minutes) will be 30px tall instead of their actual duration

## Summary of Issues

### Critical Issues (Must Fix):
1. **Grid start time mismatch** - Classes use actual `earliestTime` but table uses rounded time
2. **Grid height mismatch** - Positioning layer height doesn't match table height

### Minor Issues:
3. **Header height constant** - May not match actual rendered header height
4. **MinHeight override** - Short classes forced to 30px minimum

## Proposed Fix

### Fix 1: Align Grid Start Time
Use the **rounded** earliest time (from `generateTimeSlots`) for class positioning, not the actual `earliestTime`:

```typescript
// Get the rounded start time (same as used for table rows)
const roundedStartMinutes = Math.floor(timeToMinutes(earliestTime) / 60) * 60;
const roundedStartTime = minutesToTime(roundedStartMinutes);

// Pass rounded time to ClassCell
gridStartTime={roundedStartTime}
```

### Fix 2: Align Grid Height
Calculate grid height from rounded slots, not actual times:

```typescript
// Use rounded times for grid height (matching table)
const roundedStartMinutes = Math.floor(timeToMinutes(earliestTime) / 60) * 60;
const roundedEndMinutes = Math.ceil(timeToMinutes(latestTime) / 60) * 60;
const gridHeight = (roundedEndMinutes - roundedStartMinutes);
```

### Fix 3: Remove MinHeight Override
Remove or reduce `minHeight` to allow classes to match their exact duration:

```typescript
// Remove minHeight or set to 0
minHeight: '0px', // or remove entirely
```

### Fix 4: Measure Header Height Dynamically
Use a ref to measure actual header height instead of constant, or ensure constant matches actual height.

## Expected Outcome After Fix

1. Classes align exactly with their time slots (no vertical offset)
2. Class height matches exact duration (no forced minimums)
3. Positioning layer height matches table height
4. All classes render within their allocated time spans





