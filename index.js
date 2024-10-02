import fs from 'fs';
import mysql from 'mysql2';

// returns date in YYYY-MM-DD format
function theDate(today) {
  const year = today.getFullYear().toString();
  const month = ( today.getMonth() + 1 ).toString();
  const day = today.getDate().toString();

  return `${year}-${month}-${day}`;
}

const currDate = theDate( new Date() );

// load the data from the .txt file
// fields are tab separated
// each row should contain the equity name, open & close price, and trade volume for the day
const data = fs.readFileSync('priceSheet.txt', { encoding: 'utf8', flag: 'r' });

// split the incoming data by line
const arr = data.split('\n');

// remove empty rows
const arr1 = arr.filter( d => d.length > 10 );

// dataArr stores the data as an array of objects
// closeData stores the closing prices in an array of elements
// volumeData stores the closing prices in an array of elements
const dataArr = [];
const closeData = [];
const volumeData = [];

// adding the date as the first element of the arrays
// ensures data is transformed for database
closeData.push( ( currDate ) );
volumeData.push( currDate );

// extract, transform & push the data from each row into the relevant arrays
arr1.forEach( d => {
  const equity = d.split('\t');
  const [ name, open, close, volume ] = equity;
  const end_of_day = { name: name, open: +open, close: +close, volume: +volume };

  closeData.push( close );
  volumeData.push( volume );
  dataArr.push( end_of_day );
});
//
console.log( dataArr )
//
// save the data in .json file using write stream
const jsonStream = fs.createWriteStream(`equities/json/${currDate}.json`, { flags: 'w'  });
jsonStream.write( JSON.stringify( dataArr ) );
jsonStream.end();

// append the date from [currDate] data to a new row of the .csv file
fs.appendFileSync( 'equities/price.csv', `\n${currDate}` );
fs.appendFileSync( 'equities/volume.csv', `\n${currDate}` );

// header for output for the extracted data to the console
console.log( (`+`).repeat(90) );
console.log(`+++++ VFEX price sheet for ${currDate} successfully scrapped +++++` );
console.log( (`+`).repeat(90) );

// write the closing price & trade volume data to the .csv files
const priceStream = fs.createWriteStream( 'equities/price.csv', { flags: 'a' } );
const volumeStream = fs.createWriteStream( 'equities/volume.csv', { flags: 'a' } );

for ( let el of dataArr ) {
  const closing = el.close;
  const volumes = el.volume;

  priceStream.write(`,${+closing}`);
  volumeStream.write(`,${+volumes}`);

  console.log(` + ${el.name}: [ US$${+closing} | ${+volumes} shares ]`)
}

// close the write streams for the CSV files
priceStream.end();
volumeStream.end();

// decoration to indicate end of the data
console.log( (`+`).repeat(90) );
console.log('\r\n');


// *************** load the data to mysql database *******************
 // env variables to connect to the database
const dbHost = '';
const dbUser = '';
const dbPassword = '';
const dbName = '';

 // connect to the database using a pool
const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  connectionLimit: 10
});

 // feedback to indicate that the insertion into the db has begun
console.log( (`-`).repeat(90) );
console.log('----- INSERTING DATA INTO PRICE & VOLUME DATABASES -----');
console.log( (`-`).repeat(90) );

console.log( closeData );

// env variables for the sql queries to be executed
const closeQuery = "";

const volumeQuery = "";

// execute closing price query
pool.execute( closeQuery, closeData, ( err, results ) => {
  if (err) console.error( err.name +': '+ err.message );
  // print the response from the mysql server after executing the query else print the response received from the db

  console.log( results );
});

// execute the volume query
pool.execute( volumeQuery, volumeData, ( err, results ) => {
  if (err) console.log( err.name +': '+ err.message );
  // print the response from the mysql server after executing the query else print the response received from the db
  console.log( results );

  // Close the pool after processing the query results
 // [pool.end] is nested in this [.execute] method as the pool connection may prematurely end before inserting of the data in the db
  pool.end( err => {
    if (err) console.error(`Error closing pool: ${err.message}`);
  });

  // decoration to indicate end of the data
  console.log( (`-`).repeat(90) );
  console.log('----- POOL CLOSED SUCCESSFULLY -----');
  console.log( (`-`).repeat(90) );
});


// ***************************** write .sql queries ****************************
// write sql queries in .sql files with the extracted data using a write stream
// used to load queries into main db if the extracted data pass the sniff test
// this to reduce the possibility of wanton data entering the production db
const priceSQLStream = fs.createWriteStream(`./equities/price.sql`, {flags: 'w' } );
const volSQLStream = fs.createWriteStream(`./equities/vol.sql`,{flags: 'w' } );
// write to the .sql file with the query with the data
priceSQLStream.write(`INSERT INTO price (date, African_Sun_Limited, Axia_Corporation_Limited, Caledonia_Mining_Corporation_Plc_Zimbabwe_Depository_Receipts, Edgars_Stores_Limited, First_Capital_Bank_Limited, Innscor_Africa_Limited, Invictus_Energy_Limited_Zimbabwe_Depository_Receipts, National_Foods_Holdings_Limited, Nedbank_Group_Limited_Zimbabwe_Depository_Receipts, Padenga_Holdings_Limited, Seed_Co_International_Limited, Simbisa_Brands_Limited, WestProp_Holdings_Limited, Zimplow_Holdings_Limited) VALUES ('${ currDate }',${ +closeData.slice(1) } );`);
volSQLStream.write(`INSERT INTO volume (date, African_Sun_Limited, Axia_Corporation_Limited, Caledonia_Mining_Corporation_Plc_Zimbabwe_Depository_Receipts, Edgars_Stores_Limited, First_Capital_Bank_Limited, Innscor_Africa_Limited, Invictus_Energy_Limited_Zimbabwe_Depository_Receipts, National_Foods_Holdings_Limited, Nedbank_Group_Limited_Zimbabwe_Depository_Receipts, Padenga_Holdings_Limited, Seed_Co_International_Limited, Simbisa_Brands_Limited, WestProp_Holdings_Limited, Zimplow_Holdings_Limited) VALUES ('${ currDate }',${volumeData.slice(1)});`);
// close the stream
priceSQLStream.end();
volSQLStream.end();
