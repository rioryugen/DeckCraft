/**
 * DeckCraft API Client
 * Author: RioRyuGen
 * Date: 2026-05-22
 */

import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface GenerateRequest {
  content: string;
  n_slides?: number;
  language?: string;
  template?: string;
  tone?: string;
  verbosity?: string;
  export_as?: 'pptx' | 'pdf';
  include_title_slide?: boolean;
  include_table_of_contents?: boolean;
}

export interface Presentation {
  id: string;
  title?: string;
  n_slides?: number;
  created_at?: string;
}

export interface GenerateResponse {
  id: string;
  status: string;
  file_path?: string;
  download_url?: string;
}

export class DeckCraftClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('deckcraft');
    this.baseUrl = config.get<string>('serverUrl', 'http://localhost:8000');
    this.username = config.get<string>('username', '');
    this.password = '';
  }

  setCredentials(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private getAuthHeader(): string | undefined {
    if (this.username && this.password) {
      const encoded = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      return `Basic ${encoded}`;
    }
    return undefined;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const auth = this.getAuthHeader();
    if (auth) {
      headers['Authorization'] = auth;
    }

    const payload = body ? JSON.stringify(body) : undefined;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    return new Promise<T>((resolve, reject) => {
      const req = lib.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method,
          headers,
          timeout: 120000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data) as T);
              } catch {
                resolve(data as unknown as T);
              }
            } else if (res.statusCode === 401) {
              reject(new Error('Authentication failed. Check your credentials.'));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          });
        }
      );

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.request<unknown>('GET', '/api/v1/auth/status');
      return true;
    } catch {
      return false;
    }
  }

  async generatePresentation(params: GenerateRequest): Promise<GenerateResponse> {
    return this.request<GenerateResponse>('POST', '/api/v1/ppt/presentation/generate', params);
  }

  async listPresentations(): Promise<Presentation[]> {
    return this.request<Presentation[]>('GET', '/api/v1/ppt/presentation/all');
  }

  async getPresentation(id: string): Promise<Presentation> {
    return this.request<Presentation>('GET', `/api/v1/ppt/presentation/${id}`);
  }

  async deletePresentation(id: string): Promise<void> {
    await this.request<unknown>('DELETE', `/api/v1/ppt/presentation/${id}`);
  }
}
