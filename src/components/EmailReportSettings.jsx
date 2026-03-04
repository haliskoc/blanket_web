import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Bell,
  Calendar,
  Clock,
  FileText,
  Check,
  AlertCircle,
  ChevronDown,
  Save,
  Send
} from 'lucide-react';

/**
 * EmailReportSettings - E-posta rapor ayarları
 */
const EmailReportSettings = ({ onClose }) => {
  // Ayarlar state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('podomodro-email-reports');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      email: '',
      frequency: 'weekly', // daily, weekly, monthly
      dayOfWeek: 1, // 0 = Sunday, 1 = Monday
      timeOfDay: '09:00',
      reportType: 'summary', // summary, detailed, full
      includeProjects: true,
      includeStats: true,
      includeGoals: true
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  // Ayarları kaydet
  const handleSave = async () => {
    setIsSaving(true);
    
    // LocalStorage'a kaydet
    localStorage.setItem('podomodro-email-reports', JSON.stringify(settings));
    
    // TODO: Supabase Edge Function çağrısı
    // await saveEmailSettingsToServer(settings);
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    }, 500);
  };

  // Test e-postası gönder
  const handleTestEmail = async () => {
    setTestStatus('sending');
    
    // TODO: Supabase Edge Function çağrısı
    // await sendTestEmail(settings.email);
    
    setTimeout(() => {
      setTestStatus('sent');
      setTimeout(() => setTestStatus(null), 3000);
    }, 1500);
  };

  // Gün adını getir
  const getDayName = (day) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="email-settings-overlay"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="email-settings-modal"
      >
        {/* Header */}
        <div className="email-settings-header">
          <div className="header-title">
            <div className="header-icon">
              <Mail size={24} />
            </div>
            <div>
              <h2>Email Reports</h2>
              <p>Get your productivity reports delivered to your inbox</p>
            </div>
          </div>
          
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="email-settings-content">
          {/* Enable Toggle */}
          <div className="setting-section">
            <div className="setting-toggle">
              <div className="toggle-info">
                <Bell size={18} />
                <div>
                  <label>Enable Email Reports</label>
                  <p>Receive automated productivity reports via email</p>
                </div>
              </div>
              
              <button
                className={`toggle-switch ${settings.enabled ? 'active' : ''}`}
                onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>

          {settings.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="settings-form"
            >
              {/* Email Input */}
              <div className="setting-section">
                <label className="section-label">
                  <Mail size={14} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="email-input"
                />
              </div>

              {/* Frequency */}
              <div className="setting-section">
                <label className="section-label">
                  <Calendar size={14} />
                  Report Frequency
                </label>
                
                <div className="frequency-options">
                  {[
                    { id: 'daily', label: 'Daily', description: 'Every day' },
                    { id: 'weekly', label: 'Weekly', description: 'Once a week' },
                    { id: 'monthly', label: 'Monthly', description: 'Once a month' }
                  ].map(freq => (
                    <button
                      key={freq.id}
                      className={`frequency-btn ${settings.frequency === freq.id ? 'active' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, frequency: freq.id }))}
                    >
                      <span className="freq-label">{freq.label}</span>
                      <span className="freq-desc">{freq.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Settings */}
              <div className="setting-section">
                <label className="section-label">
                  <Clock size={14} />
                  Schedule
                </label>
                
                <div className="schedule-grid">
                  {settings.frequency !== 'daily' && (
                    <div className="schedule-item">
                      <label>Day</label>
                      <select
                        value={settings.dayOfWeek}
                        onChange={(e) => setSettings(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map(day => (
                          <option key={day} value={day}>
                            {getDayName(day)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="schedule-item">
                    <label>Time</label>
                    <input
                      type="time"
                      value={settings.timeOfDay}
                      onChange={(e) => setSettings(prev => ({ ...prev, timeOfDay: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Report Type */}
              <div className="setting-section">
                <label className="section-label">
                  <FileText size={14} />
                  Report Content
                </label>
                
                <select
                  value={settings.reportType}
                  onChange={(e) => setSettings(prev => ({ ...prev, reportType: e.target.value }))}
                  className="report-type-select"
                >
                  <option value="summary">Summary - Key metrics only</option>
                  <option value="detailed">Detailed - With charts and breakdowns</option>
                  <option value="full">Full Report - Complete analysis</option>
                </select>
              </div>

              {/* Include Options */}
              <div className="setting-section">
                <label className="section-label">Include in Report</label>
                
                <div className="include-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.includeProjects}
                      onChange={(e) => setSettings(prev => ({ ...prev, includeProjects: e.target.checked }))}
                    />
                    <span>Project breakdown</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.includeStats}
                      onChange={(e) => setSettings(prev => ({ ...prev, includeStats: e.target.checked }))}
                    />
                    <span>Statistics and trends</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.includeGoals}
                      onChange={(e) => setSettings(prev => ({ ...prev, includeGoals: e.target.checked }))}
                    />
                    <span>Goal progress</span>
                  </label>
                </div>
              </div>

              {/* Test Email */}
              <div className="setting-section">
                <button
                  className={`test-email-btn ${testStatus}`}
                  onClick={handleTestEmail}
                  disabled={!settings.email || testStatus === 'sending'}
                >
                  {testStatus === 'sending' ? (
                    <>Sending...</>
                  ) : testStatus === 'sent' ? (
                    <><Check size={16} /> Test email sent!</>
                  ) : (
                    <><Send size={16} /> Send Test Email</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          <div className="info-box">
            <AlertCircle size={16} />
            <p>
              Email reports will be sent from <strong>noreply@podomodro.app</strong>.
              Make sure to check your spam folder if you don't receive them.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="email-settings-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          
          <button
            className={`save-btn ${isSaving ? 'saving' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <><Save size={16} /> Save Settings</>
            )}
          </button>
        </div>

        {/* Save Message */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`save-message ${saveMessage.type}`}
            >
              <Check size={16} />
              {saveMessage.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

/**
 * Supabase Edge Function Placeholder
 * 
 * Edge Function: send-email-report
 * 
 * Bu fonksiyon zamanlanmış görev olarak çalışır ve kullanıcılara
 * periyodik raporlar gönderir.
 * 
 * SQL trigger:
 * 
 * CREATE OR REPLACE FUNCTION schedule_email_reports()
 * RETURNS void AS $$
 * BEGIN
 *   -- Günlük raporlar
 *   PERFORM net.http_post(
 *     url := 'https://your-project.supabase.co/functions/v1/send-email-report',
 *     headers := '{"Authorization": "Bearer " || current_setting('app.service_role_key')}',
 *     body := jsonb_build_object('frequency', 'daily')
 *   );
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * -- Cron job (pg_cron extension gerekli)
 * SELECT cron.schedule('daily-reports', '0 9 * * *', 'SELECT schedule_email_reports()');
 */

export default EmailReportSettings;
