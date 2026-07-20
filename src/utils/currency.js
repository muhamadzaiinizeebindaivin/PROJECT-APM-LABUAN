export const parseCurrency = (str) => {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/,/g, ''));
};

export const formatCurrency = (num) => {
  if (isNaN(num)) return '0.00';
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};