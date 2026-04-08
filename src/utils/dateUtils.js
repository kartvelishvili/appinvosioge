export const formatDistanceToNow = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'ახლახან';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} წუთის წინ`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} საათის წინ`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} დღის წინ`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} კვირის წინ`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} თვის წინ`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} წლის წინ`;
};

export const getMonthColor = (monthIndex) => {
  // monthIndex is 1-based (1 for January, 12 for December)
  const colors = {
    1: '#1e3a8a',  // January - Blue 900
    2: '#3b82f6',  // February - Blue 500
    3: '#10b981',  // March - Emerald 500
    4: '#34d399',  // April - Emerald 400
    5: '#fbbf24',  // May - Amber 400
    6: '#f97316',  // June - Orange 500
    7: '#ef4444',  // July - Red 500
    8: '#ec4899',  // August - Pink 500
    9: '#a855f7',  // September - Purple 500
    10: '#6366f1', // October - Indigo 500
    11: '#06b6d4', // November - Cyan 500
    12: '#14b8a6', // December - Teal 500
  };

  return colors[monthIndex] || '#64748b'; // Default slate-500
};