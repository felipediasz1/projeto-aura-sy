import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios/dist/node/axios.cjs';
import FormData from 'form-data';
import { AgentConfig } from '@aura-sync/shared';

export class FileUploader {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async uploadFile(filePath: string, relativePath: string, mtime: number, size: number, machineName: string, localUser: string): Promise<void> {
    const stream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('file', stream);
    formData.append('companyId', this.config.companyId);
    formData.append('machineId', this.config.machineId);
    formData.append('machineName', machineName);
    formData.append('localUser', localUser);
    formData.append('relativePath', relativePath);
    formData.append('mtime', mtime.toString());
    formData.append('size', size.toString());

    const maxRetries = 4;
    let attempt = 0;
    let delay = 1000;

    while (attempt <= maxRetries) {
      try {
        await axios.post(`${this.config.serverUrl}/upload`, formData, {
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Client-ID': this.config.companyId,
            'Machine-Name': machineName,
            ...formData.getHeaders()
          },
          timeout: 300000
        });
        return;
      } catch (error) {
        attempt += 1;
        if (attempt > maxRetries) {
          const errMsg = error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
          console.error(`Failed to upload ${filePath} after ${maxRetries} retries:`, errMsg);
          throw error;
        }
        console.warn(`Retry ${attempt}/${maxRetries} for ${filePath} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
}