import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

// Define Booking model if it doesn't exist
let Booking: mongoose.Model<any>;

try {
  // Try to fetch the existing model
  Booking = mongoose.model("Booking");
} catch {
  // Create the model if it doesn't exist
  const BookingSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    amount: { type: Number, required: true },
    customerEmail: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, default: "pending" },
    paymentStatus: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now },
  });
  
  Booking = mongoose.model("Booking", BookingSchema);
}

// GET handler to retrieve booked time slots for a specific service on a specific date
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");
    
    if (!serviceId || !date) {
      return NextResponse.json(
        { success: false, error: "Service ID and date are required" },
        { status: 400 }
      );
    }
    
    // Find all bookings for this service on this date
    const bookings = await Booking.find({
      serviceId: serviceId,
      date: date,
      status: { $ne: "cancelled" }, // Exclude cancelled bookings
    });
    
    // Extract booked time slots
    const bookedSlots = bookings.map(booking => booking.time);
    
    return NextResponse.json(
      { success: true, bookedSlots },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching booked slots:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
