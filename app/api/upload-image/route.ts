// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

// Simple ID generation
const generateId = () => Math.random().toString(36).substring(2, 15);

export async function POST(request: NextRequest) {
  console.log("Upload route received a request");
  
  try {
    // Get the form data
    const formData = await request.formData();
    console.log("Form data received");
    
    const file = formData.get("file");
    console.log("File received:", file ? "yes" : "no");
    
    if (!file || typeof file === "string") {
      return NextResponse.json({ 
        success: false, 
        error: "No file uploaded or invalid file" 
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const fileName = `${generateId()}-${file.name.replace(/\s/g, "_")}`;
    console.log("Generated filename:", fileName);
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created uploads directory");
    }
    
    // Write the file
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, new Uint8Array(buffer));
    console.log("File saved to:", filePath);
    
    // Return the URL
    const fileUrl = `/uploads/${fileName}`;
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      message: "File uploaded successfully" 
    });
    
  } catch (error) {
    console.error("Error in upload route:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error uploading file" 
    }, { status: 500 });
  }
}
