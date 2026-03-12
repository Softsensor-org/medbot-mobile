/** IMP-243: LLM-powered product label extraction types */

export interface ExtractedIngredient {
  name: string;
  inci_name?: string;
  category?: string;
  concentration_hint?: string;
}

export interface LabelExtractionResult {
  brand?: string;
  product_name?: string;
  category?: string;
  ingredients: ExtractedIngredient[];
  usage_instructions?: string;
  warnings: string[];
  active_compounds: string[];
  confidence: number;
}

export interface InteractionFlag {
  ingredient_name: string;
  severity: "low" | "moderate" | "high";
  reason: string;
  recommendation: string;
}

export interface LabelExtractionResponse {
  extraction: LabelExtractionResult;
  interaction_flags: InteractionFlag[];
  product_id?: number;
}
