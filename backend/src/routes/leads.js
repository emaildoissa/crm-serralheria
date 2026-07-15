const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. LISTAR LEADS (Com detalhes do serviço)
router.get('/', async (req, res) => {
  try {
    const queryText = `
      SELECT l.*, s.tipo_servico, s.material, s.medidas_brutas, s.medidas_tecnicas, s.cor_acabamento, s.necessita_instalacao, s.checklist_ia
      FROM leads l
      LEFT JOIN servicos s ON l.id = s.lead_id
      ORDER BY l.updated_at DESC
    `;
    const { rows } = await db.query(queryText);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 2. CRIAR NOVO LEAD (E serviço correspondente)
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const {
      nome_cliente,
      whatsapp,
      origem,
      status_funil,
      endereco_obra,
      prazo_desejado,
      complexidade,
      valor_estimado,
      tipo_servico,
      material,
      medidas_brutas,
      cor_acabamento,
      necessita_instalacao
    } = req.body;

    await client.query('BEGIN');

    // Inserir lead
    const insertLeadQuery = `
      INSERT INTO leads (
        nome_cliente, whatsapp, origem, status_funil, endereco_obra, 
        prazo_desejado, complexidade, valor_estimado, temperatura_lead
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const leadRes = await client.query(insertLeadQuery, [
      nome_cliente,
      whatsapp,
      origem || 'WhatsApp',
      status_funil || 'Novo Lead',
      endereco_obra,
      prazo_desejado || null,
      complexidade || 'Média',
      valor_estimado || 0,
      'Morno'
    ]);

    const newLead = leadRes.rows[0];

    // Inserir serviço correspondente
    const insertServiceQuery = `
      INSERT INTO servicos (
        lead_id, tipo_servico, material, medidas_brutas, cor_acabamento, necessita_instalacao
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const serviceRes = await client.query(insertServiceQuery, [
      newLead.id,
      tipo_servico || 'Portão',
      material || 'Alumínio',
      medidas_brutas || '',
      cor_acabamento || 'Preto',
      necessita_instalacao !== undefined ? necessita_instalacao : true
    ]);

    await client.query(
      `INSERT INTO timeline_eventos (lead_id, tipo, descricao, responsavel)
       VALUES ($1, 'lead_criado', $2, 'Sistema')`,
      [newLead.id, `Lead criado via ${origem || 'manual'} — ${status_funil || 'Novo lead'}`
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      ...newLead,
      ...serviceRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead no banco' });
  } finally {
    client.release();
  }
});

// 3. OBTER DETALHE COMPLETO DE UM LEAD
router.get('/:id', async (req, res) => {
  try {
    const leadId = req.params.id;

    // Buscar dados do lead e do serviço
    const leadQuery = `
      SELECT l.*, s.tipo_servico, s.material, s.medidas_brutas, s.medidas_tecnicas, s.cor_acabamento, s.necessita_instalacao, s.checklist_ia
      FROM leads l
      LEFT JOIN servicos s ON l.id = s.lead_id
      WHERE l.id = $1
    `;
    const leadRes = await db.query(leadQuery, [leadId]);

    if (leadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const leadInfo = leadRes.rows[0];

    // Buscar compromissos da agenda
    const compQuery = 'SELECT * FROM compromissos WHERE lead_id = $1 ORDER BY data_hora ASC';
    const compRes = await db.query(compQuery, [leadId]);

    // Buscar ordem de produção
    const prodQuery = 'SELECT * FROM ordem_producao WHERE lead_id = $1';
    const prodRes = await db.query(prodQuery, [leadId]);

    // Buscar fotos
    const fotosQuery = 'SELECT * FROM registros_fotos WHERE lead_id = $1 ORDER BY created_at DESC';
    const fotosRes = await db.query(fotosQuery, [leadId]);

    // Buscar histórico de mensagens de chat
    const chatQuery = 'SELECT * FROM mensagens_chat WHERE lead_id = $1 ORDER BY created_at ASC';
    const chatRes = await db.query(chatQuery, [leadId]);

    res.json({
      lead: leadInfo,
      compromissos: compRes.rows,
      producao: prodRes.rows[0] || null,
      fotos: fotosRes.rows,
      mensagens: chatRes.rows
    });

  } catch (error) {
    console.error('Erro ao obter detalhes do lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 4. ATUALIZAR STATUS DO FUNIL (Arrastar no Kanban)
router.put('/:id/status', async (req, res) => {
  try {
    const { status_funil } = req.body;
    const leadId = req.params.id;

    const queryText = `
      UPDATE leads 
      SET status_funil = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const { rows } = await db.query(queryText, [status_funil, leadId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    await db.query(
      `INSERT INTO timeline_eventos (lead_id, tipo, descricao, responsavel)
       VALUES ($1, 'fase_alterada', $2, 'Sistema')`,
      [leadId, `Fase alterada para "${status_funil}"`]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status do lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 5. ATUALIZAR DADOS CADASTRAIS E IA DO LEAD
router.put('/:id', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const leadId = req.params.id;
    const {
      nome_cliente,
      whatsapp,
      origem,
      status_funil,
      endereco_obra,
      prazo_desejado,
      complexidade,
      valor_estimado,
      valor_fechado,
      resumo_ia,
      proxima_acao,
      temperatura_lead,
      motivo_perda,
      // Dados do serviço
      tipo_servico,
      material,
      medidas_brutas,
      medidas_tecnicas,
      cor_acabamento,
      necessita_instalacao,
      checklist_ia
    } = req.body;

    await client.query('BEGIN');

    // Atualizar tabela leads
    const updateLeadQuery = `
      UPDATE leads
      SET nome_cliente = $1, whatsapp = $2, origem = $3, status_funil = $4,
          endereco_obra = $5, prazo_desejado = $6, complexidade = $7,
          valor_estimado = $8, valor_fechado = $9, resumo_ia = $10,
          proxima_acao = $11, temperatura_lead = $12, motivo_perda = $13,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;
    const leadRes = await client.query(updateLeadQuery, [
      nome_cliente, whatsapp, origem, status_funil,
      endereco_obra, prazo_desejado || null, complexidade,
      valor_estimado || 0, valor_fechado || 0, resumo_ia,
      proxima_acao, temperatura_lead, motivo_perda,
      leadId
    ]);

    if (leadRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Atualizar ou criar serviço
    const checkServiceQuery = 'SELECT id FROM servicos WHERE lead_id = $1';
    const checkRes = await client.query(checkServiceQuery, [leadId]);

    let serviceRes;
    if (checkRes.rows.length > 0) {
      const updateServiceQuery = `
        UPDATE servicos
        SET tipo_servico = $1, material = $2, medidas_brutas = $3,
            medidas_tecnicas = $4, cor_acabamento = $5, necessita_instalacao = $6,
            checklist_ia = $7
        WHERE lead_id = $8
        RETURNING *
      `;
      serviceRes = await client.query(updateServiceQuery, [
        tipo_servico, material, medidas_brutas,
        medidas_tecnicas ? JSON.stringify(medidas_tecnicas) : null,
        cor_acabamento, necessita_instalacao,
        checklist_ia ? JSON.stringify(checklist_ia) : null,
        leadId
      ]);
    } else {
      const insertServiceQuery = `
        INSERT INTO servicos (
          lead_id, tipo_servico, material, medidas_brutas, medidas_tecnicas, cor_acabamento, necessita_instalacao, checklist_ia
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      serviceRes = await client.query(insertServiceQuery, [
        leadId, tipo_servico, material, medidas_brutas,
        medidas_tecnicas ? JSON.stringify(medidas_tecnicas) : null,
        cor_acabamento, necessita_instalacao,
        checklist_ia ? JSON.stringify(checklist_ia) : null
      ]);
    }

    await client.query('COMMIT');

    res.json({
      ...leadRes.rows[0],
      ...serviceRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados no banco' });
  } finally {
    client.release();
  }
});

// 6. ADICIONAR COMPROMISSO (AGENDA)
router.post('/:id/compromissos', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { tipo, data_hora, responsavel, observacoes } = req.body;

    const queryText = `
      INSERT INTO compromissos (lead_id, tipo, data_hora, responsavel, observacoes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(queryText, [leadId, tipo, data_hora, responsavel, observacoes]);

    await db.query(
      `INSERT INTO timeline_eventos (lead_id, tipo, descricao, responsavel)
       VALUES ($1, 'visita_agendada', $2, $3)`,
      [leadId, `Visita de ${tipo} agendada para ${new Date(data_hora).toLocaleString('pt-BR')}`, responsavel || 'Sistema']
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar compromisso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 7. ATUALIZAR STATUS DO COMPROMISSO
router.put('/compromissos/:id', async (req, res) => {
  try {
    const compId = req.params.id;
    const { status, observacoes, data_hora, responsavel } = req.body;

    const queryText = `
      UPDATE compromissos
      SET status = $1, observacoes = COALESCE($2, observacoes), 
          data_hora = COALESCE($3, data_hora), responsavel = COALESCE($4, responsavel)
      WHERE id = $5
      RETURNING *
    `;
    const { rows } = await db.query(queryText, [status, observacoes, data_hora, responsavel, compId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Compromisso não encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar compromisso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 8. SALVAR/ATUALIZAR ORDEM DE PRODUÇÃO
router.post('/:id/producao', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { status, lista_materiais, equipe_responsavel, observacoes_tecnicas, data_entrega_fabrica } = req.body;

    const checkQuery = 'SELECT id FROM ordem_producao WHERE lead_id = $1';
    const checkRes = await db.query(checkQuery, [leadId]);

    let queryText;
    let params;

    if (checkRes.rows.length > 0) {
      queryText = `
        UPDATE ordem_producao
        SET status = $1, lista_materiais = $2, equipe_responsavel = $3, 
            observacoes_tecnicas = $4, data_entrega_fabrica = $5
        WHERE lead_id = $6
        RETURNING *
      `;
      params = [
        status || 'Aguardando Material',
        lista_materiais ? JSON.stringify(lista_materiais) : null,
        equipe_responsavel,
        observacoes_tecnicas,
        data_entrega_fabrica || null,
        leadId
      ];
    } else {
      queryText = `
        INSERT INTO ordem_producao (lead_id, status, lista_materiais, equipe_responsavel, observacoes_tecnicas, data_entrega_fabrica)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      params = [
        leadId,
        status || 'Aguardando Material',
        lista_materiais ? JSON.stringify(lista_materiais) : null,
        equipe_responsavel,
        observacoes_tecnicas,
        data_entrega_fabrica || null
      ];
    }

    const { rows } = await db.query(queryText, params);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao salvar ordem de produção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 9. ADICIONAR REGISTRO FOTOGRÁFICO
router.post('/:id/fotos', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { url_foto, tipo, legenda } = req.body;

    const queryText = `
      INSERT INTO registros_fotos (lead_id, url_foto, tipo, legenda)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await db.query(queryText, [leadId, url_foto, tipo, legenda]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao salvar foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 10. EXCLUIR UM LEAD
router.delete('/:id', async (req, res) => {
  try {
    const leadId = req.params.id;
    const queryText = 'DELETE FROM leads WHERE id = $1 RETURNING *';
    const { rows } = await db.query(queryText, [leadId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ message: 'Lead excluído com sucesso', lead: rows[0] });
  } catch (error) {
    console.error('Erro ao excluir lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 11. WEBHOOK INGEST (INTEGRAÇÃO COM n8n - SÓ ARMAZENA, NÃO RESPONDE)
router.post('/webhook-ingest', async (req, res) => {
  const client = await db.pool.connect();
  try {
    const {
      whatsapp,
      nome_cliente,
      mensagem,
      tipo_servico,
      material,
      medidas_brutas,
      medidas_tecnicas,
      cor_acabamento,
      resumo_ia,
      temperatura_lead,
      proxima_acao,
      resposta_sugerida,
      checklist_ia
    } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ error: 'Número de WhatsApp é obrigatório para ingestão' });
    }

    await client.query('BEGIN');

    const cleanWhatsapp = whatsapp.replace(/\D/g, '');

    const checkQuery = `
      SELECT id, status_funil, resumo_ia 
      FROM leads 
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') LIKE $1
    `;
    const checkRes = await client.query(checkQuery, [`%${cleanWhatsapp}%`]);

    let leadId;
    let resultLead;
    let resultService;

    if (checkRes.rows.length > 0) {
      const existingLead = checkRes.rows[0];
      leadId = existingLead.id;

      let updatedResumo = resumo_ia || existingLead.resumo_ia;
      if (resumo_ia && existingLead.resumo_ia && !existingLead.resumo_ia.includes(resumo_ia)) {
        const base = existingLead.resumo_ia.startsWith('Erro IA') ? '' : existingLead.resumo_ia + '\n\n';
        updatedResumo = base + `[Nova Atualização IA]: ${resumo_ia}`;
      }

      const updateLeadQuery = `
        UPDATE leads
        SET nome_cliente = COALESCE($1, nome_cliente),
            resumo_ia = $2,
            proxima_acao = COALESCE($3, proxima_acao),
            temperatura_lead = COALESCE($4, temperatura_lead),
            resposta_sugerida = COALESCE($5, resposta_sugerida),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      const leadRes = await client.query(updateLeadQuery, [
        nome_cliente,
        updatedResumo,
        proxima_acao,
        temperatura_lead || 'Morno',
        resposta_sugerida,
        leadId
      ]);
      resultLead = leadRes.rows[0];

      const updateServiceQuery = `
        UPDATE servicos
        SET tipo_servico = COALESCE($1, tipo_servico),
            material = COALESCE($2, material),
            medidas_brutas = COALESCE($3, medidas_brutas),
            medidas_tecnicas = COALESCE($4, medidas_tecnicas),
            cor_acabamento = COALESCE($5, cor_acabamento),
            checklist_ia = COALESCE($6, checklist_ia)
        WHERE lead_id = $7
        RETURNING *
      `;
      const serviceRes = await client.query(updateServiceQuery, [
        tipo_servico,
        material,
        medidas_brutas,
        medidas_tecnicas ? JSON.stringify(medidas_tecnicas) : null,
        cor_acabamento,
        checklist_ia ? JSON.stringify(checklist_ia) : null,
        leadId
      ]);
      resultService = serviceRes.rows[0];
      console.log(`Lead de WhatsApp ${cleanWhatsapp} atualizado via Webhook.`);
    } else {
      const insertLeadQuery = `
        INSERT INTO leads (nome_cliente, whatsapp, origem, status_funil, resumo_ia, proxima_acao, temperatura_lead, resposta_sugerida)
        VALUES ($1, $2, 'WhatsApp', 'Novo lead', $3, $4, $5, $6)
        RETURNING *
      `;
      const leadRes = await client.query(insertLeadQuery, [
        nome_cliente ?? 'Novo Lead WhatsApp',
        whatsapp,
        resumo_ia,
        proxima_acao ?? 'Qualificar contato inicial.',
        temperatura_lead ?? 'Morno',
        resposta_sugerida
      ]);
      resultLead = leadRes.rows[0];
      leadId = resultLead.id;

      const insertServiceQuery = `
        INSERT INTO servicos (lead_id, tipo_servico, material, medidas_brutas, medidas_tecnicas, cor_acabamento, checklist_ia)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const serviceRes = await client.query(insertServiceQuery, [
        leadId,
        tipo_servico ?? null,
        material ?? null,
        medidas_brutas ?? null,
        medidas_tecnicas ? JSON.stringify(medidas_tecnicas) : null,
        cor_acabamento ?? null,
        checklist_ia ? JSON.stringify(checklist_ia) : null
      ]);
      resultService = serviceRes.rows[0];
      console.log(`Novo Lead de WhatsApp ${cleanWhatsapp} criado via Webhook.`);
    }

    // Inserir mensagem no histórico de conversa
    if (mensagem) {
      await client.query(
        `INSERT INTO mensagens_chat (lead_id, remetente, mensagem) VALUES ($1, 'cliente', $2)`,
        [leadId, mensagem]
      );
    }

    await client.query('COMMIT');
    res.json({
      status: 'success',
      lead: {
        ...resultLead,
        ...resultService
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na ingestão do webhook:', error);
    res.status(500).json({ error: 'Erro interno ao processar dados' });
  } finally {
    client.release();
  }
});

// 12. ENVIAR MENSAGEM WHATSAPP (HUMANO INICIADO - Evolution API)
router.post('/:id/send-message', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { mensagem, remetente } = req.body;

    if (!mensagem) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    const leadRes = await db.query('SELECT id, whatsapp, nome_cliente FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    const lead = leadRes.rows[0];

    const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://evolution.automacao.free.nf';
    const instanceName = process.env.EVOLUTION_INSTANCE || 'celularteste';
    const apiKey = process.env.EVOLUTION_API_KEY || '52397EAD055D-481F-8911-3F06BCC5D370';

    const clientMod = require('http');
    const https = require('https');
    const client = evolutionUrl.startsWith('https') ? https : clientMod;

    const payload = JSON.stringify({
      number: lead.whatsapp.replace(/\D/g, ''),
      options: { delay: 1200, presence: 'composing' },
      text: mensagem
    });

    const urlObj = new URL(`${evolutionUrl}/message/sendText/${instanceName}`);

    const evolutionRes = await new Promise((resolve, reject) => {
      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (evolutionUrl.startsWith('https') ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    // Salvar mensagem no chat
    await db.query(
      `INSERT INTO mensagens_chat (lead_id, remetente, mensagem) VALUES ($1, $2, $3)`,
      [leadId, remetente || 'vendedor', mensagem]
    );

    await db.query(
      `INSERT INTO timeline_eventos (lead_id, tipo, descricao, responsavel)
       VALUES ($1, 'mensagem_enviada', $2, $3)`,
      [leadId, `Vendedor enviou: "${mensagem.substring(0, 100)}"`, remetente || 'Vendedor']
    );

    res.json({
      status: evolutionRes.status === 201 || evolutionRes.status === 200 ? 'sent' : 'error',
      evolution_status: evolutionRes.status,
      evolution_response: evolutionRes.data
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem via Evolution' });
  }
});

// 12. OBTER TIMELINE DE EVENTOS DO LEAD
router.get('/:id/timeline', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { rows } = await db.query(
      'SELECT * FROM timeline_eventos WHERE lead_id = $1 ORDER BY created_at DESC',
      [leadId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao obter timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 13. CRIAR EVENTO NA TIMELINE
router.post('/:id/timeline', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { tipo, descricao, responsavel } = req.body;
    const { rows } = await db.query(
      `INSERT INTO timeline_eventos (lead_id, tipo, descricao, responsavel)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [leadId, tipo, descricao, responsavel || 'Sistema']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar evento na timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 14. TRIGGER n8n (Chama o webhook do n8n para processar IA)
router.post('/:id/trigger-n8n', async (req, res) => {
  try {
    const leadId = req.params.id;
    const leadRes = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    const lead = leadRes.rows[0];

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      return res.status(400).json({ error: 'N8N_WEBHOOK_URL não configurado no .env' });
    }

    const payload = {
      body: {
        data: {
          key: { remoteJid: lead.whatsapp + '@s.whatsapp.net' },
          pushName: lead.nome_cliente,
          message: {
            conversation: req.body.mensagem || 'Olá, gostaria de informações.'
          }
        }
      }
    };

    const https = require('https');
    const http = require('http');
    const client = n8nUrl.startsWith('https') ? https : http;

    const bodyStr = JSON.stringify(payload);
    const urlObj = new URL(n8nUrl);

    const n8nRes = await new Promise((resolve, reject) => {
      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (n8nUrl.startsWith('https') ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(bodyStr);
      req.end();
    });

    res.json({ status: 'triggered', n8n_status: n8nRes.status });
  } catch (error) {
    console.error('Erro ao trigger n8n:', error);
    res.status(500).json({ error: 'Erro ao acionar n8n' });
  }
});

// 15. OBTER INSIGHTS DO LEAD
router.get('/:id/insights', async (req, res) => {
  try {
    const leadId = req.params.id;

    const leadRes = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    const lead = leadRes.rows[0];

    const totalMensagens = await db.query(
      'SELECT COUNT(*) as qtd FROM mensagens_chat WHERE lead_id = $1',
      [leadId]
    );

    const ultimoContato = await db.query(
      'SELECT MAX(created_at) as ultimo FROM mensagens_chat WHERE lead_id = $1',
      [leadId]
    );

    const totalInteracoes = await db.query(
      'SELECT COUNT(*) as qtd FROM mensagens_chat WHERE lead_id = $1 AND remetente = $2',
      [leadId, 'cliente']
    );

    const diffDays = (date) => {
      const now = new Date();
      const then = new Date(date);
      const diff = now.getTime() - then.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    const diasUltimoContato = ultimoContato.rows[0].ultimo
      ? diffDays(ultimoContato.rows[0].ultimo)
      : diffDays(lead.created_at);

    const totalVisitas = await db.query(
      'SELECT COUNT(*) as qtd FROM compromissos WHERE lead_id = $1',
      [leadId]
    );

    res.json({
      total_mensagens: parseInt(totalMensagens.rows[0].qtd),
      total_interacoes_cliente: parseInt(totalInteracoes.rows[0].qtd),
      dias_ultimo_contato: diasUltimoContato,
      ultimo_contato_data: ultimoContato.rows[0].ultimo,
      total_visitas_agendadas: parseInt(totalVisitas.rows[0].qtd),
      lead_recorrente: totalInteracoes.rows[0].qtd > 3,
      risco_esfriar: diasUltimoContato > 7 && !['Finalizado', 'Perdido', 'Produção', 'Instalação'].includes(lead.status_funil)
    });
  } catch (error) {
    console.error('Erro ao obter insights:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

