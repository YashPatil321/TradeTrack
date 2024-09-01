import { google } from 'googleapis';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

// Path to your service account key file
const keyFile = path.join(process.cwd(), 'path-to-your-service-account-key.json');

const sheets = google.sheets('v4');

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await auth.getClient();
  const spreadsheetId = 'your-spreadsheet-id';  // Replace with your actual spreadsheet ID
  const range = 'Sheet1!A:D';  // Adjust range to your sheet
  
  const response = await sheets.spreadsheets.values.get({
    auth: client,
    spreadsheetId,
    range,
  });

 
