import fs from 'fs';
import jsdom from 'jsdom';

const { JSDOM } = jsdom;

const priceTableInsertQuery = process.env.CLOSE_WRITE;
const volumeTableInsertQuery = process.env.VOLUME_WRITE;

// function that returns the date argument for further usage in the YYYY-MM-DD format
function theDate(today) {
  const date = new Date(today)
  const year = date.getFullYear().toString();
  const month = ( date.getMonth() + 1 ).toString();
  const day = date.getDate().toString();

  return `${year}-${month}-${day}`;
}

(async () => {
  try {
    // request pages for data
    const priceSheetResponse = await fetch('https://www.vfex.exchange/price-sheet/');
    const indicesResponse = await fetch('https://www.vfex.exchange/');
    
    const priceSheetText = await priceSheetResponse.text();
    const indicesText = await indicesResponse.text();
    
    const priceSheetDOM = new JSDOM(priceSheetText);
    const indicesDOM = new JSDOM(indicesText);

    // retrieve date
    const priceSheetRawDataDate = priceSheetDOM.window.document.querySelector('.elementor-heading-title').textContent.trim();
    const indicesRawDataDate = indicesDOM.window.document.querySelector('.elementor-element-c274a2b > div:nth-child(1) > h2').textContent.trim().split(" ").toSpliced(0,2);

    const priceSheetDataDate = theDate(priceSheetRawDataDate);
    const indicesDataDate  = theDate(indicesRawDataDate);  

    // retrieve data
    const priceSheetRowElements = priceSheetDOM.window.document.querySelectorAll('tbody > tr');
    const indicesRowElements = indicesDOM.window.document.querySelectorAll('section.elementor-inner-section:nth-child(6) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) tr');
    
    const priceSheetDataFiltered = Array.from(priceSheetRowElements).filter( d => (d.querySelector('td').textContent.length > 12) );
    const indicesDataFiltered = Array.from(indicesRowElements);
    indicesDataFiltered.shift();  

    // store scrapped data
    const priceSheetData = [];
    const indicesData = [];

    // destructure the data
    const priceSheetDataDestructeredPriceData = [];
    const priceSheetDataDestructeredVolumeData = [];
    const indicesDataDestructeredValueData = [];
    
    priceSheetDataFiltered.forEach( d => {
      const name = d.querySelector('td:nth-child(1)').textContent;
      const open = d.querySelector('td:nth-child(2)').textContent;
      const close = d.querySelector('td:nth-child(3)').textContent;
      const volume = d.querySelector('td:nth-child(4)').textContent;

      priceSheetData.push( { date: priceSheetDataDate, name, open, close, volume } );
      priceSheetDataDestructeredPriceData.push( close );
      priceSheetDataDestructeredVolumeData.push( volume );
    });

    indicesDataFiltered.forEach( d => {
      const index = d.querySelector('td:nth-child(1)').textContent;
      const value = d.querySelector('td:nth-child(2)').textContent;

      indicesData.push( { date: indicesDataDate, index, value } );
      indicesDataDestructeredValueData.push( value );
    });

    console.log(priceSheetData);
    // decoration for cli
    console.log( (`+`).repeat(90) );
    console.log(`+++++ VFEX price sheet for ${ priceSheetDataDate } successfully extracted +++++` );
    console.log( (`+`).repeat(90) );

    // displays the number of equities extracted
    console.log(` ++ (${ priceSheetData.length }) out of an expected (14) equities data successfully scrapped`);
    console.log( (`+`).repeat(90) );
    console.log('\r');

    console.log(indicesData);
    console.log( (`+`).repeat(90) );
    console.log(`+++++ VFEX indices for ${ indicesDataDate } successfully extracted +++++` );
    console.log( (`+`).repeat(90) );


    // WRITE THE DATA TO FILE
    // file paths
    const priceSheetDataPriceCSVfilePath = process.env.EQUITIES_CSV_FILE_PRICE;
    const priceSheetDataVolumeCSVfilePath = process.env.EQUITIES_CSV_FILE_VOLUME;
    const indicesDataCSVfilePath = process.env.INDICES_CSV_FILE;

    const priceSheetDataPriceJSONfilePath = process.env.EQUITIES_JSON;
    const indicesDataJSONfilePath = process.env.INDICES_JSON;

  
  const priceSheetDataPriceSQLfilePath = process.env.EQUITIES_SQL_FILE_PRICE;
  const priceSheetDataVolumeSQLfilePath = process.env.EQUITIES_SQL_FILE_VOLUME;
  const indicesDataSQLfilePath = process.env.INDICES_SQL_FILE;

    // CSV
    // create write streams
    const priceSheetDataClosingPriceStream = fs.createWriteStream( priceSheetDataPriceCSVfilePath, { flags: 'a' } );
    const priceSheetDataVolumeStream = fs.createWriteStream( priceSheetDataVolumeCSVfilePath, { flags: 'a' } );
    const indicesDataStream = fs.createWriteStream( indicesDataCSVfilePath, { flags: 'a' } );

    // write the date
    priceSheetDataClosingPriceStream.write(`\n${ priceSheetDataDate }`);
    priceSheetDataVolumeStream.write(`\n${ priceSheetDataDate }`);
    indicesDataStream.write(`\n${ indicesDataDate }`);

    // write the data
    priceSheetData.forEach( el => {    
      priceSheetDataClosingPriceStream.write(`,${ +el.close }`);
      priceSheetDataVolumeStream.write(`,${ +el.volume }`);  
      console.log(` + ${ el.name }: [ US$${ el.close } | ${ el.volume } shares ]`)
    });
    console.log( (`+`).repeat(90) );

    indicesData.forEach( el => {    
      indicesDataStream.write(`,${ +el.value }`);    
      console.log(` + ${ el.index }: [ ${ el.value } ]`)
    });
    console.log( (`+`).repeat(90) );

    // close the  CSV write streams
    priceSheetDataClosingPriceStream.end();
    priceSheetDataVolumeStream.end();
    indicesDataStream.end();

    priceSheetDataClosingPriceStream.on('finish', () => {
      console.log(' - Price sheet data for price written to CSV');
    });    
    priceSheetDataVolumeStream.on('finish', () => {
      console.log(' - Price sheet data for volume written to CSV');
    });
    indicesDataStream.on('finish', () => {
      console.log(' - Indices data written to CSV');
    });

    // JSON
    const priceSheetDataJSONstream = fs.createWriteStream( `${ priceSheetDataPriceJSONfilePath }/${ priceSheetDataDate }.json` , { flags: 'w' });
    const indicesDataJSONstream = fs.createWriteStream( `${ indicesDataJSONfilePath }/${ indicesDataDate }.json` , { flags: 'w' });

    priceSheetDataJSONstream.write( JSON.stringify( priceSheetData ) );
    indicesDataJSONstream.write( JSON.stringify( indicesData ) );

    priceSheetDataJSONstream.end();
    indicesDataJSONstream.end();

    priceSheetDataJSONstream.on('finish', () => {
      console.log(' - Price sheet data written to JSON');
    });
    indicesDataJSONstream.on('finish', () => {
      console.log(' - Indices data written to JSON');
    });    

    // SQL
    const priceSheetDataPriceSQLStream = fs.createWriteStream( priceSheetDataPriceSQLfilePath , {flags: 'w' } );
    const priceSheetDataVolumeSQLStream = fs.createWriteStream( priceSheetDataVolumeSQLfilePath ,{flags: 'w' } );
    const indicesSQLStream = fs.createWriteStream( indicesDataSQLfilePath ,{flags: 'w' } );

    priceSheetDataPriceSQLStream.write(`INSERT INTO ${ process.env.PRICE_INSERT } VALUES ('${ priceSheetDataDate }',${ priceSheetDataDestructeredPriceData });`);
    priceSheetDataVolumeSQLStream.write(`INSERT INTO volume ${ process.env.VOLUME_INSERT } VALUES ('${ priceSheetDataDate }',${ priceSheetDataDestructeredVolumeData });`);
    indicesSQLStream.write(`INSERT INTO indices ${ process.env.INDICES_INSERT } VALUES ('${ indicesDataDate }',${ indicesDataDestructeredValueData });`);

    priceSheetDataPriceSQLStream.end();
    priceSheetDataVolumeSQLStream.end();
    indicesSQLStream.end();
    
    priceSheetDataPriceSQLStream.on('finish', () => {
      console.log(' - Price sheet data for price written to SQL');
    });
    priceSheetDataVolumeSQLStream.on('finish', () => {
      console.log(' - Price sheet data for volume written to SQL');
    });
    indicesSQLStream.on('finish', () => {
      console.log(' - Indices data written to SQL');
    });

    // INSERT DATA IN DATABASE


  } catch (error) {
    console.log( (`%`).repeat(60) );
    console.log( `%`, (' ').repeat(56), '%' );
    console.error('%    AN ERROR OCCURED WHILE CODE EXECUTION WAS UNDERWAY    %')
    console.log( `%`, (' ').repeat(56), '%' );
    console.log( (`%`).repeat(60) );
    console.error(error)
  }


    
    // dataArr stores the data as an array of objects
    // closeData stores the closing prices in an array of elements
    // volumeData stores the closing prices in an array of elements
    const dataArr = [];
    const closeData = [];
    const volumeData = [];
    
    // adding the date as the first element of the arrays
    // ensures data is transformed for database

    
    // extract, transform & push the data from each row into the relevant arrays
    // arr1.forEach( d => {
    //   const equity = d.split('\t');
    //   const [ name, open, close, volume ] = equity;
    //   const end_of_day = { name: name, open: +open, close: +close, volume: +volume };
    
    //   closeData.push( close );
    //   volumeData.push( volume );
    //   dataArr.push( end_of_day );
    // });
    
    // print the array of objects containing the transformed data
    // console.log( dataArr );
    
    // retrieve path to equities data folder for data files reading, writing and appending
    const priceVolDir = process.env.EQUITIES_DIR;
    
    // // feedback to indicate that the insertion into the db has begun
    // console.log( (`+`).repeat(90) );
    // console.log(' - Inserting extracted data to database');
    
    // // retrieve the mysql queries to be executed on the db to prepare the statement
    // const closeQuery = process.env.INSERT_CLOSE;
    // const volumeQuery = process.env.INSERT_VOLUME;
    
    // // execute closing price query
    // pool.execute( closeQuery, closeData, ( err, results ) => {
    //   if (err) {
    //     console.error(`Error inserting into price table: ${err.message}`)
    //   } else {
    //     console.log( ` + price table row id: ${results.insertId}` );
    //   };
    // });

    // // execute the volume query
    // pool.execute( volumeQuery, volumeData, ( err, results ) => {
    //   if (err) {
    //     // console.error(`Error inserting into volume table: ${err}`)
    //     console.error(`Error inserting into price table: ${err.message}`)
    //   } else {
    //     console.log( ` + volume table row id: ${results.insertId}` );
    //   }

    //   // Close the pool after processing the query results
    
    // // [pool.end] is nested in this [.execute] method as the pool connection may prematurely end before inserting of the data in the db
    //   pool.end( err => {
    //     if (err) console.error(`Error closing pool: ${err.message}`);
    //     console.log( (`+`).repeat(90) );
    //   });
})

();