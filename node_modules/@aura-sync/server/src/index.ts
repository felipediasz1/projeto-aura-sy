import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Company, Machine } from '@aura-sync/shared';

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedToken = process.env.AURA_TOKEN || 'valid-token';

// In-memory storage for demo (use database in production)
const companies: Company[] = [
  {
    id: '1',
    name: 'Empresa A',
    status: 'online',
    lastSync: new Date(),
    machines: [
      { id: 'm1', name: 'Servidor 1', status: 'online', lastSync: new Date() },
      { id: 'm2', name: 'Servidor 2', status: 'syncing', lastSync: new Date() }
    ]
  },
  {
    id: '2',
    name: 'Empresa B',
    status: 'offline',
    lastSync: new Date(Date.now() - 3600000),
    machines: [
      { id: 'm3', name: 'Desktop 1', status: 'offline', lastSync: new Date(Date.now() - 3600000) }
    ]
  }
];

const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Auth middleware: only protect upload endpoint
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/upload') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || token !== allowedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  next();
});

app.post('/upload', upload.single('file'), (req, res) => {
  const clientId = req.headers['client-id'] as string | undefined;
  const machineNameHeader = req.headers['machine-name'] as string | undefined;
  const { companyId, machineId, machineName, localUser, relativePath, mtime, size } = req.body;
  const file = req.file;

  if (!file || !companyId || !machineId || !relativePath || !mtime || !size || !localUser) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resolvedMachineName = String(machineNameHeader || machineName || 'unknown-machine').replace(/[^a-zA-Z0-9-_ ]/g, '_');
  const resolvedClientId = String(clientId || companyId).replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeCompanyId = String(companyId).replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeMachineId = String(machineId).replace(/[^a-zA-Z0-9-_]/g, '_');

  if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
    return res.status(400).json({ error: 'Invalid relative path' });
  }

  const normalizedRelativePath = path.normalize(relativePath).replace(/^([\\/])+/, '');
  if (normalizedRelativePath.includes('..')) {
    return res.status(400).json({ error: 'Invalid relative path' });
  }

  const companyDir = path.join('backups', safeCompanyId);
  const machineDir = path.join(companyDir, `${safeMachineId}_${resolvedMachineName}`);
  const filePathOrigin = path.join(machineDir, normalizedRelativePath);
  const resolvedFilePath = path.resolve(filePathOrigin);
  const resolvedMachineDir = path.resolve(machineDir);

  if (!resolvedFilePath.startsWith(resolvedMachineDir)) {
    return res.status(400).json({ error: 'Invalid path traversal' });
  }

  fs.mkdirSync(path.dirname(resolvedFilePath), { recursive: true });
  fs.renameSync(file.path, resolvedFilePath);

  // Update machine status and last sync
  const company = companies.find(c => c.id === companyId);
  if (company) {
    const machine = company.machines.find((m: Machine) => m.id === machineId);
    if (machine) {
      machine.status = 'online';
      machine.lastSync = new Date();
    }
    company.lastSync = new Date();
  }

  res.json({
    success: true,
    uploaded: {
      clientId: resolvedClientId,
      companyId,
      machineId,
      machineName: resolvedMachineName,
      localUser,
      relativePath: normalizedRelativePath,
      mtime: Number(mtime),
      size: Number(size),
      savedAt: resolvedFilePath
    }
  });
});

app.get('/companies', (req, res) => {
  res.json(companies);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});