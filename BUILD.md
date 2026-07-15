# Build & Deploy — CRM Serralheria

## Pré-requisitos

- Docker instalado e logado no Docker Hub (`docker login`)
- Node.js 22+ (para build local)

## Estrutura do projeto

```
crm-serralheria/
├── backend/          # API Express + rotas
├── frontend/         # React + Vite
├── Dockerfile        # Build da imagem (multi-stage)
├── docker-compose.yml
└── SOS - Ingestão... # Fluxo n8n (backup)
```

## Passo a passo

### 1. Build do frontend + preparação dos assets

```bash
# Da raiz do projeto
npm run build
```

Isso executa:
- `npm run build --prefix frontend` (compila React com Vite)
- Remove `backend/public` antigo
- Copia `frontend/dist/` → `backend/public/`

### 2. Build da imagem Docker

```bash
docker build -t emaildoissa/crm-serralheria:latest .
```

O Dockerfile faz:
- Estágio 1 (frontend-builder): instala dependências do React e compila
- Estágio 2 (backend-runner): instala dependências do Node, copia backend + frontend compilado

### 3. Push para Docker Hub

```bash
docker push emaildoissa/crm-serralheria:latest
```

### 4. Deploy na VPS (Portainer)

1. Acesse Portainer → **Stacks** → clique na stack do n8n/CRM
2. Localize o serviço `crm-serralheria`
3. Clique em **"Update the stack"**
4. Portainer puxa a imagem nova automaticamente e recria o container

### 5. Ajustes no n8n (se necessário)

1. Acesse `https://n8n.automacao.free.nf`
2. Abra o fluxo **"SOS - Ingestão Inteligente..."**
3. No nó **Call CRM Webhook**, verifique se o JSON body tem os campos:
   - `mensagem`
   - `resposta_sugerida`
4. No nó **IA Gemini**, verifique se o prompt está atualizado
5. Salve e ative o fluxo

## Comandos rápidos

```bash
# Tudo de uma vez
cd /home/marcus/Documentos/crm-serralheria
npm run build
docker build -t emaildoissa/crm-serralheria:latest .
docker push emaildoissa/crm-serralheria:latest
```

## Variáveis de ambiente (docker-compose)

| Variável | Descrição |
|---|---|
| `PORT` | Porta do backend (5000) |
| `NODE_ENV` | `production` |
| `DB_HOST` | Nome do serviço PostgreSQL na rede Docker |
| `DB_PORT` | 5432 |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | Senha do banco |
| `DB_DATABASE` | `crm_serralheria` |
| `N8N_WEBHOOK_URL` | Webhook do n8n para acionar IA |
| `EVOLUTION_API_URL` | Base URL da Evolution API |
| `EVOLUTION_API_KEY` | Chave da Evolution API |
| `EVOLUTION_INSTANCE` | Nome da instância no Evolution |
