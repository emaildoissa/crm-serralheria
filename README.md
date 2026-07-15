# SOS - Sistema Operacional de Serralheria

Este repositório contém a base completa do **SOS (Sistema Operacional de Serralheria)**, uma aplicação projetada para unificar e automatizar toda a operação de uma serralheria: captação, leitura inteligente de conversas via WhatsApp (IA), visitas de medição, orçamentação técnica, controle de fabricação na oficina e agenda de instalações.

---

## 🚀 Como Rodar Localmente (Desenvolvimento)

Siga os passos abaixo para instalar as dependências e iniciar o projeto em seu computador local conectado ao PostgreSQL de testes.

### 1. Configurar o `.env`
1. Copie o arquivo `.env.example` para `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   ```
2. Abra o arquivo `.env` e preencha as credenciais do seu banco de dados PostgreSQL (pode ser o da sua VPS para testes ou um banco local):
   ```env
   DB_HOST=seu-postgres-host
   DB_PORT=5432
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_DATABASE=nome_do_banco
   DB_SSL=true  # Deixe true se for conectar ao banco remoto da VPS com SSL
   ```

### 2. Instalar Dependências (Bootstrap)
Temos um script automatizado na raiz do projeto para instalar as dependências do Frontend e Backend simultaneamente:
```bash
npm run bootstrap
```

### 3. Iniciar o Servidor de Desenvolvimento
Inicie o Express (backend) e o Vite (frontend) rodando juntos:
```bash
npm run dev
```
- O **Frontend** estará rodando em: [http://localhost:5173](http://localhost:5173) (com proxy automático configurado para redirecionar `/api` para o backend).
- O **Backend** estará rodando em: [http://localhost:5000](http://localhost:5000).

*Nota: Na primeira conexão bem-sucedida ao banco, o backend criará automaticamente todas as tabelas necessárias (`leads`, `servicos`, `compromissos`, `ordem_producao`, `registros_fotos`) e inserirá dados fictícios de teste para você visualizar o painel imediatamente.*

---

## 🐳 Como Implantar na VPS (Docker & Portainer)

A aplicação foi projetada de forma otimizada para produção: **o backend serve o frontend compilado na mesma porta (5000)**. Isso significa que você precisa rodar apenas **um único container** na sua VPS!

### 1. Preparar a Build do Frontend
Antes de rodar o Docker, compile o React e copie os arquivos para a pasta pública do Express:
```bash
npm run build
```
*(Esse comando gerará a pasta `dist/` no frontend e a copiará automaticamente para `backend/public/`).*

### 2. Subir no Portainer (docker-compose)
Crie uma nova Stack no Portainer utilizando o arquivo `docker-compose.yml` da raiz do projeto.

Certifique-se de configurar as variáveis de ambiente na interface do Portainer correspondentes ao seu PostgreSQL e n8n.
Se o seu Postgres da VPS estiver rodando em uma rede Docker específica (ex: `proxy-network` ou `db-network`), altere a rede no final do `docker-compose.yml` para se conectar a ela:

```yaml
networks:
  crm-network:
    external: true
    name: NOME_DA_SUA_REDE_DOCKER_EXISTENTE
```

---

## 🧠 Integração com n8n & Evolution API (O Coração da IA)

Para que a Inteligência Artificial alimente o SOS, você deve configurar um fluxo no seu **n8n** na VPS:

1. **Gatilho (Evolution API)**: Escuta o recebimento de mensagens no WhatsApp.
2. **Processamento (IA)**: Envia o histórico da conversa para o modelo (Gemini ou OpenAI) com um prompt estruturado.
   - *Exemplo de Prompt*: "Extraia desta conversa de serralheria: Nome do Cliente, Medidas da peça, Tipo de Serviço (Portão, Grade, etc.), Material (Alumínio, Ferro) e Endereço. Responda em formato JSON."
3. **Persistência (Postgres)**: O n8n executa uma consulta SQL no PostgreSQL inserindo ou atualizando o lead.
   - *Query sugerida para o nó Postgres no n8n:*
     ```sql
     INSERT INTO leads (nome_cliente, whatsapp, status_funil, resumo_ia, temperatura_lead, proxima_acao)
     VALUES ($1, $2, 'Novo lead', $3, $4, $5)
     ON CONFLICT (whatsapp) DO UPDATE 
     SET resumo_ia = EXCLUDED.resumo_ia, temperatura_lead = EXCLUDED.temperatura_lead, updated_at = NOW();
     ```

---

## 📁 Estrutura de Arquivos Criada
- [/backend](file:///home/marcos/Documentos/crm-serralheria/backend): Servidor Express com conexões robustas em PostgreSQL e APIs de pipeline, produção e agenda.
- [/frontend](file:///home/marcos/Documentos/crm-serralheria/frontend): Painel React estilizado com design premium (Dark Steel Theme) e alta interatividade.
- [docker-compose.yml](file:///home/marcos/Documentos/crm-serralheria/docker-compose.yml): Configuração para deploy direto no Portainer.
- [Dockerfile](file:///home/marcos/Documentos/crm-serralheria/Dockerfile): Build multi-stage otimizada.
- [.env.example](file:///home/marcos/Documentos/crm-serralheria/.env.example): Guia de variáveis de ambiente.
