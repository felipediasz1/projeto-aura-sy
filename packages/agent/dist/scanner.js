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
exports.FileScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FileScanner {
    constructor(config) {
        this.config = config;
        this.stateFile = path.join(process.cwd(), `.aura-state-${config.companyId}-${config.machineId}.json`);
    }
    async scanAndCompare() {
        const currentFiles = await this.scanDirectories();
        const previousState = this.loadPreviousState();
        const filesToUpload = [];
        for (const file of currentFiles) {
            const prev = previousState[file.path];
            let changeType = 'unchanged';
            if (!prev) {
                changeType = 'new';
            }
            else if (prev.mtime !== file.mtime || prev.size !== file.size) {
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
        this.saveState(currentFiles);
        return { filesToUpload, totalFiles: currentFiles.length };
    }
    async scanDirectories() {
        const files = [];
        for (const scanPath of this.config.scanPaths) {
            await this.scanDirectory(scanPath, files);
        }
        return files;
    }
    async scanDirectory(dirPath, files) {
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            if (item.isDirectory()) {
                await this.scanDirectory(fullPath, files);
            }
            else if (item.isFile()) {
                const stat = await fs.promises.stat(fullPath);
                files.push({
                    path: fullPath,
                    mtime: stat.mtime.getTime(),
                    size: stat.size
                });
            }
        }
    }
    loadPreviousState() {
        try {
            const data = fs.readFileSync(this.stateFile, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return {};
        }
    }
    saveState(files) {
        const state = {};
        for (const file of files) {
            state[file.path] = file;
        }
        fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    }
}
exports.FileScanner = FileScanner;
