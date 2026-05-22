/**
 * DeckCraft MCP Server
 * Exposes DeckCraft presentation generation as MCP tools for AI copilots.
 * Author: RioRyuGen
 * Date: 2026-05-22
 */

import * as http from 'http';
import { DeckCraftClient, GenerateRequest } from './client';

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: string;
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

const TOOLS: McpTool[] = [
  {
    name: 'generate_presentation',
    description: 'Generate a professional presentation from a topic or content description. Returns presentation ID and status.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The topic or content to generate a presentation about' },
        n_slides: { type: 'number', description: 'Number of slides (default: 5)' },
        language: { type: 'string', description: 'Output language (default: English)' },
        template: { type: 'string', description: 'Template name (default: general)' },
        tone: { type: 'string', description: 'Tone: default, formal, casual, enthusiastic, informative' },
        verbosity: { type: 'string', description: 'Verbosity: concise, standard, detailed' },
        export_as: { type: 'string', description: 'Export format: pptx or pdf' },
      },
      required: ['content'],
    },
  },
  {
    name: 'list_presentations',
    description: 'List all generated presentations with their IDs and titles.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_presentation',
    description: 'Get details of a specific presentation by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Presentation ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_presentation',
    description: 'Delete a presentation by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Presentation ID' },
      },
      required: ['id'],
    },
  },
];

export class McpServer {
  private server: http.Server | null = null;
  private client: DeckCraftClient;
  private port: number;

  constructor(client: DeckCraftClient, port: number = 3099) {
    this.client = client;
    this.port = port;
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const request: McpRequest = JSON.parse(body);
              const response = await this.handleRequest(request);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(response));
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: 'Parse error' },
              }));
            }
          });
        } else if (req.method === 'GET' && req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', tools: TOOLS.length }));
        } else {
          res.writeHead(405);
          res.end();
        }
      });

      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        resolve(this.port);
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  private async handleRequest(request: McpRequest): Promise<McpResponse> {
    const { method, params, id } = request;

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'deckcraft-mcp', version: '1.0.0' },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: { tools: TOOLS },
        };

      case 'tools/call':
        return await this.handleToolCall(id, params as { name: string; arguments: Record<string, unknown> });

      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  }

  private async handleToolCall(
    id: number | string,
    params: { name: string; arguments: Record<string, unknown> }
  ): Promise<McpResponse> {
    const { name, arguments: args } = params;

    try {
      let result: unknown;

      switch (name) {
        case 'generate_presentation': {
          const request: GenerateRequest = {
            content: args.content as string,
            n_slides: args.n_slides as number | undefined,
            language: (args.language as string) || 'English',
            template: (args.template as string) || 'general',
            tone: (args.tone as string) || 'professional',
            verbosity: (args.verbosity as string) || 'standard',
            export_as: (args.export_as as 'pptx' | 'pdf') || 'pptx',
          };
          result = await this.client.generatePresentation(request);
          break;
        }

        case 'list_presentations':
          result = await this.client.listPresentations();
          break;

        case 'get_presentation':
          result = await this.client.getPresentation(args.id as string);
          break;

        case 'delete_presentation':
          await this.client.deletePresentation(args.id as string);
          result = { success: true };
          break;

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Unknown tool: ${name}` },
          };
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        },
      };
    }
  }
}
