import fs from 'fs';
import jsdom from 'jsdom';
import pool from '../model/database.js';
import theDate from '../model/date.js';
import generateRandomString from '../model/stringGenerator.js';

// variable definitions
const { JSDOM } = jsdom;

// function definitions
function filteredRows( d ) {
  if ( d.querySelector('td').textContent.length > 12 ){
    return true
  } else if ( d.querySelector('td').textContent > 0 && d.querySelector('td').textContent !== ' ' ) {
    return true
  }
  return false
}

function whitespaceFilter(d) {
  if ( d.innerHTML !== '&nbsp;' ) {
      return true
  } else 
      return false
}

// main function
async function vfexETL() {
  try {
    // request pages for data extraction
    const priceSheetResponse = await fetch('https://www.vfex.exchange/price-sheet/');
    const indicesResponse = await fetch('https://www.vfex.exchange/');
    
    // store promise responses
    const priceSheetText = await priceSheetResponse.text();
    const indicesText = await indicesResponse.text();
    
    // create virtual dom using fetched data
    const priceSheetDOM = new JSDOM(priceSheetText);
    const indicesDOM = new JSDOM(indicesText);

    // retrieve date from web page
    const priceSheetRawDataDate = priceSheetDOM.window.document.querySelector('.elementor-heading-title').textContent.trim();
    const indicesRawDataDate = indicesDOM.window.document.querySelector('.elementor-element-c274a2b > div:nth-child(1) > h2').textContent.trim().split(" ").toSpliced(0,2);

    const priceSheetDataDate = theDate(priceSheetRawDataDate);
    const indicesDataDate  = theDate(indicesRawDataDate);  

    // retrieve data
    const priceSheetRowElements = priceSheetDOM.window.document.querySelectorAll('tbody > tr');
    const indicesRowElements = indicesDOM.window.document.querySelectorAll('section.elementor-inner-section:nth-child(6) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) tr');
    const priceSheetDataFiltered = Array.from(priceSheetRowElements).filter(filteredRows);
    const indicesDataFiltered = Array.from(indicesRowElements);
    indicesDataFiltered.shift();  

    // store scrapped data
    const priceSheetData = [];
    const indicesData = [];

    // structure the extracted data
    const priceSheetDataDestructeredPriceData = [];
    const priceSheetDataDestructeredVolumeData = [];
    const indicesDataDestructeredValueData = [];
    
    priceSheetDataFiltered.forEach( d => {
      const rowElementsArray = Array.from(d.querySelectorAll('td'));
      const whitespaceFilteredRowElementsArray = rowElementsArray.filter( whitespaceFilter );
      if (whitespaceFilteredRowElementsArray[0].textContent.length < 4 ) {
        whitespaceFilteredRowElementsArray.shift()
      } 

      // uncomment this line to debug if table row format dramatically changes to an uncovered scenario
      // whitespaceFilteredRowElementsArray.forEach( (d,i) => console.log(i + ': ' + d.innerHTML));

      const name = whitespaceFilteredRowElementsArray[0].textContent;
      const open = +whitespaceFilteredRowElementsArray[1].textContent;
      const close = +whitespaceFilteredRowElementsArray[2].textContent;
      const volume =+whitespaceFilteredRowElementsArray[3].textContent;

      priceSheetData.push( { 
        date: priceSheetDataDate,
        name: name,
        open: open,
        close: close,
        volume: volume
      });
      priceSheetDataDestructeredPriceData.push( close );
      priceSheetDataDestructeredVolumeData.push( volume );
    });

    indicesDataFiltered.forEach( d => {
      const index = d.querySelector('td:nth-child(1)').textContent;
      const value = d.querySelector('td:nth-child(2)').textContent;

      indicesData.push( { date: indicesDataDate, index, value } );
      indicesDataDestructeredValueData.push( +value );
    });

    console.log(priceSheetData);
    // output decoration 
    console.log( (`+`).repeat(90) );
    console.log(`+++++ VFEX price sheet for ${ priceSheetDataDate } successfully extracted +++++` );
    console.log( (`+`).repeat(90) );

    // displays the number of equities extracted
    console.log(` ++ (${ priceSheetData.length }) out of an expected (13) equities data successfully scrapped`);
    console.log( (`+`).repeat(90) );
    console.log('\r');

    console.log(indicesData);
    console.log( (`+`).repeat(90) );
    console.log(`+++++ VFEX indices for ${ indicesDataDate } successfully extracted +++++` );
    console.log( (`+`).repeat(90) );

    //

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
      console.log(` + ${ el.name }: [ US$${ +el.close } | ${ new Intl.NumberFormat('en-GB').format(+el.volume) } shares ]`)
    });
    console.log( (`+`).repeat(90) );

    indicesData.forEach( el => {    
      indicesDataStream.write(`,${ +el.value }`);    
      console.log(` + ${ el.index }: [ ${ +el.value } ]`)
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

    //

    // INSERT DATA IN DATABASE
    const priceSheetDataDestructeredPriceDataSQLquery = process.env.INSERT_CLOSE;
    const priceSheetDataDestructeredVolumeDataSQLquery = process.env.INSERT_VOLUME;
    const indicesDataDestructeredValueDataSQLquery = process.env.INSERT_INDICES;

    // add the date to each array
    priceSheetDataDestructeredPriceData.unshift( priceSheetDataDate );
    priceSheetDataDestructeredVolumeData.unshift( priceSheetDataDate );
    indicesDataDestructeredValueData.unshift( indicesDataDate );
    
    // price data
    pool.execute( priceSheetDataDestructeredPriceDataSQLquery, priceSheetDataDestructeredPriceData, ( err, results ) => {
      if (err) {
        console.error(`Error inserting price-sheet data into price table: ${err.message}`)
      } else {
        console.log( ` + price table row id: ${results.insertId}` );
      };
    });

    // volume data
    pool.execute( priceSheetDataDestructeredVolumeDataSQLquery, priceSheetDataDestructeredVolumeData, ( err, results ) => {
      if (err) {
        console.error(`Error inserting price-sheet data into volume table: ${err.message}`)
      } else {
        console.log( ` + volume table row id: ${results.insertId}` );
      };
    });

    //indices data
    pool.execute( indicesDataDestructeredValueDataSQLquery, indicesDataDestructeredValueData, ( err, results ) => {
      if (err) {
        console.error(`Error inserting data into indices table: ${err.message}`)
      } else {
        console.log( ` + indices table row id: ${results.insertId}` );
      }

      pool.end( err => {
        if (err) console.error(`Error closing pool: ${err.message}`);
        });

    // Array.from(priceSheetRowElements).forEach( d => console.log(d.querySelectorAll('td')))

    })
          
    } catch (error) {
      console.log( (`%`).repeat(60) );
      console.log( `%`, (' ').repeat(56), '%' );
      console.error('%    AN ERROR OCCURED WHILE CODE EXECUTION WAS UNDERWAY    %')
      console.log( `%`, (' ').repeat(56), '%' );
      console.log( (`%`).repeat(60) );
      console.error(error);

      const errorOutput = {
        ref: generateRandomString(5), 
        time: new Date(),
        message: error.message,
      }

      const errorLogsStream = fs.createWriteStream( process.env.ERROR_LOGS, { flags: 'a' } );
      errorLogsStream.write( '\r\r' + JSON.stringify(errorOutput));
      errorLogsStream.end();
      errorLogsStream.on('finish', () => {
        console.log(`ERROR REF NO: '${ errorOutput.refNo }'`)
      })
    } finally {
        console.log( (`+`).repeat(90) );
        console.log( (`+`).repeat(90) );
    }
}

vfexETL();