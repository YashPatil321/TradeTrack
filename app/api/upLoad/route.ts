// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // You'll need to install this package

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

    // Create a unique filename
    const uniqueFilename = `${uuidv4()}-${file.name.replace(/\s/g, '_')}`;
    
    // Define the upload directory and create it if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public/uploads");
    try {
      await writeFile(`${uploadDir}/${uniqueFilename}`, new Uint8Array(buffer));
    } catch (error) {
      console.error("Error saving file:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save file" },
        { status: 500 }
      );
    }

    // Return the URL to the uploaded file
    const fileUrl = `/uploads/${uniqueFilename}`;
    
    return NextResponse.json(
      { 
        success: true, 
        url: fileUrl, 
        filename: uniqueFilename,
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