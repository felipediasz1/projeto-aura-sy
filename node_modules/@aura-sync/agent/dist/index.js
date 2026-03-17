"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraSyncAgent = void 0;
const scanner_1 = require("./scanner");
const uploader_1 = require("./uploader");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const child_process_1 = require("child_process");
const APP_DIR = path.join(os.homedir(), '.aura-sync');
const CONFIG_FILE = path.join(APP_DIR, 'config.json');
const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
function normalizePath(inputPath) {
    return path.normalize(inputPath.replace(/^"|"$/g, '')).trim();
}
function prompt(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
function ensureAppDir() {
    if (!fs.existsSync(APP_DIR)) {
        fs.mkdirSync(APP_DIR, { recursive: true });
    }
}
async function createConfigInteractive() {
    console.log('Aura Sync - First-time setup');
    const serverUrl = await prompt('Server URL (ex: https://aura-sync.example.com): ');
    const token = await prompt('API Key / Token: ');
    const companyId = await prompt('Company ID: ');
    const machineId = await prompt('Machine ID: ');
    const scanFolder = await prompt('Local folder to monitor (ex: C:\\Users\\User\\Documents): ');
    const config = {
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
function loadConfig() {
    if (!fs.existsSync(CONFIG_FILE))
        return null;
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.scanPaths = parsed.scanPaths.map(normalizePath);
        parsed.machineName = parsed.machineName || os.hostname();
        parsed.localUser = parsed.localUser || os.userInfo().username;
        parsed.scanIntervalSeconds = parsed.scanIntervalSeconds || 60;
        return parsed;
    }
    catch (err) {
        console.error('Unable to parse config file', err);
        return null;
    }
}
function ensureAutoStart(exePath) {
    if (process.platform !== 'win32')
        return;
    const valueName = 'AuraSyncAgent';
    const command = `reg add "${RUN_KEY}" /v "${valueName}" /t REG_SZ /d "\"${exePath}\" --background" /f`;
    (0, child_process_1.exec)(command, (err, stdout, stderr) => {
        if (err) {
            console.error('Auto-start registration failed (requires permissions):', err.message || stderr);
        }
        else {
            console.log('Auto-start registered to Windows startup.');
        }
    });
}
function setLowPriority() {
    try {
        if (process.platform === 'win32') {
            // Windows priority adjustment not directly typed in Node definitions.
            // We'll keep this as a best-effort no-op in TypeScript.
        }
    }
    catch {
        // ignore
    }
}
class AuraSyncAgent {
    constructor(config) {
        this.config = config;
        this.scanner = new scanner_1.FileScanner(config);
        this.uploader = new uploader_1.FileUploader(config);
    }
    async runSync() {
        setLowPriority();
        console.log(`[AuraSync] Running sync for machine ${this.config.machineName}`);
        const { filesToUpload, totalFiles } = await this.scanner.scanAndCompare();
        console.log(`[AuraSync] Scanned ${totalFiles} files. ${filesToUpload.length} changes found.`);
        for (const file of filesToUpload) {
            try {
                await this.uploader.uploadFile(file.path, file.relativePath, file.mtime, file.size, this.config.machineName, this.config.localUser);
                console.log(`Uploaded: ${file.relativePath} (${file.changeType})`);
            }
            catch (err) {
                console.error(`Upload failed for ${file.relativePath}:`, err);
            }
        }
        console.log('[AuraSync] Sync cycle complete.');
    }
}
exports.AuraSyncAgent = AuraSyncAgent;
function startWatchdog(intervalSeconds = 60) {
    setInterval(() => {
        if (!fs.existsSync(CONFIG_FILE)) {
            console.warn('[Watchdog] Config file missing; agent may need reconfiguration.');
            return;
        }
        try {
            fs.accessSync(CONFIG_FILE, fs.constants.R_OK);
        }
        catch (err) {
            console.warn('[Watchdog] Config file unreadable:', err);
        }
        // Keep a lightweight heartbeat file for local monitoring.
        try {
            fs.writeFileSync(path.join(APP_DIR, 'watchdog.heartbeat'), new Date().toISOString(), { encoding: 'utf-8' });
        }
        catch (err) {
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
        }
        catch (err) {
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
