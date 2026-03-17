export interface FileInfo {
    path: string;
    mtime: number;
    size: number;
}
export interface AgentConfig {
    serverUrl: string;
    token: string;
    scanPaths: string[];
    companyId: string;
    machineId: string;
    machineName: string;
    localUser: string;
    scanIntervalSeconds?: number;
}
export interface UploadRequest {
    companyId: string;
    machineId: string;
    machineName: string;
    localUser: string;
    filePath: string;
    relativePath: string;
    mtime: number;
    size: number;
}
export type FileChangeType = 'new' | 'modified' | 'unchanged';
export interface ModifiedFile {
    path: string;
    relativePath: string;
    mtime: number;
    size: number;
    changeType: FileChangeType;
}
export interface Company {
    id: string;
    name: string;
    status: 'online' | 'syncing' | 'offline';
    lastSync: Date;
    machines: Machine[];
}
export interface Machine {
    id: string;
    name: string;
    status: 'online' | 'syncing' | 'offline';
    lastSync: Date;
}
