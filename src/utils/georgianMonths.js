export const GEORGIAN_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი"
];

export const getGeorgianMonthName = (monthIndex) => {
  // monthIndex is 0-based (0 for January, 11 for December)
  return GEORGIAN_MONTHS[monthIndex] || "";
};