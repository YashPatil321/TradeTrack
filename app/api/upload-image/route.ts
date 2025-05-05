// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import dbConnect from "../../../lib/dbConnect";
import Image from "../../../models/Image";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await dbConnect();

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Validate the file
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG and GIF are allowed" },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create a new image document in MongoDB
    const image = await Image.create({
      filename: file.name,
      contentType: file.type,
      data: buffer,
      size: file.size,
      uploadedBy: session.user.email
    });

    // Return the image ID and URL
    const imageUrl = `/api/images/${image._id}`;
    
    return NextResponse.json(
      { 
        success: true, 
        url: imageUrl,
        imageId: image._id,
        size: file.size,
        type: file.type
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during upload" },
      { status: 500 }
    );
  }
}
