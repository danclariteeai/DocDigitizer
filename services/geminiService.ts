import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedItem, DocumentType } from '../types';

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

// Define Schemas for different types to ensure consistent JSON output
const SCHEMAS: Record<DocumentType, Schema> = {
  BOM: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        partNumber: { type: Type.STRING },
        description: { type: Type.STRING },
        quantity: { type: Type.STRING },
        unit: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ["partNumber", "description", "quantity"],
    },
  },
  INVOICE: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        Vendor: { type: Type.STRING },
        itemCode: { type: Type.STRING },
        description: { type: Type.STRING },
        quantity: { type: Type.STRING },
        unitPrice: { type: Type.STRING },
        total: { type: Type.STRING },
      },
      required: ["description", "total"],
    },
  },
  PO: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sku: { type: Type.STRING },
        description: { type: Type.STRING },
        quantity: { type: Type.STRING },
        unitCost: { type: Type.STRING },
        lineTotal: { type: Type.STRING },
      },
      required: ["description", "quantity", "lineTotal"],
    },
  },
  OTHER: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        col1: { type: Type.STRING },
        col2: { type: Type.STRING },
        col3: { type: Type.STRING },
        col4: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
    },
  }
};

export interface FileInput {
  base64: string;
  mimeType: string;
}

export const transcribeDocument = async (
  files: FileInput[],
  docType: DocumentType,
  customPrompt: string
): Promise<ExtractedItem[]> => {
  const ai = getGeminiClient();

  try {
    // Construct parts from all files
    const fileParts = files.map(file => ({
      inlineData: {
        mimeType: file.mimeType,
        data: file.base64,
      },
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          ...fileParts,
          {
            text: `${customPrompt}
            
            Analyze ALL provided images/pages as a single logical document. Consolidate the data into one table.
            Return the result strictly as a JSON array matching the schema provided. 
            Ensure all values are strings. If a field is missing, use an empty string.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SCHEMAS[docType],
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) return [];

    const rawData = JSON.parse(text);
    
    // Add unique IDs for React rendering
    return rawData.map((item: any) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw new Error("Failed to transcribe the documents. Please ensure the images are clear.");
  }
};