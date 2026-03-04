/**
 * PDF Export Service
 * jspdf + jspdf-autotable kullanarak PDF raporları oluşturma
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * PDF rapor tipi enum
 */
export const ReportType = {
  PRODUCTIVITY: 'productivity',
  PROJECT: 'project',
  TIME_DISTRIBUTION: 'timeDistribution',
  FULL_REPORT: 'fullReport'
};

/**
 * Renk şeması
 */
const COLORS = {
  primary: [255, 59, 59],      // Kırmızı
  secondary: [59, 130, 246],   // Mavi
  success: [16, 185, 129],     // Yeşil
  warning: [245, 158, 11],     // Turuncu
  purple: [139, 92, 246],      // Mor
  dark: [31, 41, 55],          // Koyu gri
  light: [243, 244, 246],      // Açık gri
  white: [255, 255, 255]
};

/**
 * PDF başlık ekle
 * @param {jsPDF} doc - PDF dokümanı
 * @param {string} title - Rapor başlığı
 * @param {string} subtitle - Alt başlık
 */
const addHeader = (doc, title, subtitle = '') => {
  // Başlık arka planı
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Logo/Başlık
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PODOMODRO', 14, 20);
  
  // Rapor başlığı
  doc.setFontSize(16);
  doc.text(title, 14, 32);
  
  // Alt başlık
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 38);
  }
  
  // Tarih
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('tr-TR')}`, 160, 20);
};

/**
 * PDF alt bilgi ekle
 * @param {jsPDF} doc - PDF dokümanı
 * @param {number} pageNumber - Sayfa numarası
 */
const addFooter = (doc, pageNumber) => {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFillColor(...COLORS.light);
  doc.rect(0, pageHeight - 20, 210, 20, 'F');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Podomodro - Focus Timer & Productivity Tracker', 14, pageHeight - 10);
  doc.text(`Page ${pageNumber}`, 180, pageHeight - 10);
};

/**
 * İstatistik kartları ekle
 * @param {jsPDF} doc - PDF dokümanı
 * @param {Array} stats - İstatistikler
 * @param {number} startY - Başlangıç Y pozisyonu
 */
const addStatCards = (doc, stats, startY) => {
  const cardWidth = 45;
  const cardHeight = 25;
  const gap = 5;
  let x = 14;
  
  stats.forEach((stat, index) => {
    // Kart arka planı
    doc.setFillColor(...(stat.color || COLORS.light));
    doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'F');
    
    // Değer
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(stat.value), x + 5, startY + 12);
    
    // Etiket
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, x + 5, startY + 20);
    
    x += cardWidth + gap;
  });
  
  return startY + cardHeight + 10;
};

/**
 * Verimlilik raporu oluştur
 * @param {Object} data - Rapor verileri
 * @returns {jsPDF} PDF dokümanı
 */
export const generateProductivityReport = (data) => {
  const { sessions, stats, dateRange } = data;
  const doc = new jsPDF();
  
  const subtitle = dateRange ? `${dateRange.start} - ${dateRange.end}` : 'All Time';
  addHeader(doc, 'Productivity Report', subtitle);
  
  // İstatistik kartları
  const statCards = [
    { value: stats.totalSessions || 0, label: 'Total Sessions', color: COLORS.primary },
    { value: ((stats.totalFocusTime || 0) / 60).toFixed(1), label: 'Hours Focused', color: COLORS.secondary },
    { value: stats.currentStreak || 0, label: 'Day Streak', color: COLORS.success },
    { value: stats.averageDaily || 0, label: 'Avg/Day', color: COLORS.warning }
  ];
  
  let yPos = addStatCards(doc, statCards, 50);
  
  // Günlük aktivite tablosu
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Daily Activity', 14, yPos);
  yPos += 10;
  
  const dailyData = calculateDailyStats(sessions);
  
  doc.autoTable({
    startY: yPos,
    head: [['Date', 'Weekday', 'Sessions', 'Focus Time (min)', 'Projects']],
    body: dailyData.map(d => [
      d.date,
      d.weekday,
      d.sessions,
      d.totalTime,
      d.projects.join(', ')
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: COLORS.light
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Haftalık özet
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Summary', 14, yPos);
  yPos += 10;
  
  const weeklyData = calculateWeeklyStats(sessions);
  
  doc.autoTable({
    startY: yPos,
    head: [['Week', 'Total Sessions', 'Total Hours', 'Avg/Day']],
    body: weeklyData.map(w => [
      w.week,
      w.sessions,
      w.hours.toFixed(1),
      w.avgPerDay.toFixed(1)
    ]),
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: COLORS.white
    }
  });
  
  addFooter(doc, 1);
  
  return doc;
};

/**
 * Proje raporu oluştur
 * @param {Object} data - Rapor verileri
 * @returns {jsPDF} PDF dokümanı
 */
export const generateProjectReport = (data) => {
  const { sessions, projects, dateRange } = data;
  const doc = new jsPDF();
  
  const subtitle = dateRange ? `${dateRange.start} - ${dateRange.end}` : 'All Time';
  addHeader(doc, 'Project Report', subtitle);
  
  // Proje istatistikleri
  const projectStats = calculateProjectStats(sessions, projects);
  
  let yPos = 50;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Project Breakdown', 14, yPos);
  yPos += 10;
  
  doc.autoTable({
    startY: yPos,
    head: [['Project', 'Sessions', 'Total Time (h)', 'Percentage', 'Last Active']],
    body: projectStats.map(p => [
      p.name,
      p.sessions,
      p.hours.toFixed(1),
      p.percentage + '%',
      p.lastActive
    ]),
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: COLORS.white
    },
    bodyStyles: {
      fontSize: 9
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Proje dağılım grafiği (basit bar chart)
  if (yPos < 200 && projectStats.length > 0) {
    doc.setFontSize(12);
    doc.text('Time Distribution by Project', 14, yPos);
    yPos += 10;
    
    const maxHours = Math.max(...projectStats.map(p => p.hours));
    const barMaxWidth = 100;
    
    projectStats.forEach((project, index) => {
      const barWidth = (project.hours / maxHours) * barMaxWidth;
      
      // Bar
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(50, yPos - 4, barWidth, 8, 2, 2, 'F');
      
      // Label
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);
      doc.text(project.name.substring(0, 20), 14, yPos);
      
      // Value
      doc.text(`${project.hours.toFixed(1)}h`, 50 + barWidth + 5, yPos);
      
      yPos += 12;
    });
  }
  
  addFooter(doc, 1);
  
  return doc;
};

/**
 * Zaman dağılım raporu oluştur
 * @param {Object} data - Rapor verileri
 * @returns {jsPDF} PDF dokümanı
 */
export const generateTimeDistributionReport = (data) => {
  const { sessions, dateRange } = data;
  const doc = new jsPDF();
  
  const subtitle = dateRange ? `${dateRange.start} - ${dateRange.end}` : 'All Time';
  addHeader(doc, 'Time Distribution Report', subtitle);
  
  let yPos = 50;
  
  // Saat bazlı dağılım
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Activity by Hour of Day', 14, yPos);
  yPos += 10;
  
  const hourlyStats = calculateHourlyStats(sessions);
  
  doc.autoTable({
    startY: yPos,
    head: [['Hour', 'Sessions', 'Percentage', 'Intensity']],
    body: hourlyStats.map(h => [
      h.hour,
      h.sessions,
      h.percentage + '%',
      '█'.repeat(Math.ceil(h.percentage / 10))
    ]),
    headStyles: {
      fillColor: COLORS.purple,
      textColor: COLORS.white
    },
    columnStyles: {
      3: { font: 'courier' }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Gün bazlı dağılım
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.text('Activity by Day of Week', 14, yPos);
  yPos += 10;
  
  const weekdayStats = calculateWeekdayStats(sessions);
  
  doc.autoTable({
    startY: yPos,
    head: [['Day', 'Sessions', 'Total Time (h)', 'Percentage']],
    body: weekdayStats.map(w => [
      w.day,
      w.sessions,
      w.hours.toFixed(1),
      w.percentage + '%'
    ]),
    headStyles: {
      fillColor: COLORS.success,
      textColor: COLORS.white
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Aylık dağılım
  if (yPos < 200) {
    doc.setFontSize(12);
    doc.text('Monthly Overview', 14, yPos);
    yPos += 10;
    
    const monthlyStats = calculateMonthlyStats(sessions);
    
    doc.autoTable({
      startY: yPos,
      head: [['Month', 'Sessions', 'Total Hours', 'Avg/Day']],
      body: monthlyStats.map(m => [
        m.month,
        m.sessions,
        m.hours.toFixed(1),
        m.avgPerDay.toFixed(1)
      ]),
      headStyles: {
        fillColor: COLORS.warning,
        textColor: COLORS.white
      }
    });
  }
  
  addFooter(doc, 1);
  
  return doc;
};

/**
 * Tam kapsamlı rapor oluştur
 * @param {Object} data - Rapor verileri
 * @returns {jsPDF} PDF dokümanı
 */
export const generateFullReport = (data) => {
  const { sessions, projects, tasks, stats, dateRange } = data;
  const doc = new jsPDF();
  
  const subtitle = dateRange ? `${dateRange.start} - ${dateRange.end}` : 'All Time';
  addHeader(doc, 'Complete Productivity Report', subtitle);
  
  // Sayfa 1: Özet
  const statCards = [
    { value: stats.totalSessions || 0, label: 'Sessions', color: COLORS.primary },
    { value: ((stats.totalFocusTime || 0) / 60).toFixed(1), label: 'Hours', color: COLORS.secondary },
    { value: stats.currentStreak || 0, label: 'Streak', color: COLORS.success },
    { value: projects?.length || 0, label: 'Projects', color: COLORS.warning }
  ];
  
  let yPos = addStatCards(doc, statCards, 50);
  
  // Son aktiviteler
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Recent Sessions', 14, yPos);
  yPos += 10;
  
  const recentSessions = sessions
    .slice(-20)
    .reverse()
    .map(s => ({
      date: new Date(s.date || s.created_at).toLocaleDateString('tr-TR'),
      project: projects?.find(p => p.id === (s.project_id || s.projectId))?.name || 'Unknown',
      task: s.task_name || '-',
      duration: (s.duration || 25) + ' min'
    }));
  
  doc.autoTable({
    startY: yPos,
    head: [['Date', 'Project', 'Task', 'Duration']],
    body: recentSessions.map(s => [s.date, s.project, s.task, s.duration]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white
    }
  });
  
  // Sayfa 2: Proje detayları
  doc.addPage();
  addHeader(doc, 'Project Details', subtitle);
  
  const projectStats = calculateProjectStats(sessions, projects);
  
  doc.autoTable({
    startY: 50,
    head: [['Project', 'Sessions', 'Hours', 'Percentage']],
    body: projectStats.map(p => [
      p.name,
      p.sessions,
      p.hours.toFixed(1),
      p.percentage + '%'
    ]),
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: COLORS.white
    }
  });
  
  // Sayfa 3: Zaman analizi
  doc.addPage();
  addHeader(doc, 'Time Analysis', subtitle);
  
  const hourlyStats = calculateHourlyStats(sessions);
  
  doc.autoTable({
    startY: 50,
    head: [['Hour', 'Sessions', 'Percentage']],
    body: hourlyStats.slice(0, 12).map(h => [
      h.hour,
      h.sessions,
      h.percentage + '%'
    ]),
    headStyles: {
      fillColor: COLORS.purple,
      textColor: COLORS.white
    }
  });
  
  addFooter(doc, 3);
  
  return doc;
};

/**
 * PDF indir
 * @param {jsPDF} doc - PDF dokümanı
 * @param {string} filename - Dosya adı
 */
export const downloadPDF = (doc, filename = 'podomodro-report.pdf') => {
  doc.save(filename);
};

/**
 * Rapor oluştur ve indir (tek fonksiyon)
 * @param {string} reportType - Rapor tipi
 * @param {Object} data - Rapor verileri
 * @param {string} filename - Dosya adı
 */
export const generateAndDownloadReport = (reportType, data, filename) => {
  let doc;
  
  switch (reportType) {
    case ReportType.PRODUCTIVITY:
      doc = generateProductivityReport(data);
      break;
    case ReportType.PROJECT:
      doc = generateProjectReport(data);
      break;
    case ReportType.TIME_DISTRIBUTION:
      doc = generateTimeDistributionReport(data);
      break;
    case ReportType.FULL_REPORT:
      doc = generateFullReport(data);
      break;
    default:
      doc = generateProductivityReport(data);
  }
  
  const defaultFilename = `podomodro-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
  downloadPDF(doc, filename || defaultFilename);
};

// Yardımcı fonksiyonlar

const calculateDailyStats = (sessions) => {
  const daily = {};
  
  sessions.forEach(s => {
    const date = new Date(s.date || s.created_at);
    const key = date.toISOString().split('T')[0];
    
    if (!daily[key]) {
      daily[key] = {
        date: date.toLocaleDateString('tr-TR'),
        weekday: date.toLocaleDateString('tr-TR', { weekday: 'long' }),
        sessions: 0,
        totalTime: 0,
        projects: new Set()
      };
    }
    
    daily[key].sessions += 1;
    daily[key].totalTime += (s.duration || 25);
    daily[key].projects.add(s.project_id || s.projectId);
  });
  
  return Object.values(daily)
    .map(d => ({ ...d, projects: Array.from(d.projects) }))
    .reverse();
};

const calculateWeeklyStats = (sessions) => {
  const weekly = {};
  
  sessions.forEach(s => {
    const date = new Date(s.date || s.created_at);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    
    if (!weekly[weekKey]) {
      weekly[weekKey] = {
        week: weekKey,
        sessions: 0,
        hours: 0,
        days: new Set()
      };
    }
    
    weekly[weekKey].sessions += 1;
    weekly[weekKey].hours += (s.duration || 25) / 60;
    weekly[weekKey].days.add(date.toDateString());
  });
  
  return Object.values(weekly).map(w => ({
    ...w,
    avgPerDay: w.hours / Math.max(w.days.size, 1)
  }));
};

const calculateProjectStats = (sessions, projects) => {
  const stats = {};
  let totalHours = 0;
  
  sessions.forEach(s => {
    const projectId = s.project_id || s.projectId;
    const project = projects?.find(p => p.id === projectId);
    const name = project?.name || s.project_name || 'Unknown';
    
    if (!stats[name]) {
      stats[name] = {
        name,
        sessions: 0,
        hours: 0,
        lastActive: null
      };
    }
    
    stats[name].sessions += 1;
    stats[name].hours += (s.duration || 25) / 60;
    totalHours += (s.duration || 25) / 60;
    
    const date = new Date(s.date || s.created_at);
    if (!stats[name].lastActive || date > new Date(stats[name].lastActive)) {
      stats[name].lastActive = date.toLocaleDateString('tr-TR');
    }
  });
  
  return Object.values(stats)
    .map(s => ({
      ...s,
      percentage: totalHours > 0 ? ((s.hours / totalHours) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.hours - a.hours);
};

const calculateHourlyStats = (sessions) => {
  const hourly = {};
  
  for (let i = 0; i < 24; i++) {
    hourly[i] = { hour: `${i.toString().padStart(2, '0')}:00`, sessions: 0 };
  }
  
  sessions.forEach(s => {
    const hour = new Date(s.date || s.created_at).getHours();
    hourly[hour].sessions += 1;
  });
  
  const maxSessions = Math.max(...Object.values(hourly).map(h => h.sessions));
  
  return Object.values(hourly).map(h => ({
    ...h,
    percentage: maxSessions > 0 ? ((h.sessions / maxSessions) * 100).toFixed(0) : 0
  }));
};

const calculateWeekdayStats = (sessions) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = {};
  
  days.forEach(day => {
    weekday[day] = { day, sessions: 0, hours: 0 };
  });
  
  let totalSessions = 0;
  
  sessions.forEach(s => {
    const day = days[new Date(s.date || s.created_at).getDay()];
    weekday[day].sessions += 1;
    weekday[day].hours += (s.duration || 25) / 60;
    totalSessions += 1;
  });
  
  return Object.values(weekday).map(w => ({
    ...w,
    percentage: totalSessions > 0 ? ((w.sessions / totalSessions) * 100).toFixed(1) : 0
  }));
};

const calculateMonthlyStats = (sessions) => {
  const monthly = {};
  
  sessions.forEach(s => {
    const date = new Date(s.date || s.created_at);
    const key = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    
    if (!monthly[key]) {
      monthly[key] = {
        month: key,
        sessions: 0,
        hours: 0,
        days: new Set()
      };
    }
    
    monthly[key].sessions += 1;
    monthly[key].hours += (s.duration || 25) / 60;
    monthly[key].days.add(date.toDateString());
  });
  
  return Object.values(monthly).map(m => ({
    ...m,
    avgPerDay: m.hours / Math.max(m.days.size, 1)
  }));
};

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export default {
  ReportType,
  generateProductivityReport,
  generateProjectReport,
  generateTimeDistributionReport,
  generateFullReport,
  downloadPDF,
  generateAndDownloadReport
};
