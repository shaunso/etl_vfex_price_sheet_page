// function that returns the date argument for further usage in the YYYY-MM-DD format
function theDate(today) {
  const date = new Date(today)
  const year = date.getFullYear().toString();
  const month = ( date.getMonth() + 1 ).toString();
  const day = date.getDate().toString();

  return `${year}-${month}-${day}`;
}

export default theDate;