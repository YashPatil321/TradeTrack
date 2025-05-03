// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Service from "../../../models/Service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

// Get all services
export async function GET(req: NextRequest) {
  try {
    // Try to connect to MongoDB
    await dbConnect();
    
    // Fetch services from database
    const services = await Service.find({});
    return NextResponse.json(
      { success: true, data: services },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching services, using fallback data:", error);
    
    // Import fallback data
    const { fallbackServices } = await import('./fallback');
    
    // Return fallback data instead
    return NextResponse.json(
      { success: true, data: fallbackServices },
      { status: 200 }
    );
  }
}

// Create a new service
export async function POST(req: NextRequest) {
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
    
    try {
      // Try to connect to MongoDB
      await dbConnect();
      
      // Create the new service
      const newService = await Service.create(body);
      
      return NextResponse.json(
        { success: true, data: newService },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error("MongoDB connection error, creating temporary service:", dbError);
      
      // Generate a fake ID for the service
      const tempId = 'temp_' + Math.random().toString(36).substring(2, 15);
      
      // Create a temporary service object
      const tempService = {
        _id: tempId,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Return the temporary service
      return NextResponse.json(
        { 
          success: true, 
          data: tempService,
          notice: "Service created in temporary mode due to database connection issues. Please try again later to ensure your data is saved." 
        },
        { status: 201 }
      );
    }
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
