import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Target,
  Clock,
  Calendar,
  Flame,
  Award
} from 'lucide-react';

/**
 * ProductivityReport - Verimlilik özeti raporu
 */
const ProductivityReport = ({ data }) => {
  const { sessions, stats } = data;

  // Günlük aktivite verileri
  const dailyActivity = calculateDailyActivity(sessions);
  
  // Saatlik dağılım
  const hourlyDistribution = calculateHourlyDistribution(sessions);
  
  // Haftalık trend
  const weeklyTrend = calculateWeeklyTrend(sessions);

  return (
    <div className="productivity-report">
      {/* Özet Kartlar */}
      <div className="report-summary-cards">
        <SummaryCard
          icon={Target}
          title="Total Sessions"
          value={stats.totalSessions}
          subtitle={`${((stats.totalFocusTime || 0) / 60).toFixed(1)} hours focused`}
          color="#ff3b3b"
        />
        <SummaryCard
          icon={Flame}
          title="Current Streak"
          value={`${stats.currentStreak} days`}
          subtitle={`Best: ${stats.longestStreak} days`}
          color="#f59e0b"
        />
        <SummaryCard
          icon={Clock}
          title="Avg. Daily"
          value={stats.averageDaily}
          subtitle="sessions per day"
          color="#3b82f6"
        />
        <SummaryCard
          icon={Award}
          title="Completion Rate"
          value="100%"
          subtitle="of scheduled sessions"
          color="#10b981"
        />
      </div>

      {/* Günlük Aktivite Grafiği */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="report-chart-section"
      >
        <div className="chart-header">
          <Calendar size={18} />
          <h3>Daily Activity</h3>
        </div>
        
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyActivity}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3b3b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff3b3b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#ff3b3b"
                fillOpacity={1}
                fill="url(#colorSessions)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* İki Sütunlu Layout */}
      <div className="report-two-column">
        {/* Saatlik Dağılım */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="report-chart-section"
        >
          <div className="chart-header">
            <Clock size={18} />
            <h3>Activity by Hour</h3>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                
                <Bar dataKey="sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Haftalık Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="report-chart-section"
        >
          <div className="chart-header">
            <TrendingUp size={18} />
            <h3>Weekly Trend</h3>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="week" 
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detay Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="report-table-section"
      >
        <div className="table-header">
          <Target size={18} />
          <h3>Recent Sessions</h3>
        </div>
        
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(-10).reverse().map((session, index) => (
                <tr key={session.id || index}>
                  <td>
                    {new Date(session.date || session.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td>{session.project_name || 'Unknown'}</td>
                  <td>{session.duration || 25} min</td>
                  <td>
                    <span className="status-badge completed">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Özet Kartı
 */
const SummaryCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="summary-card"
    style={{ borderTop: `3px solid ${color}` }}
  >
    <div className="summary-icon" style={{ background: `${color}20`, color }}>
      <Icon size={20} />
    </div>
    <div className="summary-content">
      <span className="summary-title">{title}</span>
      <span className="summary-value" style={{ color }}>{value}</span>
      <span className="summary-subtitle">{subtitle}</span>
    </div>
  </motion.div>
);

// Yardımcı fonksiyonlar

function calculateDailyActivity(sessions) {
  const daily = {};
  
  // Son 30 günü oluştur
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    daily[key] = {
      date: date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
      sessions: 0
    };
  }
  
  sessions.forEach(session => {
    const key = (session.date || session.created_at).split('T')[0];
    if (daily[key]) {
      daily[key].sessions += 1;
    }
  });
  
  return Object.values(daily);
}

function calculateHourlyDistribution(sessions) {
  const hourly = {};
  
  for (let i = 0; i < 24; i++) {
    hourly[i] = {
      hour: `${i.toString().padStart(2, '0')}:00`,
      sessions: 0
    };
  }
  
  sessions.forEach(session => {
    const hour = new Date(session.date || session.created_at).getHours();
    hourly[hour].sessions += 1;
  });
  
  return Object.values(hourly);
}

function calculateWeeklyTrend(sessions) {
  const weekly = {};
  
  sessions.forEach(session => {
    const date = new Date(session.date || session.created_at);
    const weekKey = `W${getWeekNumber(date)}`;
    
    if (!weekly[weekKey]) {
      weekly[weekKey] = { week: weekKey, sessions: 0 };
    }
    weekly[weekKey].sessions += 1;
  });
  
  return Object.values(weekly).slice(-8);
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export default ProductivityReport;
