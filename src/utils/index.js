export const exportData = (data) => {
  const exportPayload = {
    ...data,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `podomodro-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid file format!'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getDateRange = (viewMode) => {
  const today = new Date();
  const days = viewMode === 'week' ? 7 : 30;
  
  return [...Array(days)].map((_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    return date.toISOString().split('T')[0];
  });
};

export const getHeatmapData = (dailyStats, weeks = 12) => {
  const today = new Date();
  const heatmapData = [];
  
  for (let week = weeks - 1; week >= 0; week--) {
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (week * 7 + (6 - day)));
      const dateStr = date.toISOString().split('T')[0];
      weekData.push({
        date: dateStr,
        count: dailyStats[dateStr]?.count || 0
      });
    }
    heatmapData.push(weekData);
  }
  
  return heatmapData;
};
