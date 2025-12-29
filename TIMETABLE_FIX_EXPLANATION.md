# Timetable Alignment Fix - Explanation

## Problem Summary
- Table rows use **rounded** earliest time (e.g., `09:00` from `09:30`)
- Class blocks use **actual** earliest time (e.g., `09:30`)
- Result: Classes render 30px too high (offset = difference between actual and rounded time)
- Positioning layer height doesn't match table height

## Solution
Use the **same rounded time reference** for both table rows and class positioning.

## Code Changes

### 1. Calculate Rounded Times (Lines 277-283)

**Before:**
```typescript
const gridStartMinutes = timeToMinutes(earliestTime);
const gridEndMinutes = timeToMinutes(latestTime);
const gridHeight = (gridEndMinutes - gridStartMinutes);
```

**After:**
```typescript
// Calculate rounded start/end times (same as used in generateTimeSlots for table rows)
const earliestMinutes = timeToMinutes(earliestTime);
const latestMinutes = timeToMinutes(latestTime);
const roundedStartMinutes = Math.floor(earliestMinutes / 60) * 60; // Round down to nearest hour
const roundedEndMinutes = Math.ceil(latestMinutes / 60) * 60;     // Round up to nearest hour
const roundedStartTime = minutesToTime(roundedStartMinutes);
const roundedEndTime = minutesToTime(roundedEndMinutes);

// Calculate grid dimensions using ROUNDED times (to match table rows)
const gridHeight = (roundedEndMinutes - roundedStartMinutes);
```

**Why:** This ensures the grid height calculation uses the same rounded time range as the table rows.

### 2. Use Rounded Start Time for Class Positioning (Line 360)

**Before:**
```typescript
gridStartTime={earliestTime}  // Actual time: "09:30"
```

**After:**
```typescript
gridStartTime={roundedStartTime}  // Rounded time: "09:00"
```

**Why:** Classes now calculate their position relative to the same rounded start time that table rows use.

## How the Fix Resolves the Issues

### Issue 1: Vertical Offset (Classes Too High)

**Before:**
- Table row 0: Represents `09:00 - 10:00` (starts at 48px from grid top)
- Class at `09:30`: Calculates `top = (09:30 - 09:30) = 0px` relative to positioning layer
- Class renders at: `48px + 0px = 48px` (start of first row)
- **Problem:** Should be `48px + 30px = 78px` (30px into first row)

**After:**
- Table row 0: Represents `09:00 - 10:00` (starts at 48px from grid top)
- Class at `09:30`: Calculates `top = (09:30 - 09:00) = 30px` relative to positioning layer
- Class renders at: `48px + 30px = 78px` ✅
- **Fixed:** Class is correctly positioned 30px into the first row

### Issue 2: Height Mismatch

**Before:**
- Positioning layer height: `(17:45 - 09:30) = 495px` (actual times)
- Table height: `(18:00 - 09:00) = 540px` (rounded times)
- **Mismatch:** 45px difference

**After:**
- Positioning layer height: `(18:00 - 09:00) = 540px` (rounded times)
- Table height: `(18:00 - 09:00) = 540px` (rounded times)
- **Fixed:** Heights match exactly ✅

## Example Calculation

**Scenario:** Earliest class at `09:30`, latest at `17:45`

### Rounded Times:
- Rounded start: `09:00` (rounded down from `09:30`)
- Rounded end: `18:00` (rounded up from `17:45`)

### Table Rows:
- Row 0: `09:00 - 10:00` (height: 60px)
- Row 1: `10:00 - 11:00` (height: 60px)
- ...
- Row 8: `17:00 - 18:00` (height: 60px)
- Total: 9 rows × 60px = 540px

### Class Positioning:
- Class at `09:30`:
  - `top = (09:30 - 09:00) = 30px` relative to positioning layer
  - Renders at `48px + 30px = 78px` from grid top ✅
  - Correctly positioned 30px into row 0

- Class at `17:45`:
  - `top = (17:45 - 09:00) = 525px` relative to positioning layer
  - Renders at `48px + 525px = 573px` from grid top ✅
  - Correctly positioned 45px into row 8 (17:00-18:00)

### Grid Height:
- Positioning layer: `(18:00 - 09:00) = 540px` ✅
- Table: `9 rows × 60px = 540px` ✅
- Heights match perfectly

## Verification

✅ **Same earliest time reference?** YES - Both use rounded `09:00`
✅ **Same total duration?** YES - Both use `09:00` to `18:00` (540px)
✅ **Consistent time-to-pixel mapping?** YES - Both use 1px per minute
✅ **Classes align with rows?** YES - Class at `09:30` renders 30px into first row

## Result

- Classes render at the correct vertical position within their time rows
- Positioning layer height matches table height exactly
- No vertical offset or height mismatch
- Time-to-pixel mapping remains consistent (1px per minute)





