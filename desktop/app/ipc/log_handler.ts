// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getLogsDir } from '../utils/constants';

export function setupLogHandler() {
  // Ensure logs directory exists
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFilePath = path.join(logsDir, 'nextjs.log');

  // Handle log writing through IPC - non-blocking
  ipcMain.handle('write-nextjs-log', (_, logData: string) => {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${logData}\n`;
      
      // Use non-blocking write
      fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error in log handler:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Handle log clearing
  ipcMain.handle('clear-nextjs-logs', () => {
    try {
      // Create a new empty file, effectively clearing the old one
      fs.writeFile(logFilePath, '', (err) => {
        if (err) {
          console.error('Error clearing log file:', err);
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error in clear logs handler:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
