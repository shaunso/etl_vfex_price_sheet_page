// returns date in YYYY-MM-DD format
export function theDate( dateObj ) {
  const year = dateObj.getFullYear().toString();
  const month = ( dateObj.getMonth() + 1 ).toString();
  const day = dateObj.getDate().toString();

  return `${year}-${month}-${day}`;
}