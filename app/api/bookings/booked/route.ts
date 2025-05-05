import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET handler to retrieve booked time slots for a specific service on a specific date
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");
    
    if (!serviceId || !date) {
      return NextResponse.json(
        { success: false, error: "Service ID and date are required" },
        { status: 400 }
      );
    }
    
    const bookings = await Booking.find({
      serviceId,
      date,
      status: { $ne: "cancelled" }
    }).select('time');
    
    const bookedSlots = bookings.map(booking => booking.time);
    
    return NextResponse.json(
      { success: true, bookedSlots },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching booked slots:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch booked slots" },
      { status: 500 }
    );
  }
}
