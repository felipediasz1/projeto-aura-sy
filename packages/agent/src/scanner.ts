import * as fs from 'fs';
import * as path from 'path';
import * as micromatch from 'micromatch';
import { FileInfo, AgentConfig, ModifiedFile, FileChangeType } from '@aura-sync/shared';

export class FileScanner {
  private config: AgentConfig;
  private stateFile: string;

  constructor(config: AgentConfig) {
    this.config = config;
    this.stateFile = path.join(process.cwd(), `.aura-state-${config.companyId}-${config.machineId}.json`);
  }

  async scanAndCompare(): Promise<{ filesToUpload: ModifiedFile[]; totalFiles: number }> {
    const currentFiles = await this.scanDirectories();
    const previousState = await this.loadPreviousState();

    const filesToUpload: ModifiedFile[] = [];

    for (const file of currentFiles) {
      const prev = previousState[file.path];
      let changeType: FileChangeType = 'unchanged';

      if (!prev) {
        changeType = 'new';
      } else if (prev.mtime !== file.mtime || prev.size !== file.size) {
        changeType = 'modified';
      }

      if (changeType !== 'unchanged') {
        filesToUpload.push({
          path: file.path,
          relativePath: path.relative(this.config.scanPaths[0], file.path),
          mtime: file.mtime,
          size: file.size,
          changeType
        });
      }
    }

    await this.saveState(currentFiles);
    return { filesToUpload, totalFiles: currentFiles.length };
  }

  private async scanDirectories(): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    for (const scanPath of this.config.scanPaths) {
      // Resolve the root path to ensure it's absolute for reliable comparison
      const rootScanPath = path.resolve(scanPath);
      await this.scanDirectory(scanPath, rootScanPath, files);
    }

    return files;
  }

  private async scanDirectory(dirPath: string, rootScanPath: string, files: FileInfo[]): Promise<void> {
    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        // --- Path Traversal Check ---
        const resolvedFullPath = path.resolve(fullPath);
        if (!resolvedFullPath.startsWith(rootScanPath)) {
          console.warn(`[Aura.Scanner] Security Warning: Path traversal attempt detected. ${resolvedFullPath} is outside of the root ${rootScanPath}. Skipping.`);
          continue;
        }
        // --- End of Check ---

        // --- Ignore Check ---
        // Normalizing path to use forward slashes for consistent matching
        const normalizedPath = fullPath.replace(/\\\\/g, '/'); 
        if (this.config.ignorePatterns && micromatch.isMatch(normalizedPath, this.config.ignorePatterns)) {
          // console.debug(`[Aura.Scanner] Ignoring path as it matches ignore patterns: ${fullPath}`);
          continue;
        }
        // --- End of Check ---

        try {
          if (item.isDirectory()) {
            await this.scanDirectory(fullPath, rootScanPath, files);
          } else if (item.isFile()) {
            const stat = await fs.promises.stat(fullPath);
            files.push({
              path: fullPath,
              mtime: stat.mtime.getTime(),
              size: stat.size,
            });
          }
        } catch (err) {
          console.error(`[Aura.Scanner] Error processing path: ${fullPath}. Skipping.`, err);
        }
      }
    } catch (err) {
      console.error(`[Aura.Scanner] Error reading directory: ${dirPath}. Skipping.`, err);
    }
  }

  private async loadPreviousState(): Promise<Record<string, FileInfo>> {
    try {
      const data = await fs.promises.readFile(this.stateFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist or is corrupted, return an empty state.
      // This is expected on the first run.
      console.log(`[Aura.Scanner] State file not found or invalid. Starting fresh.`);
      return {};
    }
  }

  private async saveState(files: FileInfo[]): Promise<void> {
    const state: Record<string, FileInfo> = {};
    for (const file of files) {
      state[file.path] = file;
    }
    try {
      await fs.promises.writeFile(this.stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error(`[Aura.Scanner] Fatal: Could not save state file to ${this.stateFile}.`, error);
    }
  }
}