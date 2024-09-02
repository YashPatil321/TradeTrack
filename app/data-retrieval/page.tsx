// /pages/api/getTruckLocations.ts
import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'C:\Users\yashp\trucktrack\delta-deck-433915-q3-1fca1f2d39ba.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1g4ceACw8_xPbDzvk5mbIBLr6hu6KWeSxO_qsogXISEM';
  const range = 'Sheet1!A:D'; // Assuming data is in columns A to D

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values;
  if (rows.length) {
    const locations = rows.map(row => ({
      name: row[0],
      lat: parseFloat(row[1]),
      lng: parseFloat(row[2]),
      updateTime: new Date(row[3]),
    }));
    res.status(200).json(locations);
  } else {
    res.status(404).json({ message: 'No data found' });
  }
}
