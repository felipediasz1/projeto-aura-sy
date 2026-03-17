# Aura Sync - Ecossistema de Backup Incremental Inteligente Multi-Tenant

## Visão Geral

O Aura Sync é um sistema de backup incremental inteligente projetado para gerenciar backups de múltiplas empresas em um painel único. O sistema é composto por três partes principais:

- **Agente (Client-Side)**: Instalado em servidores de clientes, realiza scans incrementais e uploads eficientes.
- **Servidor (Backend)**: Gerencia uploads, autenticação e organização de backups por empresa/máquina.
- **Dashboard (Frontend)**: Interface premium dark para monitoramento em tempo real.

## Estrutura do Projeto

```
aura-sync/
├── packages/
│   ├── shared/          # Tipos e interfaces compartilhadas
│   ├── agent/           # Agente de sincronização client-side
│   ├── server/          # Servidor backend
│   └── dashboard/       # Dashboard React
├── package.json         # Configuração do monorepo
└── tsconfig.json        # Configuração TypeScript
```

## Pré-requisitos

- Node.js 18+
- npm ou yarn

## Instalação

1. Instale o Node.js: https://nodejs.org/

2. Clone ou navegue para o diretório do projeto:
   ```bash
   cd C:\Users\felip\aura-sync
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Construa todos os pacotes:
   ```bash
   npm run build
   ```

## Executando o Sistema

### 1. Servidor Backend

```bash
cd packages/server
npm run dev
```

O servidor rodará em http://localhost:3000

### 2. Dashboard

```bash
cd packages/dashboard
npm start
```

O dashboard estará disponível em http://localhost:3001

### 3. Agente (em uma máquina cliente)

Configure as variáveis de ambiente:

```bash
export AURA_SERVER_URL=http://localhost:3000
export AURA_TOKEN=valid-token
export AURA_SCAN_PATHS=./documents,./data
export AURA_COMPANY_ID=1
export AURA_MACHINE_ID=m1
```

Execute o agente:

```bash
cd packages/agent
npm run build
npm start
```

## Funcionalidades Implementadas

### Agente
- Scan incremental baseado em mtime e size
- Upload eficiente com streams
- Autenticação por token
- Estado persistente de arquivos

### Servidor
- Organização de backups: Empresa -> Máquina -> Diretórios
- Autenticação de tokens
- API REST para uploads e status
- Armazenamento em memória (para demo)

### Dashboard
- Interface dark premium
- Cards de status por empresa/máquina
- Atualização em tempo real
- Design responsivo com Tailwind CSS

## Próximos Passos

- Implementar banco de dados real (PostgreSQL/MongoDB)
- Sistema de filas para uploads (Redis/Bull)
- Logs em tempo real via WebSockets
- Autenticação JWT
- Interface de administração de empresas/máquinas
- Métricas e alertas
- Deploy em containers Docker

## Arquitetura

O sistema segue princípios de arquitetura modular e escalável:

- **Monorepo**: Facilita desenvolvimento e compartilhamento de código
- **TypeScript**: Type safety e melhor DX
- **Streams**: Eficiência em transferências de arquivos grandes
- **REST APIs**: Comunicação padronizada
- **React + Tailwind**: Interface moderna e performática

## Segurança

- Autenticação por token exclusivo por agente
- Validação de uploads
- Isolamento de dados por empresa
- HTTPS recomendado em produção