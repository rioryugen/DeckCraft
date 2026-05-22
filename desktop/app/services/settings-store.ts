// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import path from 'path';
import fs from 'fs';
import { getUserDataDir } from '../utils/constants';


class SettingsStore {
  private settingsPath: string | undefined;
  private settings: { [key: string]: any };
  private loaded = false;

  constructor() {
    this.settings = {};
  }

  private getSettingsPath(): string {
    if (!this.settingsPath) {
      this.settingsPath = path.join(getUserDataDir(), 'settings.json');
    }
    return this.settingsPath;
  }

  private loadSettings() {
    if (this.loaded) {
      return;
    }
    this.loaded = true;

    try {
      const settingsPath = this.getSettingsPath();
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        this.settings = JSON.parse(data);

      } else {
        this.settings = {};
        this.saveSettings();

      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = {};
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.getSettingsPath(), JSON.stringify(this.settings, null, 2));

    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  get(key: string, defaultValue: any = null): any {
    this.loadSettings();
    const value = this.settings[key];

    return value || defaultValue;
  }

  set(key: string, value: any): void {
    this.loadSettings();

    this.settings[key] = value;
    this.saveSettings();
  }

  // Helper method to check if settings exist
  has(key: string): boolean {
    this.loadSettings();
    return key in this.settings;
  }

  // Helper method to delete a setting
  delete(key: string): void {
    this.loadSettings();
    delete this.settings[key];
    this.saveSettings();
  }
}

// Export a singleton instance
export const settingsStore = new SettingsStore(); 