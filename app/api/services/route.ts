// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Service from "../../../models/Service";

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    // Expected body should include all service fields along with userEmail
    // Example:
    // {
    //   name: "My Truck",
    //   description: "...",
    //   image: "/path/to/image.png",
    //   hours: "10 AM - 8 PM",
    //   mainLocation: "123 Main St",
    //   trade: "food_truck",
    //   schedule: [...],
    //   userEmail: "user@example.com"
    // }
    const service = await Service.create(body);
    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

export async function GET() {
  await dbConnect();

  try {
    const services = await Service.find({});
    return NextResponse.json({ success: true, data: services }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}
