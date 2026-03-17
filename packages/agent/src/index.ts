import { FileScanner } from './scanner';
import { FileUploader } from './uploader';
import { AgentConfig } from '@aura-sync/shared';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import { exec } from 'child_process';

const APP_DIR = path.join(os.homedir(), '.aura-sync');
const CONFIG_FILE = path.join(APP_DIR, 'config.json');
const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

export interface LocalAgentConfig extends AgentConfig {
  machineName: string;
  localUser: string;
  scanIntervalSeconds: number;
}

function normalizePath(inputPath: string): string {
  return path.normalize(inputPath.replace(/^"|"$/g, '')).trim();
}

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function ensureAppDir(): void {
  if (!fs.existsSync(APP_DIR)) {
    fs.mkdirSync(APP_DIR, { recursive: true });
  }
}

async function createConfigInteractive(): Promise<LocalAgentConfig> {
  console.log('Aura Sync - First-time setup');
  const serverUrl = await prompt('Server URL (ex: https://aura-sync.example.com): ');
  const token = await prompt('API Key / Token: ');
  const companyId = await prompt('Company ID: ');
  const machineId = await prompt('Machine ID: ');
  const scanFolder = await prompt('Local folder to monitor (ex: C:\\Users\\User\\Documents): ');

  const config: LocalAgentConfig = {
    serverUrl: normalizePath(serverUrl || 'http://localhost:3000'),
    token: token || 'valid-token',
    companyId: companyId || '1',
    machineId: machineId || 'm1',
    scanPaths: [normalizePath(scanFolder || path.join(os.homedir(), 'Documents'))],
    machineName: os.hostname(),
    localUser: os.userInfo().username,
    scanIntervalSeconds: 60
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o600 });
  console.log(`Config saved to ${CONFIG_FILE}`);
  return config;
}

function loadConfig(): LocalAgentConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as LocalAgentConfig;
    parsed.scanPaths = parsed.scanPaths.map(normalizePath);
    parsed.machineName = parsed.machineName || os.hostname();
    parsed.localUser = parsed.localUser || os.userInfo().username;
    parsed.scanIntervalSeconds = parsed.scanIntervalSeconds || 60;
    return parsed;
  } catch (err) {
    console.error('Unable to parse config file', err);
    return null;
  }
}

function ensureAutoStart(exePath: string): void {
  if (process.platform !== 'win32') return;

  const valueName = 'AuraSyncAgent';
  const command = `reg add "${RUN_KEY}" /v "${valueName}" /t REG_SZ /d "\"${exePath}\" --background" /f`;
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Auto-start registration failed (requires permissions):', err.message || stderr);
    } else {
      console.log('Auto-start registered to Windows startup.');
    }
  });
}

function setLowPriority(): void {
  try {
    if (process.platform === 'win32') {
      // Windows priority adjustment not directly typed in Node definitions.
      // We'll keep this as a best-effort no-op in TypeScript.
    }
  } catch {
    // ignore
  }
}

export class AuraSyncAgent {
  private scanner: FileScanner;
  private uploader: FileUploader;
  private config: LocalAgentConfig;

  constructor(config: LocalAgentConfig) {
    this.config = config;
    this.scanner = new FileScanner(config);
    this.uploader = new FileUploader(config);
  }

  async runSync(): Promise<void> {
    setLowPriority();
    console.log(`[AuraSync] Running sync for machine ${this.config.machineName}`);

    const { filesToUpload, totalFiles } = await this.scanner.scanAndCompare();
    console.log(`[AuraSync] Scanned ${totalFiles} files. ${filesToUpload.length} changes found.`);

    for (const file of filesToUpload) {
      try {
        await this.uploader.uploadFile(file.path, file.relativePath, file.mtime, file.size, this.config.machineName, this.config.localUser);
        console.log(`Uploaded: ${file.relativePath} (${file.changeType})`);
      } catch (err) {
        console.error(`Upload failed for ${file.relativePath}:`, err);
      }
    }

    console.log('[AuraSync] Sync cycle complete.');
  }
}

function startWatchdog(intervalSeconds: number = 60): void {
  setInterval(() => {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.warn('[Watchdog] Config file missing; agent may need reconfiguration.');
      return;
    }
    try {
      fs.accessSync(CONFIG_FILE, fs.constants.R_OK);
    } catch (err) {
      console.warn('[Watchdog] Config file unreadable:', err);
    }
    // Keep a lightweight heartbeat file for local monitoring.
    try {
      fs.writeFileSync(path.join(APP_DIR, 'watchdog.heartbeat'), new Date().toISOString(), { encoding: 'utf-8' });
    } catch (err) {
      console.warn('[Watchdog] Failed to write heartbeat:', err);
    }
  }, intervalSeconds * 1000);
}

async function bootstrap() {
  ensureAppDir();

  let config = loadConfig();
  if (!config) {
    config = await createConfigInteractive();
  }

  if (process.platform === 'win32') {
    ensureAutoStart(process.execPath);
  }

  const agent = new AuraSyncAgent(config);
  await agent.runSync();

  const interval = Math.max(30, config.scanIntervalSeconds || 60);
  startWatchdog(interval);

  setInterval(async () => {
    try {
      await agent.runSync();
    } catch (err) {
      console.error('Periodic sync error:', err);
    }
  }, interval * 1000);
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Startup failed:', err);
    process.exit(1);
  });
}
