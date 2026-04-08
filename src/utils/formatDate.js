export const formatDateDDMMYYYY = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getMonthColorForPayment = (monthIndex) => {
  // Same logic as getMonthColor but specific if needed for payments context
  const colors = {
    1: '#1e3a8a',  // January
    2: '#3b82f6',  // February
    3: '#10b981',  // March
    4: '#34d399',  // April
    5: '#fbbf24',  // May
    6: '#f97316',  // June
    7: '#ef4444',  // July
    8: '#ec4899',  // August
    9: '#a855f7',  // September
    10: '#6366f1', // October
    11: '#06b6d4', // November
    12: '#14b8a6', // December
  };
  return colors[monthIndex] || '#64748b';
};