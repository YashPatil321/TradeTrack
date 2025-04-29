// app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Service from "../../../../models/Service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Get a specific service by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  
  const id = params.id;
  
  try {
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: service },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// Update a service
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  
  const id = params.id;
  
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
    
    // Find the service first to check ownership
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Make sure the service belongs to the current user
    if (service.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only update your own services" },
        { status: 403 }
      );
    }

    // Validate trade type
    const ALLOWED_TRADES = ["food_truck", "plumber", "electrician", "handyman", "painter"];
    if (body.trade && !ALLOWED_TRADES.includes(body.trade)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid trade type. Must be one of: ${ALLOWED_TRADES.join(", ")}` 
        }, 
        { status: 400 }
      );
    }
    
    // Update the service
    // Note: findByIdAndUpdate returns the document before update by default
    const updatedService = await Service.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );
    
    return NextResponse.json(
      { success: true, data: updatedService },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

// Delete a service
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  
  const id = params.id;
  
  // Get the user session to verify authentication
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Find the service first to check ownership
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Make sure the service belongs to the current user
    if (service.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only delete your own services" },
        { status: 403 }
      );
    }
    
    // Delete the service
    await Service.findByIdAndDelete(id);
    
    return NextResponse.json(
      { success: true, message: "Service deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}