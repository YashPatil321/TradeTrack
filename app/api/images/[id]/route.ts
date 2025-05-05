import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Image from "../../../../models/Image";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const image = await Image.findById(params.id);
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    // Return the image with appropriate headers
    return new NextResponse(image.data, {
      headers: {
        'Content-Type': image.contentType,
        'Content-Length': image.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { success: false, error: "Error serving image" },
      { status: 500 }
    );
  }
} 