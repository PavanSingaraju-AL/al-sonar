const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

// Function to convert JSON data string to CSV
function jsonToCsv(jsonDataString, csvFilePath) {
    // Parse JSON string to JavaScript object
    const jsonData = JSON.parse(jsonDataString);
    
    // Define CSV header and keys based on the structure of JSON data
    const csvHeader = Object.keys(jsonData[0]).map(key => ({ id: key, title: key }));

    // Extract data from JSON
    const csvData = jsonData.map(item => Object.values(item));

    // Define CSV Writer and write data
    const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: csvHeader
    });

    csvWriter.writeRecords(csvData)
        .then(() => console.log('CSV file has been written successfully'))
        .catch(error => console.error('Error writing CSV file', error));
}

module.exports = { jsonToCsv };
