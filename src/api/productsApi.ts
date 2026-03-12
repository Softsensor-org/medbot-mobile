import { BaseApiService } from "./BaseApiService";
import type { LabelExtractionResponse } from "../types/product-label";
import type {
  Product,
  UserProduct,
  UserProductCreate,
  SafetyAssessmentRequest,
  SafetyAssessmentResponse,
} from "../types/medical";

class ProductsApiService extends BaseApiService {
  constructor() {
    super("/api/v1/products");
  }

  async extractLabel(imageBase64: string): Promise<LabelExtractionResponse> {
    return this.post<LabelExtractionResponse>("/extract-label", {
      image_base64: imageBase64,
    });
  }

  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>("/");
  }

  async getProduct(productId: number): Promise<Product> {
    return this.get<Product>(`/${productId}`);
  }

  async getUserProducts(): Promise<UserProduct[]> {
    return this.get<UserProduct[]>("/user");
  }

  async addUserProduct(payload: UserProductCreate): Promise<UserProduct> {
    return this.post<UserProduct>("/user", payload);
  }

  async removeUserProduct(userProductId: number): Promise<void> {
    return this.delete<void>(`/user/${userProductId}`);
  }

  async checkSafety(req: SafetyAssessmentRequest): Promise<SafetyAssessmentResponse> {
    return this.post<SafetyAssessmentResponse>("/safety-check", req);
  }
}

export const productsApi = new ProductsApiService();
