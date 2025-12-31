import ClassCode from "../../models/ClassCode";
import Room from "../../models/Room";
import { createExam, CreateExamData } from "./examService";
import * as XLSX from "xlsx";

export interface CSVRow {
  courseCode?: string;
  courseName?: string;
  date?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  location?: string;
  duration?: string;
  [key: string]: any;
}

export interface CSVUploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; clashes?: any[] }>;
}

/**
 * Parse CSV text into rows using XLSX library for better CSV handling
 */
export function parseCSV(csvText: string): CSVRow[] {
  try {
    // Use XLSX library to parse CSV (handles quoted fields, commas in values, etc.)
    const workbook = XLSX.read(csvText, { type: 'string', raw: false });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("CSV file has no sheets");
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '', // Default value for empty cells
      raw: false // Convert dates and numbers to strings
    }) as any[][];

    if (jsonData.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    // Get headers (first row) and convert to lowercase, filter out empty headers
    const rawHeaders = (jsonData[0] as string[]).map((h: string) => 
      String(h || '').trim().toLowerCase()
    );
    const headers = rawHeaders.filter((h, index) => {
      // Keep header if it's not empty, or if it's the first column (might be intentional)
      return h !== '' || index === 0;
    });

    console.log('=== CSV Parsing Debug ===');
    console.log('Raw headers:', rawHeaders);
    console.log('Filtered headers:', headers);
    console.log('Number of data rows:', jsonData.length - 1);

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const values = jsonData[i] as any[];
      
      // Skip completely empty rows (all values are empty/null/undefined)
      const hasAnyValue = values.some(v => v != null && String(v).trim() !== '');
      if (!hasAnyValue) {
        console.log(`Skipping empty row ${i + 1}`);
        continue;
      }
      
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert to string and trim
        row[header] = value != null ? String(value).trim() : "";
      });
      rows.push(row);
    }

    console.log('Parsed rows count:', rows.length);
    console.log('Parsed rows sample (first row):', rows[0] || 'No rows');
    return rows;
  } catch (error: any) {
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}

/**
 * Parse Excel file (XLSX or XLS) into rows
 */
export function parseExcel(fileBuffer: Buffer): CSVRow[] {
  try {
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellDates: false, // Keep dates as strings
      raw: false // Convert to strings
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Excel file has no sheets");
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '', // Default value for empty cells
      raw: false // Convert dates and numbers to strings
    }) as any[][];

    if (jsonData.length < 2) {
      throw new Error("Excel file must have at least a header row and one data row");
    }

    // Get headers (first row) and convert to lowercase, filter out empty headers
    const rawHeaders = (jsonData[0] as string[]).map((h: string) => 
      String(h || '').trim().toLowerCase()
    );
    const headers = rawHeaders.filter((h, index) => {
      // Keep header if it's not empty, or if it's the first column (might be intentional)
      return h !== '' || index === 0;
    });

    console.log('=== Excel Parsing Debug ===');
    console.log('Raw headers:', rawHeaders);
    console.log('Filtered headers:', headers);
    console.log('Number of data rows:', jsonData.length - 1);

    // Parse data rows
    const rows: CSVRow[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const values = jsonData[i] as any[];
      
      // Skip completely empty rows (all values are empty/null/undefined)
      const hasAnyValue = values.some(v => v != null && String(v).trim() !== '');
      if (!hasAnyValue) {
        console.log(`Skipping empty row ${i + 1}`);
        continue;
      }
      
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert to string and trim, handle dates/numbers
        if (value == null || value === '') {
          row[header] = "";
        } else if (value instanceof Date) {
          // Format date as YYYY-MM-DD
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const day = String(value.getDate()).padStart(2, '0');
          row[header] = `${year}-${month}-${day}`;
        } else {
          let strValue = String(value).trim();
          // Handle ISO date strings (e.g., "2024-03-15T00:00:00.000Z" -> "2024-03-15")
          if (strValue.includes('T') && strValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
            strValue = strValue.split('T')[0];
          }
          row[header] = strValue;
        }
      });
      rows.push(row);
    }

    console.log('Parsed rows count:', rows.length);
    console.log('Parsed rows sample (first row):', rows[0] || 'No rows');
    return rows;
  } catch (error: any) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Normalize date format (expects YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, or ISO date strings)
 * Returns empty string if date cannot be parsed
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') {
    return '';
  }

  const trimmed = dateStr.trim();

  // Handle ISO date strings (e.g., "2024-03-15T00:00:00.000Z" -> "2024-03-15")
  if (trimmed.includes('T')) {
    const isoDate = trimmed.split('T')[0];
    if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Validate the date
      const date = new Date(isoDate);
      if (!isNaN(date.getTime()) && date.toISOString().split('T')[0] === isoDate) {
        return isoDate;
      }
    }
  }

  // Try YYYY-MM-DD format (already in correct format)
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && date.toISOString().split('T')[0] === trimmed) {
      return trimmed;
    }
  }

  // Try DD/MM/YYYY or MM/DD/YYYY format
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/").map(p => p.trim());
    if (parts.length === 3) {
      const part1 = parseInt(parts[0], 10);
      const part2 = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(part1) && !isNaN(part2) && !isNaN(year)) {
        // Try DD/MM/YYYY format first (more common internationally)
        if (part1 <= 31 && part2 <= 12) {
          const dateStr1 = `${year}-${part2.toString().padStart(2, '0')}-${part1.toString().padStart(2, '0')}`;
          const date1 = new Date(dateStr1);
          if (!isNaN(date1.getTime()) && date1.getFullYear() === year && 
              date1.getMonth() + 1 === part2 && date1.getDate() === part1) {
            return dateStr1;
          }
        }
        
        // Try MM/DD/YYYY format (US format)
        if (part1 <= 12 && part2 <= 31) {
          const dateStr2 = `${year}-${part1.toString().padStart(2, '0')}-${part2.toString().padStart(2, '0')}`;
          const date2 = new Date(dateStr2);
          if (!isNaN(date2.getTime()) && date2.getFullYear() === year && 
              date2.getMonth() + 1 === part1 && date2.getDate() === part2) {
            return dateStr2;
          }
        }
      }
    }
  }

  // Try other common formats
  // Try parsing with Date constructor as last resort
  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // If all parsing fails, return empty string
  console.warn(`Could not parse date: "${dateStr}"`);
  return '';
}

// Normalize time format (expects HH:MM or HH:MM:SS)
function normalizeTime(timeStr: string): string {
  if (!timeStr || timeStr.trim() === '') {
    return '';
  }

  // Remove AM/PM and handle 12-hour format if needed
  const hasAM = timeStr.toLowerCase().includes("am");
  const hasPM = timeStr.toLowerCase().includes("pm");
  const cleanTime = timeStr.replace(/\s*(AM|PM|am|pm)\s*/i, "").trim();
  
  const parts = cleanTime.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    if (isNaN(hours)) {
      console.warn(`Invalid hours in time string: "${timeStr}"`);
      return '';
    }
    
    let minutes = parseInt(parts[1] || "00", 10);
    if (isNaN(minutes)) {
      minutes = 0;
    }

    // Handle 12-hour format
    if (hasPM && hours !== 12) {
      hours += 12;
    } else if (hasAM && hours === 12) {
      hours = 0;
    }

    // Validate hours and minutes
    if (hours < 0 || hours > 23) {
      console.warn(`Invalid hours value: ${hours} from time string: "${timeStr}"`);
      return '';
    }
    if (minutes < 0 || minutes > 59) {
      console.warn(`Invalid minutes value: ${minutes} from time string: "${timeStr}"`);
      return '';
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  }
  
  // If format doesn't match, try to parse as-is or return empty
  console.warn(`Time format not recognized: "${timeStr}"`);
  return '';
}

// Get day name from date

function getDayFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

//  Upload exams from CSV data

export async function uploadCSV(
  csvData: CSVRow[]
): Promise<CSVUploadResult> {
  const result: CSVUploadResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  // Log first row for debugging
  if (csvData.length > 0) {
    console.log('=== CSV Upload Debug Info ===');
    console.log('Total rows:', csvData.length);
    console.log('First row keys:', Object.keys(csvData[0]));
    console.log('First row data:', JSON.stringify(csvData[0], null, 2));
  }

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    
    // Skip completely empty rows
    const rowValues = Object.values(row);
    const hasAnyValue = rowValues.some(v => v != null && String(v).trim() !== '');
    if (!hasAnyValue) {
      console.log(`Skipping completely empty row ${i + 2}`);
      continue;
    }
    
    try {
      // Log row data for debugging
      console.log(`\n--- Processing Row ${i + 2} ---`);
      console.log('Row keys:', Object.keys(row));
      console.log('Row data:', JSON.stringify(row, null, 2));

      // Helper function to find field value by trying multiple variations
      const findField = (variations: string[], fieldName: string): string => {
        for (const variation of variations) {
          // Try exact match (case-insensitive)
          for (const key in row) {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
            const normalizedVariation = variation.toLowerCase().replace(/\s+/g, '');
            if (normalizedKey === normalizedVariation) {
              const value = String(row[key] || '').trim();
              if (value) {
                console.log(`Found ${fieldName} as "${key}" with value: "${value}"`);
                return value;
              }
            }
          }
          // Try direct access
          if (row[variation] !== undefined) {
            const value = String(row[variation] || '').trim();
            if (value) {
              console.log(`Found ${fieldName} as "${variation}" with value: "${value}"`);
              return value;
            }
          }
        }
        console.log(`Could not find ${fieldName}. Tried variations:`, variations);
        return '';
      };

      // Extract and validate data - try multiple variations of column names
      const courseCode = findField(['coursecode', 'course code', 'code', 'course', 'coursecode', 'course_code'], 'courseCode');
      const dateStr = findField(['date', 'examdate', 'exam date', 'exam_date', 'exam date', 'examdate'], 'date');
      const startTimeStr = findField(['starttime', 'start time', 'start', 'start_time', 'starttime'], 'startTime');
      const endTimeStr = findField(['endtime', 'end time', 'end', 'end_time', 'endtime'], 'endTime');
      const roomName = findField(['room', 'location', 'roomname', 'room name', 'room_name'], 'room');

      console.log('Extracted values:', {
        courseCode,
        dateStr,
        startTimeStr,
        endTimeStr,
        roomName
      });

      if (!courseCode || !dateStr || !startTimeStr || !endTimeStr || !roomName) {
        result.failed++;
        const missingFields = [];
        if (!courseCode) missingFields.push('courseCode');
        if (!dateStr) missingFields.push('date');
        if (!startTimeStr) missingFields.push('startTime');
        if (!endTimeStr) missingFields.push('endTime');
        if (!roomName) missingFields.push('room');
        
        // Get all column names (including empty ones) for debugging
        const allColumns = Object.keys(row);
        const availableColumns = allColumns.filter(key => row[key] && String(row[key]).trim() !== '');
        const emptyColumns = allColumns.filter(key => !row[key] || String(row[key]).trim() === '');
        
        let errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        errorMsg += `. All columns in row: ${allColumns.join(', ')}`;
        if (availableColumns.length > 0) {
          errorMsg += `. Columns with values: ${availableColumns.join(', ')}`;
        }
        if (emptyColumns.length > 0) {
          errorMsg += `. Empty columns: ${emptyColumns.join(', ')}`;
        }
        
        console.log('ERROR:', errorMsg);
        console.log('Full row object:', row);
        
        result.errors.push({
          row: i + 2, // +2 because row 1 is header
          error: errorMsg,
        });
        continue;
      }

      // Normalize data
      const date = normalizeDate(dateStr);
      const startTime = normalizeTime(startTimeStr);
      const endTime = normalizeTime(endTimeStr);

      console.log('Normalized values:', { date, startTime, endTime, originalDate: dateStr });

      // Validate normalized values
      if (!date || !startTime || !endTime) {
        result.failed++;
        const missingNormalized = [];
        if (!date) missingNormalized.push('date (after normalization)');
        if (!startTime) missingNormalized.push('startTime (after normalization)');
        if (!endTime) missingNormalized.push('endTime (after normalization)');
        
        result.errors.push({
          row: i + 2,
          error: `Normalization failed for: ${missingNormalized.join(', ')}. Original values: date="${dateStr}", startTime="${startTimeStr}", endTime="${endTimeStr}"`,
        });
        continue;
      }

      // Validate date format and create Date object to check if it's valid
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: `Incorrect DATE value: '${dateStr}' (normalized to '${date}')`,
        });
        continue;
      }

      // Verify the date string matches the Date object (catches invalid dates like 2024-13-45)
      const expectedDateStr = dateObj.toISOString().split('T')[0];
      if (date !== expectedDateStr) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: `Incorrect DATE value: '${dateStr}' (normalized to '${date}', but date is invalid)`,
        });
        continue;
      }

      const day = row.day || getDayFromDate(date);

      // Find or create class code
      let classCodeId: number;
      try {
        let classCode = await ClassCode.findOne({ where: { code: courseCode } });
        if (!classCode) {
          console.log(`Creating new ClassCode: ${courseCode}`);
          // Use the validated date string - Sequelize DATEONLY accepts YYYY-MM-DD strings
          classCode = await ClassCode.create({
            code: courseCode,
            exam_date: date as any, // Sequelize DATEONLY accepts string format YYYY-MM-DD
            start_time: startTime,
            end_time: endTime,
          });
        } else {
          console.log(`Found existing ClassCode: ${courseCode}`);
        }
        
        // Get the ID - try multiple methods for Sequelize compatibility
        classCodeId = classCode.getDataValue?.('id') || 
                     (classCode as any).get?.('id') || 
                     (classCode as any).id ||
                     (classCode.toJSON?.() as any)?.id;
        console.log(`ClassCode ID: ${classCodeId}, raw object keys:`, Object.keys(classCode));
        
        if (!classCodeId) {
          throw new Error(`ClassCode ID is undefined for code: ${courseCode}. Object: ${JSON.stringify(classCode.toJSON ? classCode.toJSON() : classCode)}`);
        }
      } catch (error: any) {
        console.error(`Error with ClassCode for row ${i + 2}:`, error);
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: `Failed to create/find ClassCode: ${error.message}`,
        });
        continue;
      }

      // Find or create room
      let roomId: number;
      try {
        let room = await Room.findOne({ where: { name: roomName } });
        if (!room) {
          console.log(`Creating new Room: ${roomName}`);
          room = await Room.create({
            name: roomName,
            capacity: 50, // Default capacity, can be updated later
          });
        } else {
          console.log(`Found existing Room: ${roomName}`);
        }
        
        // Get the ID - try multiple methods for Sequelize compatibility
        roomId = room.getDataValue?.('id') || 
                (room as any).get?.('id') || 
                (room as any).id ||
                (room.toJSON?.() as any)?.id;
        console.log(`Room ID: ${roomId}, raw object keys:`, Object.keys(room));
        
        if (!roomId) {
          throw new Error(`Room ID is undefined for name: ${roomName}. Object: ${JSON.stringify(room.toJSON ? room.toJSON() : room)}`);
        }
      } catch (error: any) {
        console.error(`Error with Room for row ${i + 2}:`, error);
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: `Failed to create/find Room: ${error.message}`,
        });
        continue;
      }

      // Create exam
      const courseName = (row.coursename || row["course name"] || row.coursetitle || courseCode).toString().trim();
      
      const examData: CreateExamData = {
        title: courseName,
        day,
        date,
        startTime,
        endTime,
        classCodeId,
        roomId,
      };

      console.log('Creating exam with data:', examData);
      const createResult = await createExam(examData);

      if (createResult.success) {
        console.log(`✓ Successfully created exam for row ${i + 2}`);
        result.success++;
      } else {
        console.log(`✗ Clash detected for row ${i + 2}:`, createResult.clashes);
        result.failed++;
        result.errors.push({
          row: i + 2,
          error: "Clash detected",
          clashes: createResult.clashes,
        });
      }
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        row: i + 2,
        error: error.message || "Unknown error",
      });
    }
  }

  return result;
}
