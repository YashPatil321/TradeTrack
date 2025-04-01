// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Service from "../../../models/Service";

export async function POST(req: NextRequest) {
  await dbConnect();

  let body;
  try {
    body = await req.json();
    console.log("Request body received:", body);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || Object.keys(body).length === 0) {
    console.error("Empty request body");
    return NextResponse.json({ success: false, error: "Empty request body" }, { status: 400 });
  }

  try {
    const service = await Service.create(body);
    console.log("Service created successfully:", service);
    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  await dbConnect();

  try {
    const services = await Service.find({});
    return NextResponse.json({ success: true, data: services }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
