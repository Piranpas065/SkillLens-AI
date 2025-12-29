

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, type PDFExtractionError } from "@/lib/pdf-extractor";
import { openai } from "@/lib/openAI";


export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data from the request
    const formData = await req.formData();
    const file: File | null = formData.get("file") as File;
    const extractSkills = formData.get("extractSkills") === "true";

    // Validate that a file was provided in the request
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await extractTextFromPDF(file);
    console.log('Full extracted resume text:', result.text);
    // You can add further checks here to ensure backend/data/cloud skills are present
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("PDF extraction error:", error);
    
    
    if (error && typeof error === 'object' && 'error' in error && 'statusCode' in error) {
      const pdfError = error as PDFExtractionError;
      return NextResponse.json({ 
        error: pdfError.error,
        details: pdfError.details 
      }, { status: pdfError.statusCode });
    }

    return NextResponse.json({ 
      error: "An unexpected error occurred while processing the PDF",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
