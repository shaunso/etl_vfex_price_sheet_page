# VFEX price sheet web scrapper

** execute [npm i ] to install all relevant dependices
* execute [npm start] to run the programe

insert tab-separated tabular data in a plain text file in this circa format nam\nopen\close\volume

## CLI commands to run prior to executing node

#### (i) count the number of leading whitespaces. this is an indicator for the number of equities returned
grep -w "td" priceSheet.htm | grep -v "^.*&nbsp;.*$" | grep -v "tr" | grep -iA69 "african" | sed 's/  <td class="xl77" align="right" style="border-top-width: initial; border-top-style: none; border-left-width: initial; border-left-style: none;">//' | sed 's/<\/td>//' | sed 's/  <td height="18" class="xl77" style="height: 13.2pt; border-top-width: initial; border-top-style: none;">//' | grep -c "^ " >> count.txt

#### (ii) saves the data, without leading whitespaces, in a .txt file as a single column of rows
grep -w "td" b.htm | grep -v "^.*&nbsp;.*$" | grep -v "tr" | grep -iA69 "african" | sed 's/  <td class="xl77" align="right" style="border-top-width: initial; border-top-style: none; border-left-width: initial; border-left-style: none;">//' | sed 's/<\/td>//' | sed 's/  <td height="18" class="xl77" style="height: 13.2pt; border-top-width: initial; border-top-style: none;">//' | sed -e 's/^[ \t]*//' > priceSheet.txt

#### (iii) returns the count of the lines for the scrapped data
grep -w "td" b.htm | grep -v "^.*&nbsp;.*$" | grep -v "tr" | grep -iA69 "african" | sed 's/  <td class="xl77" align="right" style="border-top-width: initial; border-top-style: none; border-left-width: initial; border-left-style: none;">//' | sed 's/<\/td>//' | sed 's/  <td height="18" class="xl77" style="height: 13.2pt; border-top-width: initial; border-top-style: none;">//' | sed -e 's/^[ \t]*//' | grep -c "^.*.*$"

- NodeJS reads the text file output by executing (ii) to then save the data in .json & .csv files, and inserting the data into the database


## First MVC attempt
