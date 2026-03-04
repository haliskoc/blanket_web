import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  BarChart3,
  PieChart,
  Clock,
  FileText,
  Download,
  Eye,
  Filter,
  TrendingUp,
  Target,
  Flame,
  ArrowLeft,
  Check
} from 'lucide-react';
import ExportButtons, { ExportDropdown } from '../components/ExportButtons.jsx';
import ProductivityReport from '../components/reports/ProductivityReport.jsx';
import ProjectReport from '../components/reports/ProjectReport.jsx';
import TimeDistributionReport from '../components/reports/TimeDistributionReport.jsx';
import EmailReportSettings from '../components/EmailReportSettings.jsx';
import { AppContext } from '../App.jsx';
import {
  filterSessionsByDate,
  convertToCSV,
  convertStatsToCSV,
  downloadCSV
} from '../services/csvExportService.js';
import {
  ReportType,
  generateAndDownloadReport
} from '../services/pdfExportService.js';

/**
 * ReportsPage - Ana raporlama sayfası
 */
const ReportsPage = () => {
  const { dailyStats, projects, todos, achievements } = useContext(AppContext);

  // State
  const [dateRange, setDateRange] = useState({
    start: getDateDaysAgo(30),
    end: new Date().toISOString().split('T')[0]
  });
  const [filterType, setFilterType] = useState('monthly'); // daily, weekly, monthly, custom
  const [reportType, setReportType] = useState(ReportType.PRODUCTIVITY);
  const [showPreview, setShowPreview] = useState(true);
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);

  // dailyStats'ı sessions formatına dönüştür
  useEffect(() => {
    const formattedSessions = [];
    
    Object.entries(dailyStats || {}).forEach(([date, stats]) => {
      if (stats.projects) {
        Object.entries(stats.projects).forEach(([projectName, count]) => {
          for (let i = 0; i < count; i++) {
            const project = projects.find(p => p.name === projectName);
            formattedSessions.push({
              id: `${date}-${projectName}-${i}`,
              date: date,
              created_at: `${date}T${12 + Math.floor(Math.random() * 8)}:00:00`,
              project_id: project?.id,
              projectId: project?.id,
              project_name: projectName,
              duration: 25,
              type: 'focus',
              completed: true
            });
          }
        });
      }
    });

    setSessions(formattedSessions);
  }, [dailyStats, projects]);

  // Filtrelenmiş sessionlar
  const filteredSessions = filterSessionsByDate(
    sessions,
    filterType,
    dateRange.start,
    dateRange.end
  );

  // İstatistikler
  const stats = calculateStats(filteredSessions, achievements);

  // Rapor verileri
  const reportData = {
    sessions: filteredSessions,
    projects,
    tasks: todos,
    stats,
    dateRange: {
      start: new Date(dateRange.start).toLocaleDateString('tr-TR'),
      end: new Date(dateRange.end).toLocaleDateString('tr-TR')
    }
  };

  // CSV Export
  const handleCSVExport = () => {
    const csvContent = convertToCSV(filteredSessions, projects, todos);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `podomodro-report-${timestamp}.csv`);
  };

  // PDF Export
  const handlePDFExport = () => {
    generateAndDownloadReport(reportType, reportData);
  };

  // Filtre değişimi
  const handleFilterChange = (type) => {
    setFilterType(type);
    const today = new Date();
    
    switch (type) {
      case 'daily':
        setDateRange({
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        });
        break;
      case 'weekly':
        setDateRange({
          start: getDateDaysAgo(7),
          end: today.toISOString().split('T')[0]
        });
        break;
      case 'monthly':
        setDateRange({
          start: getDateDaysAgo(30),
          end: today.toISOString().split('T')[0]
        });
        break;
      case 'custom':
        // Özel tarih aralığı - mevcut değerleri koru
        break;
    }
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="reports-title-section"
        >
          <h1>
            <BarChart3 size={28} />
            Reports & Analytics
          </h1>
          <p>Track your productivity and export detailed reports</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="reports-actions"
        >
          <button
            className="email-settings-btn"
            onClick={() => setIsEmailSettingsOpen(true)}
          >
            <Target size={16} />
            Email Reports
          </button>
          <ExportDropdown
            onCSVExport={handleCSVExport}
            onPDFExport={handlePDFExport}
            disabled={filteredSessions.length === 0}
          />
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="reports-controls"
      >
        {/* Tarih Filtreleri */}
        <div className="control-group">
          <label>
            <Calendar size={14} />
            Time Period
          </label>
          <div className="filter-buttons">
            {[
              { id: 'daily', label: 'Today', icon: Clock },
              { id: 'weekly', label: 'Last 7 Days', icon: Calendar },
              { id: 'monthly', label: 'Last 30 Days', icon: Calendar },
              { id: 'custom', label: 'Custom', icon: Filter }
            ].map(filter => (
              <button
                key={filter.id}
                className={`filter-btn ${filterType === filter.id ? 'active' : ''}`}
                onClick={() => handleFilterChange(filter.id)}
              >
                <filter.icon size={14} />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Özel Tarih Aralığı */}
        {filterType === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="date-range-inputs"
          >
            <div className="date-input-group">
              <label>From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="date-input-group">
              <label>To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </motion.div>
        )}

        {/* Rapor Tipi */}
        <div className="control-group">
          <label>
            <FileText size={14} />
            Report Type
          </label>
          <div className="report-type-buttons">
            {[
              { id: ReportType.PRODUCTIVITY, label: 'Productivity', icon: TrendingUp },
              { id: ReportType.PROJECT, label: 'By Project', icon: PieChart },
              { id: ReportType.TIME_DISTRIBUTION, label: 'Time Distribution', icon: Clock }
            ].map(type => (
              <button
                key={type.id}
                className={`report-type-btn ${reportType === type.id ? 'active' : ''}`}
                onClick={() => setReportType(type.id)}
              >
                <type.icon size={14} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Görünüm Seçenekleri */}
        <div className="control-group">
          <label>
            <Eye size={14} />
            View
          </label>
          <div className="view-toggle">
            <button
              className={showPreview ? 'active' : ''}
              onClick={() => setShowPreview(true)}
            >
              <Eye size={14} />
              Preview
            </button>
            <button
              className={!showPreview ? 'active' : ''}
              onClick={() => setShowPreview(false)}
            >
              <Download size={14} />
              Export Only
            </button>
          </div>
        </div>
      </motion.div>

      {/* Özet İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="stats-summary"
      >
        <StatCard
          icon={Target}
          value={stats.totalSessions}
          label="Total Sessions"
          color="primary"
        />
        <StatCard
          icon={Clock}
          value={`${((stats.totalFocusTime || 0) / 60).toFixed(1)}h`}
          label="Focus Time"
          color="secondary"
        />
        <StatCard
          icon={Flame}
          value={stats.currentStreak}
          label="Day Streak"
          color="success"
        />
        <StatCard
          icon={PieChart}
          value={stats.activeProjects}
          label="Active Projects"
          color="warning"
        />
      </motion.div>

      {/* Rapor Önizleme */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="report-preview-container"
        >
          <div className="preview-header">
            <h2>
              {reportType === ReportType.PRODUCTIVITY && <TrendingUp size={20} />}
              {reportType === ReportType.PROJECT && <PieChart size={20} />}
              {reportType === ReportType.TIME_DISTRIBUTION && <Clock size={20} />}
              {reportType === ReportType.PRODUCTIVITY && 'Productivity Report'}
              {reportType === ReportType.PROJECT && 'Project Report'}
              {reportType === ReportType.TIME_DISTRIBUTION && 'Time Distribution Report'}
            </h2>
            <div className="preview-actions">
              <ExportButtons
                onCSVExport={handleCSVExport}
                onPDFExport={handlePDFExport}
                csvDisabled={filteredSessions.length === 0}
                pdfDisabled={filteredSessions.length === 0}
                size="small"
                variant="outline"
              />
            </div>
          </div>

          <div className="preview-content">
            {filteredSessions.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {reportType === ReportType.PRODUCTIVITY && (
                  <ProductivityReport data={reportData} />
                )}
                {reportType === ReportType.PROJECT && (
                  <ProjectReport data={reportData} />
                )}
                {reportType === ReportType.TIME_DISTRIBUTION && (
                  <TimeDistributionReport data={reportData} />
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Email Settings Modal */}
      <AnimatePresence>
        {isEmailSettingsOpen && (
          <EmailReportSettings
            onClose={() => setIsEmailSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * İstatistik Kartı
 */
const StatCard = ({ icon: Icon, value, label, color }) => {
  const colors = {
    primary: '#ff3b3b',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b'
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="stat-card"
      style={{ borderLeftColor: colors[color] }}
    >
      <div className="stat-icon" style={{ background: `${colors[color]}20`, color: colors[color] }}>
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </motion.div>
  );
};

/**
 * Boş Durum
 */
const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-icon">
      <BarChart3 size={48} />
    </div>
    <h3>No Data Available</h3>
    <p>There are no pomodoro sessions for the selected time period.</p>
    <p>Complete some focus sessions to see your reports!</p>
  </div>
);

// Yardımcı fonksiyonlar

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function calculateStats(sessions, achievements) {
  const totalSessions = sessions.length;
  const totalFocusTime = totalSessions * 25;
  
  const activeProjectIds = [...new Set(sessions.map(s => s.project_id || s.projectId))];
  
  return {
    totalSessions,
    totalFocusTime,
    currentStreak: achievements?.currentStreak || 0,
    longestStreak: achievements?.longestStreak || 0,
    activeProjects: activeProjectIds.length,
    averageDaily: totalSessions > 0 ? (totalSessions / 30).toFixed(1) : 0
  };
}

export default ReportsPage;
