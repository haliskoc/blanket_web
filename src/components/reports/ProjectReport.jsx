import React from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Folder,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle
} from 'lucide-react';

/**
 * ProjectReport - Proje bazlı rapor
 */
const ProjectReport = ({ data }) => {
  const { sessions, projects } = data;

  // Proje istatistikleri
  const projectStats = calculateProjectStats(sessions, projects);
  
  // Toplam süre
  const totalHours = projectStats.reduce((sum, p) => sum + p.hours, 0);

  // Renk paleti
  const COLORS = ['#ff3b3b', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="project-report">
      {/* Proje Özeti */}
      <div className="project-summary-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="summary-stat"
        >
          <Folder size={24} />
          <div>
            <span className="stat-number">{projects.length}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="summary-stat"
        >
          <Clock size={24} />
          <div>
            <span className="stat-number">{totalHours.toFixed(1)}h</span>
            <span className="stat-label">Total Time</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="summary-stat"
        >
          <Target size={24} />
          <div>
            <span className="stat-number">{sessions.length}</span>
            <span className="stat-label">Sessions</span>
          </div>
        </motion.div>
      </div>

      {/* İki Sütunlu Layout */}
      <div className="project-two-column">
        {/* Pasta Grafiği */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="chart-card"
        >
          <div className="chart-header">
            <TrendingUp size={18} />
            <h3>Time Distribution</h3>
          </div>
          
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={projectStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="hours"
                >
                  {projectStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value.toFixed(1)} hours`, 'Time']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Proje Bar Grafiği */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="chart-card"
        >
          <div className="chart-header">
            <Target size={18} />
            <h3>Sessions by Project</h3>
          </div>
          
          <div className="bar-chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={projectStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={10}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="sessions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Proje Detay Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="project-table-section"
      >
        <div className="table-header">
          <Calendar size={18} />
          <h3>Project Details</h3>
        </div>
        
        <div className="project-table-container">
          <table className="project-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Sessions</th>
                <th>Time (hours)</th>
                <th>Percentage</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectStats.map((project, index) => (
                <tr key={project.id || index}>
                  <td>
                    <div className="project-name-cell">
                      <span 
                        className="project-color-dot"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{project.name}</span>
                    </div>
                  </td>
                  <td>{project.sessions}</td>
                  <td>{project.hours.toFixed(1)}h</td>
                  <td>{project.percentage}%</td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${project.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${project.sessions > 0 ? 'active' : 'inactive'}`}>
                      {project.sessions > 0 ? (
                        <><CheckCircle size={12} /> Active</>
                      ) : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Proje İpuçları */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="project-insights"
      >
        <h4>
          <TrendingUp size={16} />
          Insights
        </h4>
        <ul>
          {projectStats.length > 0 && (
            <>
              <li>
                Most time spent on <strong>{projectStats[0]?.name}</strong> ({projectStats[0]?.percentage}%)
              </li>
              <li>
                You worked on <strong>{projectStats.filter(p => p.sessions > 0).length}</strong> active projects
              </li>
              <li>
                Average <strong>{(sessions.length / Math.max(projectStats.length, 1)).toFixed(1)}</strong> sessions per project
              </li>
            </>
          )}
        </ul>
      </motion.div>
    </div>
  );
};

// Yardımcı fonksiyonlar

function calculateProjectStats(sessions, projects) {
  const stats = {};
  let totalHours = 0;

  // Tüm projeleri başlat
  projects.forEach(project => {
    stats[project.id] = {
      id: project.id,
      name: project.name,
      sessions: 0,
      hours: 0,
      color: project.color
    };
  });

  // Sessionları say
  sessions.forEach(session => {
    const projectId = session.project_id || session.projectId;
    if (stats[projectId]) {
      stats[projectId].sessions += 1;
      stats[projectId].hours += (session.duration || 25) / 60;
      totalHours += (session.duration || 25) / 60;
    }
  });

  // Yüzde hesapla ve sırala
  return Object.values(stats)
    .map(project => ({
      ...project,
      percentage: totalHours > 0 ? Math.round((project.hours / totalHours) * 100) : 0
    }))
    .sort((a, b) => b.hours - a.hours);
}

export default ProjectReport;
