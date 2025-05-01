// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Service from "../../../models/Service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

// Get all services
export async function GET(req: NextRequest) {
  await dbConnect();
  
  try {
    const services = await Service.find({});
    return NextResponse.json(
      { success: true, data: services },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// Create a new service
export async function POST(req: NextRequest) {
  await dbConnect();
  
  // Get the user session to verify authentication
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    
    // Validate trade type
    const ALLOWED_TRADES = ["food_truck", "plumber", "electrician", "handyman", "painter"];
    if (!body.trade || !ALLOWED_TRADES.includes(body.trade)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid or missing trade type. Must be one of: ${ALLOWED_TRADES.join(", ")}` 
        }, 
        { status: 400 }
      );
    }
    
    // Add the user's email to the service
    body.userEmail = session.user.email;
    
    // Create the new service
    const newService = await Service.create(body);
    
    return NextResponse.json(
      { success: true, data: newService },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating service:", error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation error", details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
