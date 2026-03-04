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
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Clock,
  Calendar,
  Sun,
  Moon,
  Activity,
  TrendingUp
} from 'lucide-react';

/**
 * TimeDistributionReport - Zaman dağılımı raporu
 */
const TimeDistributionReport = ({ data }) => {
  const { sessions } = data;

  // Saatlik dağılım
  const hourlyData = calculateHourlyDistribution(sessions);
  
  // Gün bazlı dağılım
  const weekdayData = calculateWeekdayDistribution(sessions);
  
  // Aylık dağılım
  const monthlyData = calculateMonthlyDistribution(sessions);
  
  // En verimli zamanlar
  const peakHours = hourlyData.filter(h => h.percentage > 50).map(h => h.hour);
  const peakDays = [...weekdayData].sort((a, b) => b.sessions - a.sessions).slice(0, 3);

  // Sabah/Öğlen/Akşam dağılımı
  const timeOfDay = calculateTimeOfDay(sessions);

  return (
    <div className="time-distribution-report">
      {/* Zaman Özeti */}
      <div className="time-summary-cards">
        <TimeSummaryCard
          icon={Sun}
          title="Morning"
          value={`${timeOfDay.morning.hours.toFixed(1)}h`}
          subtitle={`${timeOfDay.morning.percentage}% of total`}
          color="#f59e0b"
        />
        <TimeSummaryCard
          icon={Activity}
          title="Afternoon"
          value={`${timeOfDay.afternoon.hours.toFixed(1)}h`}
          subtitle={`${timeOfDay.afternoon.percentage}% of total`}
          color="#3b82f6"
        />
        <TimeSummaryCard
          icon={Moon}
          title="Evening"
          value={`${timeOfDay.evening.hours.toFixed(1)}h`}
          subtitle={`${timeOfDay.evening.percentage}% of total`}
          color="#8b5cf6"
        />
        <TimeSummaryCard
          icon={Clock}
          title="Night"
          value={`${timeOfDay.night.hours.toFixed(1)}h`}
          subtitle={`${timeOfDay.night.percentage}% of total`}
          color="#1f2937"
        />
      </div>

      {/* İki Sütunlu Layout */}
      <div className="time-charts-grid">
        {/* Saatlik Dağılım */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="time-chart-card large"
        >
          <div className="chart-header">
            <Clock size={18} />
            <h3>Activity by Hour</h3>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
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
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                  {hourlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.percentage > 50 ? '#ff3b3b' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {peakHours.length > 0 && (
            <div className="peak-hours">
              <TrendingUp size={14} />
              <span>Peak hours: {peakHours.join(', ')}</span>
            </div>
          )}
        </motion.div>

        {/* Radar Chart - Haftalık Dağılım */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="time-chart-card"
        >
          <div className="chart-header">
            <Calendar size={18} />
            <h3>Weekly Pattern</h3>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={weekdayData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar
                  name="Sessions"
                  dataKey="sessions"
                  stroke="#ff3b3b"
                  fill="#ff3b3b"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Alt Tablolar */}
      <div className="time-tables-grid">
        {/* Gün Bazlı Tablo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="time-table-card"
        >
          <div className="table-header">
            <Calendar size={18} />
            <h3>By Day of Week</h3>
          </div>
          
          <table className="time-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Sessions</th>
                <th>Hours</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {weekdayData.map((day, index) => (
                <tr key={day.day} className={index < 3 ? 'top-day' : ''}>
                  <td>
                    <span className="day-name">{day.day}</span>
                    {index === 0 && <span className="best-badge">Best</span>}
                  </td>
                  <td>{day.sessions}</td>
                  <td>{day.hours.toFixed(1)}h</td>
                  <td>
                    <div className="share-bar">
                      <div 
                        className="share-fill"
                        style={{ width: `${day.percentage}%` }}
                      />
                      <span>{day.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Aylık Tablo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="time-table-card"
        >
          <div className="table-header">
            <Clock size={18} />
            <h3>Monthly Overview</h3>
          </div>
          
          <table className="time-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Sessions</th>
                <th>Hours</th>
                <th>Avg/Day</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month) => (
                <tr key={month.month}>
                  <td>{month.month}</td>
                  <td>{month.sessions}</td>
                  <td>{month.hours.toFixed(1)}h</td>
                  <td>{month.avgPerDay.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Zaman Analizi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="time-analysis"
      >
        <h4>
          <Activity size={16} />
          Time Analysis
        </h4>
        <div className="analysis-grid">
          <div className="analysis-item">
            <span className="analysis-label">Most Productive Day</span>
            <span className="analysis-value">{peakDays[0]?.day || '-'}</span>
          </div>
          <div className="analysis-item">
            <span className="analysis-label">Preferred Time</span>
            <span className="analysis-value">
              {timeOfDay.morning.percentage > 33 ? 'Morning' : 
               timeOfDay.afternoon.percentage > 33 ? 'Afternoon' : 
               timeOfDay.evening.percentage > 33 ? 'Evening' : 'Night'}
            </span>
          </div>
          <div className="analysis-item">
            <span className="analysis-label">Consistency</span>
            <span className="analysis-value">
              {sessions.length > 20 ? 'High' : sessions.length > 10 ? 'Medium' : 'Low'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Zaman Özet Kartı
 */
const TimeSummaryCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="time-summary-card"
    style={{ borderLeft: `3px solid ${color}` }}
  >
    <div className="time-icon" style={{ background: `${color}20`, color }}>
      <Icon size={20} />
    </div>
    <div className="time-content">
      <span className="time-title">{title}</span>
      <span className="time-value" style={{ color }}>{value}</span>
      <span className="time-subtitle">{subtitle}</span>
    </div>
  </motion.div>
);

// Yardımcı fonksiyonlar

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
  
  const maxSessions = Math.max(...Object.values(hourly).map(h => h.sessions));
  
  return Object.values(hourly).map(h => ({
    ...h,
    percentage: maxSessions > 0 ? (h.sessions / maxSessions) * 100 : 0
  }));
}

function calculateWeekdayDistribution(sessions) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekday = {};
  
  days.forEach(day => {
    weekday[day] = { day, sessions: 0, hours: 0 };
  });
  
  let totalSessions = 0;
  
  sessions.forEach(session => {
    const dayIndex = new Date(session.date || session.created_at).getDay();
    const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Pazartesi başlangıç
    weekday[dayName].sessions += 1;
    weekday[dayName].hours += (session.duration || 25) / 60;
    totalSessions += 1;
  });
  
  return Object.values(weekday).map(w => ({
    ...w,
    percentage: totalSessions > 0 ? Math.round((w.sessions / totalSessions) * 100) : 0,
    fullMark: Math.max(...Object.values(weekday).map(d => d.sessions)) || 1
  }));
}

function calculateMonthlyDistribution(sessions) {
  const monthly = {};
  
  sessions.forEach(session => {
    const date = new Date(session.date || session.created_at);
    const key = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
    
    if (!monthly[key]) {
      monthly[key] = {
        month: key,
        sessions: 0,
        hours: 0,
        days: new Set()
      };
    }
    
    monthly[key].sessions += 1;
    monthly[key].hours += (session.duration || 25) / 60;
    monthly[key].days.add(date.toDateString());
  });
  
  return Object.values(monthly).map(m => ({
    ...m,
    avgPerDay: m.hours / Math.max(m.days.size, 1)
  }));
}

function calculateTimeOfDay(sessions) {
  const periods = {
    morning: { hours: 0, label: 'Morning (6-12)' },
    afternoon: { hours: 0, label: 'Afternoon (12-18)' },
    evening: { hours: 0, label: 'Evening (18-22)' },
    night: { hours: 0, label: 'Night (22-6)' }
  };
  
  let totalHours = 0;
  
  sessions.forEach(session => {
    const hour = new Date(session.date || session.created_at).getHours();
    const sessionHours = (session.duration || 25) / 60;
    
    if (hour >= 6 && hour < 12) {
      periods.morning.hours += sessionHours;
    } else if (hour >= 12 && hour < 18) {
      periods.afternoon.hours += sessionHours;
    } else if (hour >= 18 && hour < 22) {
      periods.evening.hours += sessionHours;
    } else {
      periods.night.hours += sessionHours;
    }
    
    totalHours += sessionHours;
  });
  
  return {
    morning: {
      ...periods.morning,
      percentage: totalHours > 0 ? Math.round((periods.morning.hours / totalHours) * 100) : 0
    },
    afternoon: {
      ...periods.afternoon,
      percentage: totalHours > 0 ? Math.round((periods.afternoon.hours / totalHours) * 100) : 0
    },
    evening: {
      ...periods.evening,
      percentage: totalHours > 0 ? Math.round((periods.evening.hours / totalHours) * 100) : 0
    },
    night: {
      ...periods.night,
      percentage: totalHours > 0 ? Math.round((periods.night.hours / totalHours) * 100) : 0
    }
  };
}

export default TimeDistributionReport;
