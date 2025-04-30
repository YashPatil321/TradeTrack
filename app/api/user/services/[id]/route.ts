// app/api/user/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Service from "../../../../../models/Service";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
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
    // Find the service and verify ownership
    const service = await Service.findById(id);
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Verify the service belongs to the current user
    if (service.userEmail !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, data: service }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user service:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}