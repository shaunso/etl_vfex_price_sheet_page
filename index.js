import fs from 'fs';

// returns date in YYYY-MM-DD format
function theDate(today) {
  const year = today.getFullYear().toString();
  const month = ( today.getMonth() + 1 ).toString();
  const day = today.getDate().toString();

  return `${year}-${month}-${day}`;
}

const currDate = theDate( new Date() );

const data = fs.readFileSync('priceSheet.txt', { encoding: 'utf8', flag: 'r' });

const arr = data.split("\n");

const newArr = [];

let i = 0;

//
for ( i; i < arr.length; i+= 5 ) {
  let chunck = arr.slice( i, i + 5 )
  const [ name_prefix, name_suffix, open, close, volume ] = chunck;

  const end_of_day = {
    name: name_prefix +" "+ name_suffix,
    open: open,
    close: close,
    volume: volume,
  }

  newArr.push( end_of_day );
};

// removing the undefined object at the last position of the array
newArr.pop()

// print the scrapped data to the console
console.log( newArr )
//

// save the data in .json file
const jsonStream = fs.createWriteStream(`equities/json/${currDate}.json`, { flags: 'w'});
jsonStream.write( JSON.stringify( newArr ) );
jsonStream.end();

// append the days data to the .csv file

fs.appendFileSync( 'equities/price.csv', `\n${currDate}` );
fs.appendFileSync( 'equities/volume.csv', `\n${currDate}` );

console.log( (`+`).repeat(64) );
console.log(`+++++ VFEX price sheet for ${currDate} successfully scrapped +++++` );
console.log( (`+`).repeat(64) );

// save the data in .csv file
const priceStream = fs.createWriteStream( 'equities/price.csv', { flags: 'a'});
const volumeStream = fs.createWriteStream( 'equities/volume.csv', { flags: 'a'});

for ( let el of newArr) {
  const closing = el.close;
  const volumes = el.volume;

  priceStream.write(`,${+closing}`);
  volumeStream.write(`,${+volumes}`);

  console.log(` + ${el.name}: [ US$${+closing} | ${+volumes} shares ]`)
}

// close the write streams for the CSV files
priceStream.end();
volumeStream.end();




