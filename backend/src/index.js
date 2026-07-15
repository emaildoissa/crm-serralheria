const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('./config/db');



const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Função para inicializar o banco de dados (criação automática de tabelas)
async function initDatabase() {
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome_cliente VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(50),
      origem VARCHAR(100),
      responsavel VARCHAR(255),
      status_funil VARCHAR(50) NOT NULL,
      endereco_obra TEXT,
      prazo_desejado DATE,
      complexidade VARCHAR(20),
      valor_estimado DECIMAL(10,2),
      valor_fechado DECIMAL(10,2),
      resumo_ia TEXT,
      proxima_acao TEXT,
      temperatura_lead VARCHAR(20),
      motivo_perda TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servicos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      tipo_servico VARCHAR(100),
      material VARCHAR(100),
      medidas_brutas TEXT,
      medidas_tecnicas JSONB,
      cor_acabamento VARCHAR(100),
      necessita_instalacao BOOLEAN DEFAULT TRUE,
      checklist_ia JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS compromissos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
      responsavel VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Agendado',
      observacoes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ordem_producao (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'Aguardando Material',
      lista_materiais JSONB,
      equipe_responsavel VARCHAR(255),
      observacoes_tecnicas TEXT,
      data_entrega_fabrica DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registros_fotos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      url_foto TEXT NOT NULL,
      tipo VARCHAR(50),
      legenda TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mensagens_chat (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      remetente VARCHAR(50) NOT NULL,
      mensagem TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timeline_eventos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      descricao TEXT NOT NULL,
      responsavel VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    // Para usar gen_random_uuid() no PostgreSQL anterior à versão 13, precisamos carregar a extensão pgcrypto
    await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await db.query(schemaSQL);
    // Migrações para tabelas existentes (adiciona colunas novas)
    await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS responsavel VARCHAR(255);');
    await db.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS resposta_sugerida TEXT;');
    console.log('Tabelas do banco de dados verificadas/criadas com sucesso!');

    // Inserir dados de teste se o banco estiver vazio
    const checkLeads = await db.query('SELECT COUNT(*) FROM leads');
    if (parseInt(checkLeads.rows[0].count) === 0) {
      console.log('Banco de dados vazio. Inserindo dados de teste para serralheria...');
      
      const seedSQL = `
        -- 1. Inserir leads de teste
        INSERT INTO leads (id, nome_cliente, whatsapp, origem, status_funil, endereco_obra, prazo_desejado, complexidade, valor_estimado, valor_fechado, resumo_ia, proxima_acao, temperatura_lead, motivo_perda)
        VALUES 
          ('11111111-1111-1111-1111-111111111111', 'Ricardo Santos', '(11) 99888-1111', 'WhatsApp', 'Novo lead', 'Rua das Flores, 123 - Jardins', CURRENT_DATE + INTERVAL '20 days', 'Média', 4500.00, 0.00, 'Cliente quer um portão de garagem basculante de alumínio preto. Ele enviou medidas aproximadas de 3.00m de largura por 2.20m de altura. Solicita orçamento e instalação residencial.', 'Agendar visita técnica para medição fina do vão.', 'Quente', NULL),
          ('22222222-2222-2222-2222-222222222222', 'Ana Oliveira', '(11) 99777-2222', 'Site', 'Medição agendada', 'Av. Paulista, 1500 - Ap 42', CURRENT_DATE + INTERVAL '15 days', 'Baixa', 1800.00, 0.00, 'Cliente solicita corrimão de aço inox escovado para escada interna (aproximadamente 4 metros lineares). Já enviou foto do local.', 'Realizar visita técnica hoje à tarde para conferir a fixação.', 'Morno', NULL),
          ('33333333-3333-3333-3333-333333333333', 'Carlos Construtor', '(11) 99666-3333', 'Indicação', 'Produção', 'Rua Augusta, 800 - Obra Comercial', CURRENT_DATE + INTERVAL '30 days', 'Alta', 12000.00, 11500.00, 'Construtora solicitando cobertura de policarbonato com estrutura de aço carbono. Medidas 6.00m x 4.00m. Contrato fechado.', 'Monitorar montagem das treliças na serralheria.', 'Quente', NULL),
          ('44444444-4444-4444-4444-444444444444', 'Juliana Lima', '(11) 99555-4444', 'WhatsApp', 'Finalizado', 'Rua dos Pinheiros, 450', CURRENT_DATE - INTERVAL '10 days', 'Média', 3200.00, 3200.00, 'Grade de proteção em ferro para janelas de apartamento. Instalação concluída com sucesso.', 'Entrar em contato para pós-venda após 30 dias.', 'Curioso', NULL),
          ('55555555-5555-5555-5555-555555555555', 'Roberto Mendes', '(11) 99444-5555', 'WhatsApp', 'Perdido', 'Rua Vergueiro, 3000', CURRENT_DATE - INTERVAL '5 days', 'Média', 2500.00, 0.00, 'Grade pantográfica. Cliente achou o preço alto e optou por não fazer no momento.', NULL, 'Frio', 'Preço alto');

        -- 2. Inserir serviços correspondentes
        INSERT INTO servicos (lead_id, tipo_servico, material, medidas_brutas, medidas_tecnicas, cor_acabamento, necessita_instalacao, checklist_ia)
        VALUES 
          ('11111111-1111-1111-1111-111111111111', 'Portão', 'Alumínio', '3.00 x 2.20m', '{"largura": 3.00, "altura": 2.20, "profundidade": 0.10}', 'Preto', TRUE, '["Confirmar se haverá motor automático", "Checar nível das colunas de alvenaria"]'),
          ('22222222-2222-2222-2222-222222222222', 'Corrimão', 'Inox', '4 metros lineares', '{"comprimento": 4.00}', 'Escovado', TRUE, '["Validar pontos de fixação nas paredes", "Checar inclinação dos degraus"]'),
          ('33333333-3333-3333-3333-333333333333', 'Cobertura', 'Ferro', '6.00 x 4.00m', '{"largura": 6.00, "comprimento": 4.00}', 'Pintura Prime Cinza', TRUE, '["Validar suporte estrutural da parede da fachada", "Confirmar caimento da água"]'),
          ('44444444-4444-4444-4444-444444444444', 'Grade', 'Ferro', '1.50 x 1.20m', '{"largura": 1.50, "altura": 1.20}', 'Branco', TRUE, '["Validar fixação química para alvenaria oca"]'),
          ('55555555-5555-5555-5555-555555555555', 'Grade', 'Ferro', '2.00 x 2.00m', '{"largura": 2.00, "altura": 2.00}', 'Preto', TRUE, NULL);

        -- 3. Inserir compromissos de teste
        INSERT INTO compromissos (lead_id, tipo, data_hora, responsavel, status, observacoes)
        VALUES 
          ('22222222-2222-2222-2222-222222222222', 'Medição', CURRENT_DATE + INTERVAL '14 hours', 'Lucas Serralheiro', 'Agendado', 'Levar trena a laser e gabarito de inclinação.');

        -- 4. Inserir ordens de produção de teste
        INSERT INTO ordem_producao (lead_id, status, lista_materiais, equipe_responsavel, observacoes_tecnicas, data_entrega_fabrica)
        VALUES 
          ('33333333-3333-3333-3333-333333333333', 'Em Produção', '[{"item": "Treliça de Aço 50x50", "qtd": 6, "status": "Pronto"}, {"item": "Placa de Policarbonato Alveolar", "qtd": 8, "status": "Comprado"}]', 'Equipe Carlos e Marcelo', 'Fazer soldagem mig com reforço extra nas chapas de fixação.', CURRENT_DATE + INTERVAL '10 days');

        -- 5. Inserir histórico de conversas de teste
        INSERT INTO mensagens_chat (lead_id, remetente, mensagem)
        VALUES 
          ('11111111-1111-1111-1111-111111111111', 'cliente', 'Boa noite! Queria ver quanto fica pra fazer um portão de alumínio preto pra minha casa.'),
          ('11111111-1111-1111-1111-111111111111', 'IA', 'Boa noite! Fazemos sim. Você teria as medidas aproximadas da largura e altura do vão para eu te passar uma estimativa inicial?'),
          ('11111111-1111-1111-1111-111111111111', 'cliente', 'Olha, de largura tem uns 3 metros e de altura 2 metros e 20 centímetros mais ou menos.'),
          ('22222222-2222-2222-2222-222222222222', 'cliente', 'Olá, preenchi o formulário no site de vocês. Preciso de um corrimão de inox pra escada aqui de casa.'),
          ('22222222-2222-2222-2222-222222222222', 'vendedor', 'Olá Ana! Recebemos sim. Já agendei a visita do nosso técnico Lucas para hoje à tarde para conferir as medidas certinho e fechar o valor.');

        -- 6. Inserir timeline de eventos de teste
        INSERT INTO timeline_eventos (lead_id, tipo, descricao, responsavel)
        VALUES
          ('11111111-1111-1111-1111-111111111111', 'lead_criado', 'Lead criado via WhatsApp', 'Sistema'),
          ('11111111-1111-1111-1111-111111111111', 'mensagem_recebida', 'Cliente enviou: "Boa noite! Queria ver quanto fica pra fazer um portão de alumínio preto pra minha casa."', 'Cliente'),
          ('11111111-1111-1111-1111-111111111111', 'ia_atualizou', 'IA analisou conversa e extraiu dados: Portão de Alumínio, medidas 3.00x2.20m', 'IA Gemini'),
          ('11111111-1111-1111-1111-111111111111', 'fase_alterada', 'Fase alterada para "Novo lead"', 'Sistema'),
          ('22222222-2222-2222-2222-222222222222', 'lead_criado', 'Lead criado via Site (Formulário)', 'Sistema'),
          ('22222222-2222-2222-2222-222222222222', 'visita_agendada', 'Visita de Medição agendada com Lucas Serralheiro', 'Vendedor'),
          ('33333333-3333-3333-3333-333333333333', 'lead_criado', 'Lead criado via Indicação', 'Sistema'),
          ('33333333-3333-3333-3333-333333333333', 'orcamento_fechado', 'Orçamento aprovado e contrato fechado em R$ 11.500', 'Vendedor'),
          ('33333333-3333-3333-3333-333333333333', 'fase_alterada', 'Fase alterada para "Produção"', 'Sistema'),
          ('44444444-4444-4444-4444-444444444444', 'lead_criado', 'Lead criado via WhatsApp', 'Sistema'),
          ('44444444-4444-4444-4444-444444444444', 'fase_alterada', 'Fase alterada para "Finalizado"', 'Sistema'),
          ('55555555-5555-5555-5555-555555555555', 'lead_criado', 'Lead criado via WhatsApp', 'Sistema'),
          ('55555555-5555-5555-5555-555555555555', 'lead_perdido', 'Lead perdido: Preço alto', 'Sistema');
      `;
      await db.query(seedSQL);
      console.log('Dados de teste inseridos com sucesso!');
    }
  } catch (error) {
    console.warn('Alerta na inicialização do banco de dados:', error.message);
    console.warn('Verifique suas credenciais de conexão no arquivo .env.');
  }
}

// Inicializa banco de dados
initDatabase();

// --- ROTAS DA API ---

// Importar rotas
const leadsRoutes = require('./routes/leads');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/leads', leadsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Endpoint de Teste/Healthcheck
app.use('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// --- SERVIR FRONTEND ESTÁTICO EM PRODUÇÃO ---
if (process.env.NODE_ENV === 'production') {
  // Pasta onde o Docker ou build local vai colocar os arquivos do React compilados
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Servidor do SOS em modo de desenvolvimento. O Frontend roda na porta do Vite.');
  });
}

// Iniciar Servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
