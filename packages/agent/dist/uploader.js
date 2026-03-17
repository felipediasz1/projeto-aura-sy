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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploader = void 0;
const fs = __importStar(require("fs"));
const axios_cjs_1 = __importDefault(require("axios/dist/node/axios.cjs"));
const form_data_1 = __importDefault(require("form-data"));
class FileUploader {
    constructor(config) {
        this.config = config;
    }
    async uploadFile(filePath, relativePath, mtime, size, machineName, localUser) {
        const stream = fs.createReadStream(filePath);
        const formData = new form_data_1.default();
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
                await axios_cjs_1.default.post(`${this.config.serverUrl}/upload`, formData, {
                    headers: {
                        'Authorization': `Bearer ${this.config.token}`,
                        'Client-ID': this.config.companyId,
                        'Machine-Name': machineName,
                        ...formData.getHeaders()
                    },
                    timeout: 300000
                });
                return;
            }
            catch (error) {
                attempt += 1;
                if (attempt > maxRetries) {
                    const errMsg = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
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
exports.FileUploader = FileUploader;
