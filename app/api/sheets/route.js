import { GoogleSpreadsheet } from 'google-spreadsheet';

// Initialize the sheet - doc ID is the long id in the sheets URL
const doc = new GoogleSpreadsheet('<1g4ceACw8_xPbDzvk5mbIBLr6hu6KWeSxO_qsogXISEM>');

async function accessSpreadsheet() {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });

  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0]; // Index of sheet
  const rows = await sheet.getRows(); // Fetch rows from sheet

  return rows.map(row => row._rawData); // Return raw data
}

export default async (req, res) => {
  try {
    const data = await accessSpreadsheet();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data from Google Sheets' });
  }
};
