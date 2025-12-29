# Timetable Grid Alignment - Root Cause Analysis

## Problem Statement
Class components are:
1. Rendered slightly too high vertically
2. Occupying more vertical space than their corresponding time cells

## Step-by-Step Logic Trace

### Step 1: Time Range Calculation (Lines 236-243)
```typescript
const earliestTime = allTimes.reduce((earliest, time) => time < earliest ? time : earliest);
const latestTime = allTimes.reduce((latest, time) => time > latest ? time : latest);
```
**Result:** Actual earliest/latest times from exam data
- Example: `earliestTime = "09:30"`, `latestTime = "17:45"`

### Step 2: Generate Time Slots (Line 266)
```typescript
const timeSlots = generateTimeSlots(earliestTime, latestTime);
```

**Inside generateTimeSlots() (Lines 34-47):**
```typescript
const startMinutes = timeToMinutes(earliestTime);  // 09:30 = 570 minutes
const endMinutes = timeToMinutes(latestTime);      // 17:45 = 1065 minutes

// Round start DOWN to nearest hour
const roundedStart = Math.floor(startMinutes / 60) * 60;  // 570 → 540 (09:00)
// Round end UP to nearest hour  
const roundedEnd = Math.ceil(endMinutes / 60) * 60;        // 1065 → 1080 (18:00)

// Generate slots: [09:00, 10:00, 11:00, ..., 18:00]
```

**Result:** Time slots at hour boundaries
- Slots: `["09:00", "10:00", "11:00", ..., "18:00"]`
- **Reference start time: `09:00` (rounded down from 09:30)**

### Step 3: Create Table Rows (Lines 269-275)
```typescript
const timeSlotPairs: Array<{ start: string; end: string }> = [];
for (let i = 0; i < timeSlots.length - 1; i++) {
  timeSlotPairs.push({
    start: timeSlots[i],    // 09:00
    end: timeSlots[i + 1],  // 10:00
  });
}
```

**Result:** Table rows representing hour intervals
- Row 0: `09:00 - 10:00` (height: 60px)
- Row 1: `10:00 - 11:00` (height: 60px)
- ...
- **First row starts at `09:00` (rounded time)**

### Step 4: Grid Height Calculation (Lines 278-280)
```typescript
const gridStartMinutes = timeToMinutes(earliestTime);  // 09:30 = 570 minutes
const gridEndMinutes = timeToMinutes(latestTime);        // 17:45 = 1065 minutes
const gridHeight = (gridEndMinutes - gridStartMinutes); // 1065 - 570 = 495px
```

**Result:** Grid height from ACTUAL times
- `gridHeight = 495px` (8 hours 15 minutes)
- **Uses actual `earliestTime` (09:30), NOT rounded (09:00)**

### Step 5: Table Height (Implicit)
```typescript
// Table has timeSlotPairs.length rows, each ROW_HEIGHT (60px) tall
// timeSlotPairs.length = 9 (09:00 to 18:00 = 9 hour intervals)
// Table height = 9 * 60 = 540px
```

**Result:** Table height from ROUNDED slots
- Table height: `540px` (9 hours)
- **Uses rounded time range (09:00 to 18:00)**

### Step 6: Class Positioning (Lines 104-119, 360)
```typescript
// Line 360: Pass actual earliestTime to ClassCell
gridStartTime={earliestTime}  // "09:30" (actual, not rounded)

// Inside ClassCell (Line 112):
const gridStartMinutes = timeToMinutes(gridStartTime);  // 09:30 = 570
const entryStartMinutes = timeToMinutes(entry.startTime);
const topPixels = (entryStartMinutes - gridStartMinutes);
```

**Example Calculation:**
- Class starts at `09:30`
- `topPixels = (570 - 570) = 0px`
- **Class positioned at `top: 0px` relative to positioning layer**

### Step 7: Positioning Layer Offset (Line 340)
```typescript
top: `${HEADER_HEIGHT}px`,  // 48px (below header)
```

**Result:** Positioning layer starts 48px from top of grid container

## Root Cause Identification

### Issue #1: Reference Time Mismatch ⚠️ **CRITICAL**

**Table Rows:**
- Use **rounded** earliest time: `09:00` (from `generateTimeSlots`)
- First row represents: `09:00 - 10:00`
- First row's top edge is at `48px` (below header)

**Class Positioning:**
- Uses **actual** earliest time: `09:30` (from `earliestTime`)
- Class at `09:30` calculates: `top = (570 - 570) = 0px` relative to positioning layer
- Positioning layer starts at `48px` from grid container
- **Class renders at `48px` from grid container top**

**Visual Result:**
```
Grid Container (top: 0px)
├─ Header (0px to 48px)
├─ Positioning Layer starts at 48px
│  └─ Class at 09:30: top: 0px (relative) = 48px (absolute)
└─ Table tbody starts at 48px
   └─ First row (09:00-10:00): top: 48px, represents 09:00-10:00
```

**Problem:** 
- Class at `09:30` is positioned at `48px` (start of positioning layer)
- But `09:30` should be **30px into the first row** (which starts at 48px)
- **Expected position: `48px + 30px = 78px`**
- **Actual position: `48px`**
- **Offset: `-30px` (too high by 30px)**

### Issue #2: Height Mismatch ⚠️ **CRITICAL**

**Positioning Layer Height:**
- Calculated from actual times: `495px` (09:30 to 17:45)

**Table Height:**
- Calculated from rounded slots: `540px` (09:00 to 18:00 = 9 rows × 60px)

**Problem:**
- Positioning layer is `45px` shorter than table
- Classes near the end of the day will be misaligned or cut off
- The positioning layer doesn't cover the full table height

### Issue #3: Time-to-Pixel Mapping Consistency ✅ **CORRECT**

**Both use 1px per minute:**
- `ROW_HEIGHT = 60px` per hour = 1px per minute ✅
- Class height: `(endTime - startTime)` in minutes = pixels ✅
- **This is consistent** - not the source of the problem

## Root Cause Summary

### Primary Root Cause: **Reference Time Mismatch**

The timetable grid (table rows) and class positioning logic use **different reference start times**:

1. **Table rows** use the **rounded** earliest time (`09:00`) from `generateTimeSlots()`
2. **Class positioning** uses the **actual** earliest time (`09:30`) from `earliestTime`

This creates a vertical offset equal to the difference between the actual earliest time and its rounded-down hour boundary.

**Formula:**
```
Offset = (actualEarliestTime - roundedEarliestTime) in minutes
Offset = 30 minutes = 30px (too high)
```

### Secondary Root Cause: **Height Calculation Mismatch**

The positioning layer height and table height are calculated from different time ranges:

1. **Positioning layer** uses actual time range: `(latestTime - earliestTime)`
2. **Table** uses rounded time range: `(roundedLatestTime - roundedEarliestTime)`

This causes the positioning layer to be shorter than the table, causing misalignment at the bottom.

## Verification Checklist

- ❌ **Same earliest time reference?** NO - Table uses rounded (09:00), classes use actual (09:30)
- ❌ **Same total duration?** NO - Table uses rounded range (9 hours), positioning layer uses actual range (8h 15m)
- ✅ **Consistent time-to-pixel mapping?** YES - Both use 1px per minute

## Conclusion

The misalignment is caused by:
1. **Hour rounding in the grid** - Table rows use rounded hour boundaries
2. **Actual-time positioning in class components** - Classes use actual exam times
3. **Mismatch between the two** - Different reference points create vertical offset

The fix requires using the **same rounded time reference** for both table rows and class positioning.





