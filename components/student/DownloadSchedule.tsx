'use client';

import jsPDF from 'jspdf';
import { useMemo } from 'react';
import type { Exam } from '@/lib/types';

interface DownloadScheduleProps {
  allExams: Exam[];
  studentExams: Exam[];
}

/* ================= helpers ================= */

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB'); // 22/12/2025
}

function getExamLocation(exam: Exam): string | null {
  const anyExam = exam as any;
  return (
    anyExam.Room?.code ||
    anyExam.Room?.name ||
    anyExam.roomCode ||
    anyExam.room ||
    anyExam.location ||
    anyExam.hall ||
    null
  );
}

/* ================= styling ================= */

const HEADER_COLORS = {
  dayBg: [245, 247, 250] as [number, number, number],
  hourBg: [245, 245, 245] as [number, number, number],
  border: [160, 160, 160] as [number, number, number],
};

/* ================= component ================= */

export default function DownloadSchedule({
  allExams,
  studentExams,
}: DownloadScheduleProps) {
  const dates = useMemo(
    () => Array.from(new Set(allExams.map(e => e.date).filter(Boolean))).sort(),
    [allExams]
  );

  const downloadPDF = () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    });

    const MARGIN = 30;
    const HEADER_HEIGHT = 34;
    const TIME_COL = 65;
    const DAY_COL = 100;
    const HOUR_HEIGHT = 32;
    const PX_PER_MIN = HOUR_HEIGHT / 60;
    const OVERLAP_OFFSET = 12;

    /* ========== GRID BOUNDARIES ========== */
    const starts = studentExams.map(e => timeToMinutes(e.startTime!));
    const ends = studentExams.map(e => timeToMinutes(e.endTime!));

    const gridStart = Math.floor(Math.min(...starts) / 60) * 60;
    let gridEnd = Math.ceil(Math.max(...ends) / 60) * 60;

    // ✅ Ensure full-day window (12 hours minimum)
    if (gridEnd - gridStart < 720) {
      gridEnd = gridStart + 720;
    }

    /* ========== PAGING SETUP ========== */
    const HOURS_PER_PAGE = 12 * 60; // 12 hours per page
    const timeWindows: { start: number; end: number }[] = [];
    let cursor = gridStart;

    while (cursor < gridEnd) {
      timeWindows.push({
        start: cursor,
        end: Math.min(cursor + HOURS_PER_PAGE, gridEnd),
      });
      cursor += HOURS_PER_PAGE;
    }

    // 5 days per page
    const datePages: string[][] = [];
    for (let i = 0; i < dates.length; i += 5) {
      datePages.push(dates.slice(i, i + 5));
    }

    let firstPage = true;

    datePages.forEach(pageDates => {
      timeWindows.forEach(window => {
        if (!firstPage) pdf.addPage();
        firstPage = false;

        const gridHeight = (window.end - window.start) * PX_PER_MIN;
        const tableLeft = MARGIN;
        const tableTop = MARGIN + HEADER_HEIGHT;
        const tableWidth = TIME_COL + pageDates.length * DAY_COL;

        /* ===== PAGE BACKGROUND ===== */
        pdf.setFillColor(255, 255, 255);
        pdf.rect(
          0,
          0,
          pdf.internal.pageSize.getWidth(),
          pdf.internal.pageSize.getHeight(),
          'F'
        );

        /* ===== DAY HEADER ===== */
        pdf.setFillColor(
          HEADER_COLORS.dayBg[0],
          HEADER_COLORS.dayBg[1],
          HEADER_COLORS.dayBg[2]
        );
        pdf.rect(
          tableLeft + TIME_COL,
          tableTop - HEADER_HEIGHT,
          pageDates.length * DAY_COL,
          HEADER_HEIGHT,
          'F'
        );

        pdf.setDrawColor(
          HEADER_COLORS.border[0],
          HEADER_COLORS.border[1],
          HEADER_COLORS.border[2]
        );
        pdf.setLineWidth(1);
        pdf.line(tableLeft, tableTop, tableLeft + tableWidth, tableTop);

        pdf.setFontSize(9);
        pdf.setTextColor(0);

        pageDates.forEach((date, i) => {
          const x = tableLeft + TIME_COL + i * DAY_COL;
          const lines = pdf.splitTextToSize(
            `${getDayName(date)}\n${formatDate(date)}`,
            DAY_COL - 8
          );
          pdf.text(lines, x + 4, tableTop - 16);
        });

        /* ===== HOUR COLUMN ===== */
        pdf.setFillColor(
          HEADER_COLORS.hourBg[0],
          HEADER_COLORS.hourBg[1],
          HEADER_COLORS.hourBg[2]
        );
        pdf.rect(tableLeft, tableTop, TIME_COL, gridHeight, 'F');

        pdf.setDrawColor(
          HEADER_COLORS.border[0],
          HEADER_COLORS.border[1],
          HEADER_COLORS.border[2]
        );
        pdf.setLineWidth(1);
        pdf.line(
          tableLeft + TIME_COL,
          tableTop,
          tableLeft + TIME_COL,
          tableTop + gridHeight
        );

        /* ===== GRID LINES ===== */
        pdf.setDrawColor(200);
        pdf.setLineWidth(0.6);

        for (let i = 0; i <= pageDates.length; i++) {
          const x = tableLeft + TIME_COL + i * DAY_COL;
          pdf.line(x, tableTop, x, tableTop + gridHeight);
        }

        // Draw each hour line
        for (let m = window.start; m <= window.end; m += 60) {
          const y = tableTop + (m - window.start) * PX_PER_MIN;
          pdf.line(tableLeft, y, tableLeft + tableWidth, y);
          pdf.setFontSize(8);
          pdf.setTextColor(80);
          pdf.text(minutesToTime(m), tableLeft + 4, y + 10);
        }

        /* ===== EXAMS ===== */
        pageDates.forEach((date, dayIndex) => {
          const examsForDay = studentExams
            .filter(e => e.date === date)
            .sort(
              (a, b) =>
                timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!)
            );

          examsForDay.forEach((exam, idx) => {
            const s = timeToMinutes(exam.startTime!);
            const e = timeToMinutes(exam.endTime!);

            const vs = Math.max(s, window.start);
            const ve = Math.min(e, window.end);
            if (vs >= ve) return;

            const overlapIndex = examsForDay
              .slice(0, idx)
              .filter(
                prev =>
                  timeToMinutes(prev.startTime!) < e &&
                  timeToMinutes(prev.endTime!) > s
              ).length;

            const x =
              tableLeft +
              TIME_COL +
              dayIndex * DAY_COL +
              2 +
              overlapIndex * OVERLAP_OFFSET;
            const y = tableTop + (vs - window.start) * PX_PER_MIN + 2;

            const height = (ve - vs) * PX_PER_MIN - 4;
            const width = DAY_COL - 4 - overlapIndex * OVERLAP_OFFSET;

            // Base exam block
            pdf.setFillColor(225, 235, 255);
            pdf.setDrawColor(110, 130, 200);
            pdf.rect(x, y, width, height, 'FD');

            // Clash border (red)
            examsForDay.slice(0, idx).forEach(prev => {
              const ps = timeToMinutes(prev.startTime!);
              const pe = timeToMinutes(prev.endTime!);
              const os = Math.max(s, ps);
              const oe = Math.min(e, pe);
              if (os >= oe) return;

              const cs = Math.max(os, window.start);
              const ce = Math.min(oe, window.end);
              if (cs >= ce) return;

              const ry = tableTop + (cs - window.start) * PX_PER_MIN + 2;
              const rh = (ce - cs) * PX_PER_MIN - 4;

              pdf.setDrawColor(200, 50, 50);
              pdf.setLineWidth(1.5);
              pdf.rect(x, ry, width, rh);
            });

            // Exam text
            if (s >= window.start && s < window.end) {
              const lines = pdf.splitTextToSize(
                `${exam.ClassCode?.code || ''}\n${exam.startTime} – ${exam.endTime}${
                  getExamLocation(exam)
                    ? '\n' + getExamLocation(exam)
                    : ''
                }`,
                width - 6
              );
              pdf.setFontSize(8);
              pdf.setTextColor(0);
              pdf.text(lines, x + 4, y + 10);
            }
          });
        });
      });
    });

    pdf.save('exam-schedule.pdf');
  };

  return (
    <button
      onClick={downloadPDF}
      className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
    >
      Download Exam Schedule
    </button>
  );
}
