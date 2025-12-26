// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Service from "../../../models/Service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import mongoose from "mongoose";

// Get all services
export async function GET(req: NextRequest) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Check if we should filter by provider
    const url = new URL(req.url);
    const providerOnly = url.searchParams.get('providerOnly') === 'true';
    
    if (providerOnly) {
      // Get the user session
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Fetch only services created by this provider
      const services = await Service.find({ userEmail: session.user.email });
      return NextResponse.json(
        { success: true, data: services },
        { status: 200 }
      );
    } else {
      // Fetch all services from database
      const services = await Service.find({});
      return NextResponse.json(
        { success: true, data: services },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
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
    // Connect to MongoDB first
    await dbConnect();
    
    // Parse request body
    const body = await req.json();
    // Allow optional contact fields
    const { phoneNumber, contactEmail } = body as { phoneNumber?: string; contactEmail?: string };
    
    // Validate trade type
    const ALLOWED_TRADES = ["plumber", "electrician", "handyman", "painter"];
    if (!body.trade || !ALLOWED_TRADES.includes(body.trade)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid or missing trade type. Must be one of: ${ALLOWED_TRADES.join(", ")}` 
        }, 
        { status: 400 }
      );
    }
    
    // Validate service type against admin-defined categories if it's a handyman service
    if (body.trade === "handyman" && body.serviceType) {
      try {
        // Basic validation for handyman service types
        const validHandymanServices = [
          'tv-shelf-mounting', 'furniture-assembly', 'picture-hanging', 'minor-repairs',
          'outlet-installation', 'light-fixture', 'ceiling-fan', 'smart-device'
        ];
        const serviceExists = validHandymanServices.includes(body.serviceType);
        
        if (!serviceExists) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Invalid service type. Please select from the available services.` 
            }, 
            { status: 400 }
          );
        }
      } catch (error) {
        console.log("Warning: Could not validate against admin services", error);
        // Continue even if validation fails (admin services might not be set up yet)
      }
    }
    
    // Add the user's email to the service
    body.userEmail = session.user.email;
    if (phoneNumber) body.phoneNumber = phoneNumber;
    if (contactEmail) body.contactEmail = contactEmail;

    // If no valid coordinates but we have an address, geocode server-side once
    const hasValidCoords = body?.location?.type === 'Point' && Array.isArray(body?.location?.coordinates) &&
      typeof body.location.coordinates[0] === 'number' && typeof body.location.coordinates[1] === 'number' &&
      !(body.location.coordinates[0] === 0 && body.location.coordinates[1] === 0);

    if (!hasValidCoords && typeof body.mainLocation === 'string' && body.mainLocation.trim().length > 0) {
      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(body.mainLocation)}&key=${apiKey}`;
          const resp = await fetch(url);
          const data = await resp.json();
          if (data.status === 'OK' && data.results && data.results[0]) {
            const loc = data.results[0].geometry.location;
            body.location = { type: 'Point', coordinates: [loc.lng, loc.lat] };
          }
        }
      } catch (e) {
        console.warn('Server geocoding failed, continuing without coordinates:', e);
      }
    }
    
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
      { status: 500 }
    );
  }
}

// Get available service categories for handymen
export async function OPTIONS(req: NextRequest) {
  try {
    // Return predefined service categories
    const categories = [
      { id: "handyman", name: "Handyman Services", icon: "🔨" },
      { id: "plumbing", name: "Plumbing", icon: "🔧" },
      { id: "electrician", name: "Electrician Services", icon: "⚡" },
      { id: "painting", name: "Painting Services", icon: "🎨" }
    ];
    
    const services = [
      { id: "tv-shelf-mounting", name: "TV & Shelf Mounting", category: "handyman" },
      { id: "furniture-assembly", name: "Furniture Assembly", category: "handyman" },
      { id: "picture-hanging", name: "Picture Hanging", category: "handyman" },
      { id: "minor-repairs", name: "Minor Repairs", category: "handyman" }
    ];
    
    return NextResponse.json({
      success: true,
      categories,
      services
    });
  } catch (error) {
    console.error("Error fetching service categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service categories" },
      { status: 500 }
    );
  }
}
