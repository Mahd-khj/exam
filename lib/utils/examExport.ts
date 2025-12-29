import jsPDF from 'jspdf';
import type { Exam } from '@/lib/types';
import { getCourseColor, hslToRgb } from './colors';
import { detectStudentTimetableClashes } from './clashDetection';
import {
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  calculateGridStructure,
  getDayName,
  formatDate,
  PIXELS_PER_MINUTE,
  COL_WIDTH,
  TIME_COL_WIDTH,
} from './gridMath';

/**
 * Export format types
 */
export type ExportFormat = 'pdf' | 'png' | 'jpg';

const MARGIN_TOP = 50;
const MARGIN_LEFT = 14;
const GRID_START_Y = MARGIN_TOP + 30;

/**
 * Detect conflicts in selected exams
 */
function detectConflicts(selectedExams: Exam[]): {
  conflictedExamIds: Set<number>;
  uniqueClashes: Array<{ exam: Exam; conflictingExam: Exam }>;
} {
  const timetableEntries = selectedExams.map(exam => ({
    ...exam,
    courseCode: exam.ClassCode?.code || exam.courseCode
  }));

  const allClashes: Array<{ exam: Exam; conflictingExam: Exam }> = [];
  for (let i = 0; i < timetableEntries.length; i++) {
    const currentExam = timetableEntries[i];
    const otherExams = timetableEntries.filter((_, index) => index !== i);
    const clashes = detectStudentTimetableClashes(currentExam, otherExams);
    clashes.forEach(clash => {
      allClashes.push({
        exam: clash.newClass as Exam,
        conflictingExam: clash.conflictingClass as Exam
      });
    });
  }
  
  // Remove duplicate clashes (A-B is same as B-A)
  const uniqueClashes = allClashes.filter((clash, index, self) => {
    return index === self.findIndex(c => 
      (c.exam.id === clash.exam.id && c.conflictingExam.id === clash.conflictingExam.id) ||
      (c.exam.id === clash.conflictingExam.id && c.conflictingExam.id === clash.exam.id)
    );
  });

  // Build set of exam IDs that have conflicts
  const conflictedExamIds = new Set<number>();
  uniqueClashes.forEach(clash => {
    conflictedExamIds.add(clash.exam.id);
    conflictedExamIds.add(clash.conflictingExam.id);
  });

  return { conflictedExamIds, uniqueClashes };
}

function calculatePDFGridLayout(
  selectedExams: Exam[],
  allExams: Exam[]
): {
  gridStartMinutes: number;
  gridEndMinutes: number;
  gridHeight: number;
  sortedDates: string[];
  gridStartY: number;
  headerHeight: number;
  totalWidth: number;
} {
  const { gridStartMinutes, gridEndMinutes, gridHeight, sortedDates } = calculateGridStructure(selectedExams, allExams);
  const gridWidth = sortedDates.length * COL_WIDTH;
  const totalWidth = TIME_COL_WIDTH + gridWidth;
  const headerHeight = 25;
  const { uniqueClashes } = detectConflicts(selectedExams);
  let gridStartY = GRID_START_Y;
  if (uniqueClashes.length > 0) {
    gridStartY = GRID_START_Y + 15;
  }
  return {
    gridStartMinutes,
    gridEndMinutes,
    gridHeight,
    sortedDates,
    gridStartY,
    headerHeight,
    totalWidth,
  };
}

/**
 * Generate PDF blob with accurate pixel-based positioning
 */
export function generateExamPDFBlob(
  selectedExams: Exam[], 
  allExams: Exam[]
): Blob {
  const doc = new jsPDF('landscape');
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('Custom Exam Timetable', MARGIN_LEFT, 20);

  // Date generated
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, MARGIN_LEFT, 30);

  if (allExams.length === 0 || selectedExams.length === 0) {
    doc.setFontSize(12);
    doc.text('No exams to display', MARGIN_LEFT, 50);
    return doc.output('blob');
  }

  // Detect conflicts
  const { conflictedExamIds, uniqueClashes } = detectConflicts(selectedExams);

  // Calculate grid structure
  const {
    gridStartMinutes,
    gridEndMinutes,
    gridHeight,
    sortedDates,
    gridStartY,
    headerHeight,
    totalWidth,
  } = calculatePDFGridLayout(selectedExams, allExams);

  // Draw conflict banner if there are conflicts
  if (uniqueClashes.length > 0) {
    doc.setFillColor(220, 53, 69); // Red background
    doc.roundedRect(MARGIN_LEFT, 40, doc.internal.pageSize.getWidth() - 2 * MARGIN_LEFT, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`⚠️ Schedule Conflict Detected (${uniqueClashes.length} conflict${uniqueClashes.length > 1 ? 's' : ''})`, MARGIN_LEFT + 5, 50);
  }

  // Draw time column background (includes header area)
  doc.setFillColor(248, 249, 250); // Light gray
  doc.rect(MARGIN_LEFT, gridStartY, TIME_COL_WIDTH, headerHeight + gridHeight, 'F');
  
  // Draw time column header
  doc.setFillColor(66, 139, 202); // Blue header
  doc.rect(MARGIN_LEFT, gridStartY, TIME_COL_WIDTH, headerHeight, 'F');
  
  // Time header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Time', MARGIN_LEFT + TIME_COL_WIDTH / 2, gridStartY + 12, { align: 'center' });
  
  // Draw time column border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN_LEFT, gridStartY, TIME_COL_WIDTH, headerHeight + gridHeight, 'S');

  // Draw day column headers
  doc.setFillColor(66, 139, 202); // Blue header
  sortedDates.forEach((date, dateIndex) => {
    const left = MARGIN_LEFT + TIME_COL_WIDTH + dateIndex * COL_WIDTH;
    doc.rect(left, gridStartY, COL_WIDTH, headerHeight, 'F');
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(getDayName(date), left + COL_WIDTH / 2, gridStartY + 8, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(date), left + COL_WIDTH / 2, gridStartY + 16, { align: 'center' });
  });

  // Draw time labels and horizontal grid lines
  const timeSlots = generateTimeSlots(minutesToTime(gridStartMinutes), minutesToTime(gridEndMinutes));
  timeSlots.forEach((timeSlot, index) => {
    const slotMinutes = timeToMinutes(timeSlot);
    const y = gridStartY + headerHeight + (slotMinutes - gridStartMinutes) * PIXELS_PER_MINUTE;
    
    // Draw horizontal grid line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_LEFT, y, MARGIN_LEFT + totalWidth, y);
    
    // Draw time label
    if (index < timeSlots.length - 1) {
      const nextSlotMinutes = timeToMinutes(timeSlots[index + 1]);
      const labelY = y + (nextSlotMinutes - slotMinutes) * PIXELS_PER_MINUTE / 2;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(`${timeSlot} - ${timeSlots[index + 1]}`, MARGIN_LEFT + TIME_COL_WIDTH / 2, labelY, { align: 'center' });
    }
  });

  // Draw vertical grid lines for day columns
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  sortedDates.forEach((_, dateIndex) => {
    const x = MARGIN_LEFT + TIME_COL_WIDTH + dateIndex * COL_WIDTH;
    doc.line(x, gridStartY, x, gridStartY + headerHeight + gridHeight);
  });
  
  // Draw vertical line after time column
  doc.line(MARGIN_LEFT + TIME_COL_WIDTH, gridStartY, MARGIN_LEFT + TIME_COL_WIDTH, gridStartY + headerHeight + gridHeight);
  
  // Draw outer border
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.rect(MARGIN_LEFT, gridStartY, totalWidth, headerHeight + gridHeight, 'S');

  // Group exams by date for positioning
  const examsByDate: Record<string, Exam[]> = {};
  selectedExams.forEach(exam => {
    if (!exam.date) return;
    if (!examsByDate[exam.date]) {
      examsByDate[exam.date] = [];
    }
    examsByDate[exam.date].push(exam);
  });

  // Render exam blocks using absolute positioning
  sortedDates.forEach((date, dateIndex) => {
    const examsForDate = examsByDate[date] || [];
    
    // Sort exams by start time for consistent rendering
    const sortedExams = [...examsForDate].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    sortedExams.forEach(exam => {
      const examStartMinutes = timeToMinutes(exam.startTime);
      const examEndMinutes = timeToMinutes(exam.endTime);
      
      // Calculate position using same formula - gridStartMinutes is the single source of truth
      const top = gridStartY + headerHeight + (examStartMinutes - gridStartMinutes) * PIXELS_PER_MINUTE;
      const height = (examEndMinutes - examStartMinutes) * PIXELS_PER_MINUTE;
      const left = MARGIN_LEFT + TIME_COL_WIDTH + dateIndex * COL_WIDTH;
      const width = COL_WIDTH;

      // Get course color
      const courseCode = exam.ClassCode?.code || exam.courseCode || 'N/A';
      const hslColor = getCourseColor(exam.classCodeId || courseCode);
      const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      
      let fillColor = [100, 100, 100]; // Default gray
      if (hslMatch) {
        fillColor = hslToRgb(
          parseInt(hslMatch[1]),
          parseInt(hslMatch[2]),
          parseInt(hslMatch[3])
        );
      }

      // Draw exam block rectangle
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.roundedRect(left, top, width, height, 2, 2, 'F');

      // Draw conflict border if this exam has conflicts
      if (conflictedExamIds.has(exam.id)) {
        doc.setDrawColor(220, 53, 69); // Red
        doc.setLineWidth(2);
        doc.roundedRect(left, top, width, height, 2, 2, 'S');
      }

      // Draw exam text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      
      // Course code
      const textX = left + 3;
      let textY = top + 6;
      doc.text(courseCode, textX, textY, { maxWidth: width - 6 });
      
      // Title (if exists)
      if (exam.title) {
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        textY += 5;
        doc.text(exam.title, textX, textY, { maxWidth: width - 6 });
      }
      
      // Time
      doc.setFontSize(7);
      textY += 4;
      doc.text(`${exam.startTime} - ${exam.endTime}`, textX, textY, { maxWidth: width - 6 });
      
      // Room
      if (exam.Room) {
        textY += 4;
        doc.text(`Room: ${exam.Room.name}`, textX, textY, { maxWidth: width - 6 });
      }
      
      // Conflict indicator on block
      if (conflictedExamIds.has(exam.id)) {
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        textY += 5;
        doc.text('⚠️ Conflict', textX, textY, { maxWidth: width - 6 });
      }
    });
  });

  return doc.output('blob');
}

/**
 * Generate image blob (PNG or JPG) using canvas
 * Uses the same rendering logic as PDF but outputs to canvas
 */
export async function generateExamImageBlob(
  selectedExams: Exam[],
  allExams: Exam[],
  format: 'png' | 'jpg' = 'png'
): Promise<Blob> {
  if (allExams.length === 0 || selectedExams.length === 0) {
    throw new Error('No exams to display');
  }

  // Calculate grid structure
  const {
    gridStartMinutes,
    gridEndMinutes,
    gridHeight,
    sortedDates,
    gridStartY,
    headerHeight,
    totalWidth,
  } = calculatePDFGridLayout(selectedExams, allExams);

  // Detect conflicts
  const { conflictedExamIds, uniqueClashes } = detectConflicts(selectedExams);

  // Calculate canvas dimensions (landscape, match PDF dimensions in pixels)
  // PDF uses points (72 DPI), but we'll use higher resolution for images
  const scale = 2; // 2x for retina/high quality
  const pdfWidth = 842; // A4 landscape width in points
  const pdfHeight = 595; // A4 landscape height in points
  const canvasWidth = pdfWidth * scale;
  const canvasHeight = pdfHeight * scale;
  const scaleFactor = scale;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set up scaling
  ctx.scale(scaleFactor, scaleFactor);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pdfWidth, pdfHeight);

  // Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('Custom Exam Timetable', MARGIN_LEFT, 20);

  // Date generated
  ctx.fillStyle = '#646464';
  ctx.font = '10px Arial';
  ctx.fillText(`Generated on: ${new Date().toLocaleDateString()}`, MARGIN_LEFT, 30);

  // Draw conflict banner if there are conflicts
  if (uniqueClashes.length > 0) {
    ctx.fillStyle = '#dc3545';
    roundRect(ctx, MARGIN_LEFT, 40, pdfWidth - 2 * MARGIN_LEFT, 15, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`⚠️ Schedule Conflict Detected (${uniqueClashes.length} conflict${uniqueClashes.length > 1 ? 's' : ''})`, MARGIN_LEFT + 5, 50);
  }

  // Draw time column background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(MARGIN_LEFT, gridStartY, TIME_COL_WIDTH, headerHeight + gridHeight);
  
  // Draw time column header
  ctx.fillStyle = '#428bca';
  ctx.fillRect(MARGIN_LEFT, gridStartY, TIME_COL_WIDTH, headerHeight);
  
  // Time header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Time', MARGIN_LEFT + TIME_COL_WIDTH / 2, gridStartY + 12);
  ctx.textAlign = 'left';
  
  // Draw time column border
  ctx.strokeStyle = '#c8c8c8';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(MARGIN_LEFT, gridStartY, TIME_COL_WIDTH, headerHeight + gridHeight);

  // Draw day column headers
  ctx.fillStyle = '#428bca';
  sortedDates.forEach((date, dateIndex) => {
    const left = MARGIN_LEFT + TIME_COL_WIDTH + dateIndex * COL_WIDTH;
    ctx.fillRect(left, gridStartY, COL_WIDTH, headerHeight);
    
    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(getDayName(date), left + COL_WIDTH / 2, gridStartY + 8);
    ctx.font = '8px Arial';
    ctx.fillText(formatDate(date), left + COL_WIDTH / 2, gridStartY + 16);
    ctx.textAlign = 'left';
  });

  // Draw time labels and horizontal grid lines
  const timeSlots = generateTimeSlots(minutesToTime(gridStartMinutes), minutesToTime(gridEndMinutes));
  ctx.strokeStyle = '#dcdcdc';
  ctx.lineWidth = 0.3;
  timeSlots.forEach((timeSlot, index) => {
    const slotMinutes = timeToMinutes(timeSlot);
    const y = gridStartY + headerHeight + (slotMinutes - gridStartMinutes) * PIXELS_PER_MINUTE;
    
    // Draw horizontal grid line
    ctx.beginPath();
    ctx.moveTo(MARGIN_LEFT, y);
    ctx.lineTo(MARGIN_LEFT + totalWidth, y);
    ctx.stroke();
    
    // Draw time label
    if (index < timeSlots.length - 1) {
      const nextSlotMinutes = timeToMinutes(timeSlots[index + 1]);
      const labelY = gridStartY + headerHeight + (slotMinutes - gridStartMinutes) * PIXELS_PER_MINUTE + (nextSlotMinutes - slotMinutes) * PIXELS_PER_MINUTE / 2;
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${timeSlot} - ${timeSlots[index + 1]}`, MARGIN_LEFT + TIME_COL_WIDTH / 2, labelY);
      ctx.textAlign = 'left';
    }
  });

  // Draw vertical grid lines
  ctx.strokeStyle = '#dcdcdc';
  ctx.lineWidth = 0.3;
  sortedDates.forEach((_, dateIndex) => {
    const x = MARGIN_LEFT + TIME_COL_WIDTH + dateIndex * COL_WIDTH;
    ctx.beginPath();
    ctx.moveTo(x, gridStartY);
    ctx.lineTo(x, gridStartY + headerHeight + gridHeight);
    ctx.stroke();
  });
  
  // Draw vertical line after time column
  ctx.beginPath();
  ctx.moveTo(MARGIN_LEFT + TIME_COL_WIDTH, gridStartY);
  ctx.lineTo(MARGIN_LEFT + TIME_COL_WIDTH, gridStartY + headerHeight + gridHeight);
  ctx.stroke();
  
  // Draw outer border
  ctx.strokeStyle = '#969696';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(MARGIN_LEFT, gridStartY, totalWidth, headerHeight + gridHeight);

  // Group exams by date
  const examsByDate: Record<string, Exam[]> = {};
  selectedExams.forEach(exam => {
    if (!exam.date) return;
    if (!examsByDate[exam.date]) {
      examsByDate[exam.date] = [];
    }
    examsByDate[exam.date].push(exam);
  });

  // Render exam blocks
  sortedDates.forEach((date, dateIndex) => {
    const examsForDate = examsByDate[date] || [];
    const sortedExams = [...examsForDate].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    sortedExams.forEach(exam => {
      const examStartMinutes = timeToMinutes(exam.startTime);
      const examEndMinutes = timeToMinutes(exam.endTime);
      
      const top = gridStartY + headerHeight + (examStartMinutes - gridStartMinutes) * PIXELS_PER_MINUTE;
      const height = (examEndMinutes - examStartMinutes) * PIXELS_PER_MINUTE;
      const left = MARGIN_LEFT + TIME_COL_WIDTH + dateIndex * COL_WIDTH;
      const width = COL_WIDTH;

      // Get course color
      const courseCode = exam.ClassCode?.code || exam.courseCode || 'N/A';
      const hslColor = getCourseColor(exam.classCodeId || courseCode);
      const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      
      let fillColor = [100, 100, 100];
      if (hslMatch) {
        fillColor = hslToRgb(
          parseInt(hslMatch[1]),
          parseInt(hslMatch[2]),
          parseInt(hslMatch[3])
        );
      }

      // Draw exam block
      ctx.fillStyle = `rgb(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]})`;
      roundRect(ctx, left, top, width, height, 2);
      ctx.fill();

      // Draw conflict border
      if (conflictedExamIds.has(exam.id)) {
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 2;
        roundRect(ctx, left, top, width, height, 2);
        ctx.stroke();
      }

      // Draw exam text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'left';
      
      let textY = top + 6;
      ctx.fillText(courseCode, left + 3, textY);
      
      if (exam.title) {
        ctx.font = '7px Arial';
        textY += 5;
        ctx.fillText(exam.title, left + 3, textY);
      }
      
      ctx.font = '7px Arial';
      textY += 4;
      ctx.fillText(`${exam.startTime} - ${exam.endTime}`, left + 3, textY);
      
      if (exam.Room) {
        textY += 4;
        ctx.fillText(`Room: ${exam.Room.name}`, left + 3, textY);
      }
      
      if (conflictedExamIds.has(exam.id)) {
        ctx.font = 'bold 7px Arial';
        textY += 5;
        ctx.fillText('⚠️ Conflict', left + 3, textY);
      }
    });
  });

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
  });
}

/**
 * Helper to draw rounded rectangles on canvas
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Download blob with filename
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

