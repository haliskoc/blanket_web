/**
 * CSV Export Service
 * Pomodoro verilerini CSV formatına dönüştürme ve indirme
 */

import Papa from 'papaparse';

/**
 * Tarih aralığına göre filtreleme
 * @param {Array} sessions - Pomodoro session verileri
 * @param {string} filterType - 'daily' | 'weekly' | 'monthly' | 'custom'
 * @param {Date} startDate - Başlangıç tarihi (custom için)
 * @param {Date} endDate - Bitiş tarihi (custom için)
 * @returns {Array} Filtrelenmiş sessionlar
 */
export const filterSessionsByDate = (sessions, filterType = 'daily', startDate = null, endDate = null) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return sessions.filter(session => {
    const sessionDate = new Date(session.date || session.created_at);
    
    switch (filterType) {
      case 'daily':
        return sessionDate.toDateString() === today.toDateString();
        
      case 'weekly': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo && sessionDate <= now;
      }
        
      case 'monthly': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return sessionDate >= monthAgo && sessionDate <= now;
      }
        
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return sessionDate >= start && sessionDate <= end;
        }
        return true;
        
      default:
        return true;
    }
  });
};

/**
 * Session verilerini CSV formatına dönüştür
 * @param {Array} sessions - Pomodoro session verileri
 * @param {Array} projects - Proje listesi
 * @param {Array} tasks - Task listesi
 * @returns {string} CSV içeriği
 */
export const convertToCSV = (sessions, projects = [], tasks = []) => {
  if (!sessions || sessions.length === 0) {
    return '';
  }

  const enrichedData = sessions.map(session => {
    const project = projects.find(p => p.id === session.project_id || p.id === session.projectId);
    const task = tasks.find(t => t.id === session.task_id || t.id === session.taskId);
    
    const date = new Date(session.date || session.created_at || session.start_time);
    
    return {
      'Date': date.toLocaleDateString('tr-TR'),
      'Time': date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      'Project': project?.name || session.project_name || 'Unknown',
      'Task': task?.text || session.task_name || '-',
      'Duration (min)': session.duration || 25,
      'Type': session.type || 'focus',
      'Notes': session.notes || '',
      'Completed': session.completed ? 'Yes' : 'No',
      'Weekday': date.toLocaleDateString('tr-TR', { weekday: 'long' }),
      'Week': getWeekNumber(date),
      'Month': date.toLocaleDateString('tr-TR', { month: 'long' }),
      'Year': date.getFullYear()
    };
  });

  return Papa.unparse(enrichedData, {
    delimiter: ',',
    header: true,
    newline: '\n',
    quotes: true
  });
};

/**
 * Özet istatistikleri CSV'ye dönüştür
 * @param {Object} stats - İstatistik verileri
 * @returns {string} CSV içeriği
 */
export const convertStatsToCSV = (stats) => {
  const summaryData = [
    { Metric: 'Total Sessions', Value: stats.totalSessions || 0 },
    { Metric: 'Total Focus Time (hours)', Value: ((stats.totalFocusTime || 0) / 60).toFixed(2) },
    { Metric: 'Average Session Duration (min)', Value: stats.averageDuration || 25 },
    { Metric: 'Most Productive Day', Value: stats.mostProductiveDay || '-' },
    { Metric: 'Most Productive Hour', Value: stats.mostProductiveHour || '-' },
    { Metric: 'Current Streak', Value: stats.currentStreak || 0 },
    { Metric: 'Longest Streak', Value: stats.longestStreak || 0 },
    { Metric: 'Projects Worked On', Value: stats.projectCount || 0 },
    { Metric: 'Tasks Completed', Value: stats.completedTasks || 0 }
  ];

  return Papa.unparse(summaryData, {
    delimiter: ',',
    header: true
  });
};

/**
 * Proje bazlı özet CSV
 * @param {Array} sessions - Session verileri
 * @param {Array} projects - Proje listesi
 * @returns {string} CSV içeriği
 */
export const convertProjectSummaryToCSV = (sessions, projects) => {
  const projectStats = {};
  
  sessions.forEach(session => {
    const projectId = session.project_id || session.projectId;
    const project = projects.find(p => p.id === projectId);
    const projectName = project?.name || session.project_name || 'Unknown';
    
    if (!projectStats[projectName]) {
      projectStats[projectName] = {
        'Project': projectName,
        'Total Sessions': 0,
        'Total Time (min)': 0,
        'Total Time (hours)': 0,
        'Percentage': 0
      };
    }
    
    projectStats[projectName]['Total Sessions'] += 1;
    projectStats[projectName]['Total Time (min)'] += (session.duration || 25);
  });

  const totalTime = Object.values(projectStats).reduce((sum, p) => sum + p['Total Time (min)'], 0);
  
  const data = Object.values(projectStats).map(p => ({
    ...p,
    'Total Time (hours)': (p['Total Time (min)'] / 60).toFixed(2),
    'Percentage': totalTime > 0 ? ((p['Total Time (min)'] / totalTime) * 100).toFixed(1) + '%' : '0%'
  }));

  return Papa.unparse(data, { delimiter: ',', header: true });
};

/**
 * Günlük özet CSV
 * @param {Array} sessions - Session verileri
 * @returns {string} CSV içeriği
 */
export const convertDailySummaryToCSV = (sessions) => {
  const dailyStats = {};
  
  sessions.forEach(session => {
    const date = new Date(session.date || session.created_at || session.start_time);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = {
        'Date': date.toLocaleDateString('tr-TR'),
        'Weekday': date.toLocaleDateString('tr-TR', { weekday: 'long' }),
        'Total Sessions': 0,
        'Total Time (min)': 0,
        'Projects': new Set(),
        'Tasks Completed': 0
      };
    }
    
    dailyStats[dateKey]['Total Sessions'] += 1;
    dailyStats[dateKey]['Total Time (min)'] += (session.duration || 25);
    dailyStats[dateKey]['Projects'].add(session.project_id || session.projectId);
    if (session.task_completed) {
      dailyStats[dateKey]['Tasks Completed'] += 1;
    }
  });

  const data = Object.values(dailyStats).map(d => ({
    ...d,
    'Total Time (hours)': (d['Total Time (min)'] / 60).toFixed(2),
    'Projects Count': d['Projects'].size,
    'Projects': Array.from(d['Projects']).join(', ')
  }));

  return Papa.unparse(data, { delimiter: ',', header: true });
};

/**
 * CSV dosyasını indir
 * @param {string} csvContent - CSV içeriği
 * @param {string} filename - Dosya adı
 */
export const downloadCSV = (csvContent, filename = 'podomodro-report.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Tam rapor CSV export
 * @param {Object} data - Tüm veriler
 * @param {string} filterType - Filtre tipi
 */
export const exportFullReport = (data, filterType = 'monthly') => {
  const { sessions, projects, tasks, stats } = data;
  
  const filteredSessions = filterSessionsByDate(sessions, filterType);
  
  const sessionsCSV = convertToCSV(filteredSessions, projects, tasks);
  const summaryCSV = convertStatsToCSV(stats);
  const projectCSV = convertProjectSummaryToCSV(filteredSessions, projects);
  const dailyCSV = convertDailySummaryToCSV(filteredSessions);
  
  const combinedCSV = `# SESSIONS\n${sessionsCSV}\n\n# SUMMARY\n${summaryCSV}\n\n# PROJECT SUMMARY\n${projectCSV}\n\n# DAILY SUMMARY\n${dailyCSV}`;
  
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCSV(combinedCSV, `podomodro-full-report-${timestamp}.csv`);
};

/**
 * Hafta numarası hesapla
 * @param {Date} date - Tarih
 * @returns {number} Hafta numarası
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

export default {
  filterSessionsByDate,
  convertToCSV,
  convertStatsToCSV,
  convertProjectSummaryToCSV,
  convertDailySummaryToCSV,
  downloadCSV,
  exportFullReport
};
