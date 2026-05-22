/**
 * DeckCraft VS Code Extension
 * Main extension entry point with commands and MCP server integration.
 * Author: RioRyuGen
 * Date: 2026-05-22
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DeckCraftClient } from './client';
import { McpServer } from './mcp-server';

let client: DeckCraftClient;
let mcpServer: McpServer;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('DeckCraft');
  client = new DeckCraftClient();

  const config = vscode.workspace.getConfiguration('deckcraft');
  const mcpPort = config.get<number>('mcpPort', 3099);
  mcpServer = new McpServer(client, mcpPort);

  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(file-media) DeckCraft';
  statusBarItem.command = 'deckcraft.generatePresentation';
  statusBarItem.tooltip = 'DeckCraft - AI Presentation Generator';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('deckcraft.generatePresentation', handleGenerate),
    vscode.commands.registerCommand('deckcraft.generateFromSelection', handleGenerateFromSelection),
    vscode.commands.registerCommand('deckcraft.generateFromFile', handleGenerateFromFile),
    vscode.commands.registerCommand('deckcraft.listPresentations', handleListPresentations),
    vscode.commands.registerCommand('deckcraft.setServerUrl', handleSetServerUrl),
    vscode.commands.registerCommand('deckcraft.startMcpServer', handleStartMcpServer),
  );

  // Auto-start MCP server if configured
  if (config.get<boolean>('autoStartMcp', false)) {
    handleStartMcpServer();
  }

  outputChannel.appendLine('DeckCraft extension activated');
}

export function deactivate() {
  if (mcpServer && mcpServer.isRunning()) {
    mcpServer.stop();
    outputChannel.appendLine('MCP server stopped');
  }
}

async function handleGenerate() {
  const content = await vscode.window.showInputBox({
    prompt: 'What should the presentation be about?',
    placeHolder: 'e.g., Benefits of Remote Work, Introduction to Machine Learning...',
    ignoreFocusOut: true,
  });

  if (!content) {
    return;
  }

  await generatePresentation(content);
}

async function handleGenerateFromSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor');
    return;
  }

  const selection = editor.document.getText(editor.selection);
  if (!selection) {
    vscode.window.showWarningMessage('No text selected');
    return;
  }

  await generatePresentation(selection);
}

async function handleGenerateFromFile(uri: vscode.Uri) {
  let filePath: string;

  if (uri) {
    filePath = uri.fsPath;
  } else {
    const files = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { 'Text Files': ['md', 'txt', 'text'] },
    });
    if (!files || files.length === 0) {
      return;
    }
    filePath = files[0].fsPath;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.trim()) {
    vscode.window.showWarningMessage('File is empty');
    return;
  }

  await generatePresentation(content);
}

async function generatePresentation(content: string) {
  const config = vscode.workspace.getConfiguration('deckcraft');

  // Check if we need credentials
  const connected = await client.checkConnection();
  if (!connected) {
    const proceed = await promptForCredentials();
    if (!proceed) {
      return;
    }
  }

  // Ask for slide count
  const slideCountStr = await vscode.window.showInputBox({
    prompt: 'Number of slides',
    value: config.get<number>('defaultSlideCount', 5).toString(),
    validateInput: (v) => {
      const n = parseInt(v);
      return (n >= 1 && n <= 30) ? null : 'Enter a number between 1 and 30';
    },
  });

  if (!slideCountStr) {
    return;
  }

  const tone = await vscode.window.showQuickPick(
    ['professional', 'formal', 'casual', 'enthusiastic', 'informative'],
    { placeHolder: 'Select presentation tone' }
  );

  if (!tone) {
    return;
  }

  const nSlides = parseInt(slideCountStr);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'DeckCraft: Generating presentation...',
      cancellable: false,
    },
    async (progress) => {
      try {
        progress.report({ message: 'Sending request to DeckCraft server...' });

        const result = await client.generatePresentation({
          content,
          n_slides: nSlides,
          language: 'English',
          template: config.get<string>('defaultTemplate', 'general'),
          tone,
          verbosity: 'standard',
          export_as: 'pptx',
        });

        outputChannel.appendLine(`Presentation generated: ${JSON.stringify(result)}`);

        const action = await vscode.window.showInformationMessage(
          `Presentation generated successfully! (ID: ${result.id})`,
          'Open Output',
          'Copy ID'
        );

        if (action === 'Open Output') {
          outputChannel.show();
        } else if (action === 'Copy ID') {
          await vscode.env.clipboard.writeText(result.id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        outputChannel.appendLine(`Error: ${message}`);
        vscode.window.showErrorMessage(`DeckCraft: ${message}`);
      }
    }
  );
}

async function handleListPresentations() {
  try {
    const presentations = await client.listPresentations();

    if (!presentations || presentations.length === 0) {
      vscode.window.showInformationMessage('No presentations found');
      return;
    }

    const items = presentations.map((p) => ({
      label: p.title || `Presentation ${p.id.substring(0, 8)}`,
      description: p.id,
      detail: `Slides: ${p.n_slides || '?'} | Created: ${p.created_at || 'unknown'}`,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a presentation',
    });

    if (selected) {
      await vscode.env.clipboard.writeText(selected.description);
      vscode.window.showInformationMessage(`Copied ID: ${selected.description}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`DeckCraft: ${message}`);
  }
}

async function handleSetServerUrl() {
  const config = vscode.workspace.getConfiguration('deckcraft');
  const current = config.get<string>('serverUrl', 'http://localhost:8000');

  const url = await vscode.window.showInputBox({
    prompt: 'DeckCraft Server URL',
    value: current,
    placeHolder: 'http://localhost:8000',
    validateInput: (v) => {
      try {
        new URL(v);
        return null;
      } catch {
        return 'Enter a valid URL';
      }
    },
  });

  if (url) {
    await config.update('serverUrl', url, vscode.ConfigurationTarget.Global);
    client.setBaseUrl(url);
    vscode.window.showInformationMessage(`DeckCraft server set to: ${url}`);
  }
}

async function handleStartMcpServer() {
  if (mcpServer.isRunning()) {
    vscode.window.showInformationMessage('MCP server is already running');
    return;
  }

  try {
    const port = await mcpServer.start();
    statusBarItem.text = '$(file-media) DeckCraft [MCP]';
    outputChannel.appendLine(`MCP server started on port ${port}`);
    vscode.window.showInformationMessage(
      `DeckCraft MCP server running on http://127.0.0.1:${port}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to start MCP server: ${message}`);
  }
}

async function promptForCredentials(): Promise<boolean> {
  const username = await vscode.window.showInputBox({
    prompt: 'DeckCraft username (leave empty if auth is disabled)',
    placeHolder: 'username',
  });

  if (username === undefined) {
    return false;
  }

  if (!username) {
    // Auth might be disabled, proceed without credentials
    return true;
  }

  const password = await vscode.window.showInputBox({
    prompt: 'DeckCraft password',
    password: true,
  });

  if (password === undefined) {
    return false;
  }

  client.setCredentials(username, password);
  return true;
}
