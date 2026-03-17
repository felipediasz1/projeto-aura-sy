# Aura Sync - TODO

Este documento detalha as próximas tarefas de desenvolvimento para finalizar os componentes principais do Aura Sync, com base na análise inicial e nas diretrizes de projeto.

---

### ✅ Dashboard (`packages/dashboard`)

O `DashboardLayout.tsx` é uma base excelente. As tarefas abaixo visam refinar a experiência do usuário, a manutenibilidade e a funcionalidade.

- **[ ] 1. Refatoração de Componentes:**
  - [ ] Mover a lógica da barra lateral para um componente `Sidebar.tsx`.
  - [ ] Mover a lógica do cabeçalho para um componente `Header.tsx`.
  - [ ] Mover os cards de estatísticas para um componente `StatsCards.tsx`.

- **[ ] 2. Implementar Navegação (Routing):**
  - [ ] Instalar `react-router-dom`.
  - [ ] Substituir os elementos `<button>` da navegação por componentes `<NavLink>` para habilitar a troca de páginas (`Visão Geral`, `Empresas`, `Configurações`).
  - [ ] Criar componentes de página vazios para servir como destino das rotas.

- **[ ] 3. Aprimorar UX com `Framer Motion`:**
  - [ ] Aplicar animações de entrada escalonadas (stagger) para os cards de estatística e para a lista de empresas.
  - [ ] Adicionar `AnimatePresence` para transições suaves de página quando a rota mudar.
  - [ ] Adicionar micro-interações em botões e cards ao focar ou clicar.

- **[ ] 4. Finalizar Responsividade:**
  - [ ] Implementar um menu "hamburger" em telas menores (`< xl`) para exibir/ocultar a `Sidebar`.
  - [ ] Garantir que todos os elementos do `Header` se ajustem corretamente em telas mobile.

- **[ ] 5. Consistência de Estilo:**
  - [ ] Validar as cores no `tailwind.config.js` para que correspondam exatamente à identidade visual (#000000, #1c1c1e, #0071e3).
  - [ ] Garantir que todos os componentes usem as cores e fontes definidas no tema do Tailwind.

---

### ⚙️ Agent (`packages/agent`)

O `scanner.ts` tem a lógica fundamental de comparação, mas precisa ser robustecido para atender às "Regras de Ouro" de segurança e resiliência.

- **[ ] 1. Resiliência e Tratamento de Erros:**
  - [ ] Envolver as chamadas de `fs.promises` (`readdir`, `stat`) dentro de `scanDirectory` em blocos `try...catch` para evitar que o agente quebre por falta de permissão ou arquivos bloqueados.
  - [ ] Registrar os erros de scan em um arquivo de log local (`agent.log`).

- **[ ] 2. Segurança (Path Traversal):**
  - [ ] Antes de escanear um diretório ou arquivo, validar se o caminho resolvido (`path.resolve(fullPath)`) ainda está contido no diretório base de scan (`path.resolve(scanPath)`). Se sair, ignorar e registrar um aviso de segurança.

- **[ ] 3. Performance:**
  - [ ] Converter as operações síncronas `fs.readFileSync` e `fs.writeFileSync` em `loadPreviousState` e `saveState` para suas contrapartes assíncronas (`fs.promises.readFile`/`writeFile`) para não bloquear o event loop.

- **[ ] 4. Funcionalidades do Scanner:**
  - [ ] Implementar um sistema para ignorar arquivos/pastas. Pode ser uma lista de padrões (ex: `['node_modules', '.git']`) no `AgentConfig`.
  - [ ] Aprimorar a lógica de `path.relative` para funcionar corretamente com múltiplos `scanPaths`, encontrando a qual pasta base o arquivo pertence antes de calcular o caminho relativo.
  - [ ] (Opcional, mas recomendado) Adicionar hashing de arquivo (ex: SHA-256) como um passo extra de verificação, além de `mtime` e `size`.

- **[ ] 5. Integração (Próximos Passos):**
  - [ ] Conectar a saída do `scanAndCompare` (lista `filesToUpload`) com o módulo de `uploader` (que será o responsável por criar o Stream e enviar ao servidor).
