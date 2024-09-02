const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const path = require('path');

const auth = new GoogleAuth({
  keyFile: path.join(__dirname, 'path-to-your-key-file.json'),
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const service = google.sheets({ version: 'v4', auth });

async function getValues(spreadsheetId, range) {
  try {
    const result = await service.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const numRows = result.data.values ? result.data.values.length : 0;
    console.log(`${numRows} rows retrieved.`);
    return result.data.values;
  } catch (err) {
    console.error('Error fetching data from Google Sheets:', err);
    throw err;
  }
}

module.exports = { getValues };
