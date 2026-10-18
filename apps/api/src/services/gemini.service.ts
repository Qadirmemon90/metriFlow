import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Product,
  Customer,
  OrderDraft,
} from '../database/models/index.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

export interface ExtractionInput {
  sourceType: 'WHATSAPP_TEXT' | 'WHATSAPP_VOICE' | 'MANUAL';
  sourceMessageId?: string;
  rawText: string;
  senderPhone?: string;
  customerId?: string;
  customerName?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.GEMINI_API_KEY && !config.GEMINI_API_KEY.includes('placeholder')) {
      this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
  }

  async extractOrderDraft(tenantId: mongoose.Types.ObjectId, input: ExtractionInput) {
    // 1. Fetch catalog grounding for this tenant
    const catalogProducts = await Product.find({ tenantId, isActive: true, isArchived: false })
      .select('_id sku name defaultPricePaisa baseUnit')
      .limit(200);

    const catalogContext = catalogProducts
      .map((p) => `ID: ${p._id} | SKU: ${p.sku} | Name: ${p.name} | Unit: ${p.baseUnit}`)
      .join('\n');

    let extractedItems: any[] = [];
    let ambiguities: string[] = [];
    let confidenceScore = 0.9;

    // 2. Call Gemini if client is initialized
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: config.GEMINI_MODEL,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });

        const prompt = `
You are an expert wholesale order extraction assistant for a Pakistani wholesaler.
Given a customer's WhatsApp message or voice transcription, extract the requested items, quantities, and units.
GROUNDING CATALOG (Only match against these items):
${catalogContext}

INPUT MESSAGE:
"${input.rawText}"

Return a valid JSON object matching this schema:
{
  "items": [
    {
      "catalogProductId": "matched ID from catalog or empty if unclear",
      "matchedSku": "matched SKU",
      "productName": "product name extracted",
      "quantity": "decimal quantity string, e.g. 10",
      "unit": "Piece, Box, or Carton",
      "confidence": 0.0 to 1.0,
      "ambiguityNote": "any doubt or note"
    }
  ],
  "ambiguities": ["list of any ambiguities like unclear SKU, unknown unit, etc."],
  "confidenceScore": 0.0 to 1.0
}
        `;

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        const parsed = JSON.parse(text);

        extractedItems = parsed.items || [];
        ambiguities = parsed.ambiguities || [];
        confidenceScore = parsed.confidenceScore ?? 0.85;
      } catch (err: any) {
        console.warn('[GeminiService] Gemini extraction failed, falling back to heuristic parser:', err.message);
        const fallback = this.fallbackHeuristicExtraction(input.rawText, catalogProducts);
        extractedItems = fallback.items;
        ambiguities = fallback.ambiguities;
      }
    } else {
      // Fallback heuristic extraction
      const fallback = this.fallbackHeuristicExtraction(input.rawText, catalogProducts);
      extractedItems = fallback.items;
      ambiguities = fallback.ambiguities;
    }

    // 3. Create reviewable OrderDraft proposal
    const draftNumber = `DFT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const draft = await OrderDraft.create({
      tenantId,
      draftNumber,
      sourceType: input.sourceType,
      sourceMessageId: input.sourceMessageId ? new mongoose.Types.ObjectId(input.sourceMessageId) : undefined,
      rawInputText: input.rawText,
      customerId: input.customerId ? new mongoose.Types.ObjectId(input.customerId) : undefined,
      customerPhone: input.senderPhone,
      detectedCustomerName: input.customerName,
      suggestedItems: extractedItems,
      ambiguities,
      confidenceScore,
      status: 'PENDING_REVIEW',
    });

    return draft;
  }

  /**
   * Deterministic catalog matcher when offline or during Gemini outage
   */
  private fallbackHeuristicExtraction(rawText: string, catalogProducts: any[]) {
    const items: any[] = [];
    const ambiguities: string[] = [];

    // Simple line by line check for numbers and product names/SKUs
    const lines = rawText.split(/\n|,/);
    for (const line of lines) {
      const matchNumber = line.match(/\b(\d+(\.\d+)?)\b/);
      const qty = matchNumber ? matchNumber[1] : '1';

      let matchedProduct = null;
      for (const p of catalogProducts) {
        if (
          line.toLowerCase().includes(p.sku.toLowerCase()) ||
          line.toLowerCase().includes(p.name.toLowerCase())
        ) {
          matchedProduct = p;
          break;
        }
      }

      if (matchedProduct) {
        items.push({
          catalogProductId: matchedProduct._id.toString(),
          matchedSku: matchedProduct.sku,
          productName: matchedProduct.name,
          quantity: qty,
          unit: matchedProduct.baseUnit || 'Piece',
          confidence: 0.9,
        });
      } else if (line.trim().length > 3) {
        ambiguities.push(`Unmatched line: "${line.trim()}"`);
      }
    }

    return { items, ambiguities };
  }
}

export const geminiService = new GeminiService();
