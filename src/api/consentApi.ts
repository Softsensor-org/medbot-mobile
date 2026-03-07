import { BaseApiService } from "./BaseApiService";
import type {
  ConsentType,
  ConsentRecord,
  ConsentRecordRequest,
  ConsentStatusDashboard,
} from "../types/consent";

class ConsentApiService extends BaseApiService {
  constructor() {
    super("/api/v1/consent");
  }

  async getTypes(): Promise<ConsentType[]> {
    return this.get<ConsentType[]>("/types");
  }

  async getStatus(): Promise<ConsentStatusDashboard> {
    return this.get<ConsentStatusDashboard>("/status");
  }

  async getUserRecords(): Promise<ConsentRecord[]> {
    return this.get<ConsentRecord[]>("/user");
  }

  async recordConsent(request: ConsentRecordRequest): Promise<ConsentRecord> {
    return this.post<ConsentRecord>("/record", request);
  }
}

export const consentApi = new ConsentApiService();
