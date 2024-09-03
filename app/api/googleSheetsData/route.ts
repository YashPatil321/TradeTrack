import { NextRequest, NextResponse } from 'next/server';
import { getValues } from '../../../services/googleSheets';

// Handle GET requests
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const spreadsheetId = searchParams.get('spreadsheetId');
  const range = searchParams.get('range');

  if (!spreadsheetId || !range) {
    return NextResponse.json({ error: 'Missing spreadsheetId or range' }, { status: 400 });
  }

  try {
    const data = await getValues(spreadsheetId, range);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}

// You can also export other HTTP methods like POST, PUT, DELETE if needed.
