import type { AxiosRequestConfig, AxiosResponse } from "axios";
import client from "./client";

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base API service providing typed request methods.
 * All responses follow the { success, data, error } envelope.
 */
export class BaseApiService {
  protected prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  protected url(path: string): string {
    return `${this.prefix}${path}`;
  }

  protected async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<ApiEnvelope<T>> = await client.get(this.url(path), config);
    return this.unwrap(res);
  }

  protected async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<ApiEnvelope<T>> = await client.post(this.url(path), data, config);
    return this.unwrap(res);
  }

  protected async patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<ApiEnvelope<T>> = await client.patch(this.url(path), data, config);
    return this.unwrap(res);
  }

  protected async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const res: AxiosResponse<ApiEnvelope<T>> = await client.delete(this.url(path), config);
    return this.unwrap(res);
  }

  private unwrap<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
    const body = res.data;
    if (!body.success) {
      throw new Error(body.error ?? "API request failed");
    }
    return body.data as T;
  }
}
