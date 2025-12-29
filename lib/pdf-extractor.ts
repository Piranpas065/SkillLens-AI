/**
 * PDF Extraction Helper Module
 * Contains all functions and types for validating and extracting text from PDF files
 */

// Type definition for PDF file validation results
export interface PDFValidationResult {
  valid: boolean;
  error?: string;
}

// Type definition for successful PDF extraction results
export interface PDFExtractionResult {
  text: string;
  metadata: {
    originalLength: number;
    sanitizedLength: number;
    pageCount: number;
    fileSize: number;
    fileName: string;
  };
}

// Type definition for PDF extraction errors with HTTP status codes
export interface PDFExtractionError {
  error: string;
  details?: string;
  statusCode: number;
}

/**
 * Validates PDF file before processing
 * Checks file existence, size, type, and extension
 * @param file - The file to validate
 * @returns Validation result with success status and error message if invalid
 */
export function validatePDFFile(file: File): PDFValidationResult {
  // Check if file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Validate file size (maximum 10MB to prevent memory issues)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: "File too large. Maximum size is 10MB" };
  }

  // Check for empty files
  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  // Validate MIME type
  const validTypes = ["application/pdf"];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Only PDF files are supported" };
  }

  // Validate file extension as additional security measure
  const validExtensions = ['.pdf'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!validExtensions.includes(fileExtension)) {
    return { valid: false, error: "Invalid file extension. Only .pdf files are supported" };
  }

  // All validations passed
  return { valid: true };
}

/**
 * Sanitizes extracted text by removing problematic characters and normalizing formatting
 * Handles encoding issues, line breaks, and control characters
 * @param text - Raw text extracted from PDF
 * @returns Clean, sanitized text ready for display/processing
 */
export function sanitizeText(text: string): string {
  // Return empty string if input is invalid
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Normalize line breaks to single spaces
    .replace(/\r?\n|\r/g, " ")
    // Keep only ASCII and extended Latin characters (remove emojis, symbols, etc.)
    .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, "")
    // Collapse multiple whitespace characters into single spaces
    .replace(/\s+/g, " ")
    // Remove leading and trailing whitespace
    .trim()
    // Fix common encoding issues from PDF extraction
    .replace(/â€™/g, "'")    // Fix apostrophes
    .replace(/â€œ/g, '"')    // Fix opening quotes
    .replace(/â€/g, '"')     // Fix closing quotes
    .replace(/â€"/g, "–")    // Fix en-dash
    .replace(/â€"/g, "—")    // Fix em-dash
    // Remove null bytes that can cause display issues
    .replace(/\0/g, "")
    // Remove other control characters (except tabs and normal spaces)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Main function to extract text from PDF files
 * Handles the complete workflow: validation, extraction, sanitization, and metadata generation
 * @param file - PDF file to extract text from
 * @returns Promise with extracted text and metadata
 * @throws PDFExtractionError with appropriate status codes for different error types
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  // First, validate the file meets our requirements
  const validation = validatePDFFile(file);
  if (!validation.valid) {
    throw {
      error: validation.error,
      statusCode: 400
    } as PDFExtractionError;
  }

  try {
    // Import PDF extraction library (using eval to avoid bundling issues)
    const pdfExtract = eval('require')('pdf-text-extract');
    
    // Convert file to buffer for processing
    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify the file is actually a PDF by checking the header
    const pdfHeader = buffer.slice(0, 4).toString();
    if (!pdfHeader.includes('%PDF')) {
      throw {
        error: "File does not appear to be a valid PDF",
        statusCode: 400
      } as PDFExtractionError;
    }

    // Import Node.js modules for file operations
    const fs = eval('require')('fs');
    const path = eval('require')('path');
    const os = eval('require')('os');
    
    // Create temporary file path (pdf-text-extract requires file path, not buffer)
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`);
    
    // Write buffer to temporary file for extraction
    fs.writeFileSync(tempFilePath, buffer);
    
    // Extract text using pdf-text-extract library
    const extractText = (): Promise<{ text: string; numpages: number }> => {
      return new Promise((resolve, reject) => {
        pdfExtract(tempFilePath, (err: any, pages: string[]) => {
          // Always clean up temporary file regardless of success/failure
          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupError) {
            console.warn('Could not delete temp file:', cleanupError);
          }
          
          // Handle extraction results
          if (err) {
            reject(err);
          } else {
            // Join all pages into single text string
            resolve({ text: pages.join(' '), numpages: pages.length });
          }
        });
      });
    };
    
    // Perform the actual text extraction
    const data = await extractText();

    // Validate that extraction returned usable text
    if (!data || !data.text || typeof data.text !== 'string') {
      throw {
        error: "Could not extract text from PDF. The file might be image-based or corrupted.",
        statusCode: 400
      } as PDFExtractionError;
    }

    // Store raw text before sanitization for comparison
    const rawText = data.text;
    
    // Clean and sanitize the extracted text
    const sanitizedText = sanitizeText(rawText);

    // Ensure we have meaningful content after sanitization (minimum 10 characters)
    if (!sanitizedText || sanitizedText.length < 10) {
      throw {
        error: "PDF appears to contain no readable text or only images. Please ensure your CV contains selectable text.",
        statusCode: 400
      } as PDFExtractionError;
    }

    // Return successful extraction result with text and metadata
    return {
      text: sanitizedText,
      metadata: {
        originalLength: rawText.length,        // Length before cleaning
        sanitizedLength: sanitizedText.length, // Length after cleaning
        pageCount: data.numpages || 1,         // Number of pages processed
        fileSize: file.size,                   // Original file size in bytes
        fileName: file.name                    // Original filename
      }
    };

  } catch (error) {
    console.error("PDF parsing error:", error);
    
    // If error is already structured (thrown from validation or processing), re-throw as-is
    if (error && typeof error === 'object' && 'error' in error && 'statusCode' in error) {
      throw error;
    }
    
    // Handle unexpected errors and provide user-friendly messages
    let errorMessage = "Failed to parse PDF";
    let statusCode = 500;

    // Check for specific error patterns and provide appropriate messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        errorMessage = "Invalid or corrupted PDF file";
        statusCode = 400;
      } else if (error.message.includes('password')) {
        errorMessage = "Password-protected PDFs are not supported";
        statusCode = 400;
      } else if (error.message.includes('encrypted')) {
        errorMessage = "Encrypted PDFs are not supported";
        statusCode = 400;
      }
    }

    // Throw structured error with appropriate HTTP status code
    throw {
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error",
      statusCode
    } as PDFExtractionError;
  }
}