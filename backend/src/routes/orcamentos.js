const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/orcamentos/lead/:leadId — Listar orçamentos de um lead
router.get('/lead/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const query = `
      SELECT o.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', i.id,
                   'descricao', i.descricao,
                   'quantidade', i.quantidade,
                   'unidade', i.unidade,
                   'largura', i.largura,
                   'altura', i.altura,
                   'preco_unitario', i.preco_unitario,
                   'subtotal', i.subtotal,
                   'imagem_url', i.imagem_url,
                   'ordem', i.ordem
                 ) ORDER BY i.ordem ASC, i.created_at ASC
               ) FILTER (WHERE i.id IS NOT NULL), '[]'
             ) AS itens
      FROM orcamentos o
      LEFT JOIN orcamento_itens i ON o.id = i.orcamento_id
      WHERE o.lead_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC;
    `;
    const result = await db.query(query, [leadId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar orçamentos do lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar orçamentos.' });
  }
});

// GET /api/orcamentos/:id — Buscar orçamento específico por ID com dados do Lead
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT o.*, 
             l.nome_cliente, l.whatsapp, l.endereco_obra,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', i.id,
                   'descricao', i.descricao,
                   'quantidade', i.quantidade,
                   'unidade', i.unidade,
                   'largura', i.largura,
                   'altura', i.altura,
                   'preco_unitario', i.preco_unitario,
                   'subtotal', i.subtotal,
                   'imagem_url', i.imagem_url,
                   'ordem', i.ordem
                 ) ORDER BY i.ordem ASC, i.created_at ASC
               ) FILTER (WHERE i.id IS NOT NULL), '[]'
             ) AS itens
      FROM orcamentos o
      JOIN leads l ON o.lead_id = l.id
      LEFT JOIN orcamento_itens i ON o.id = i.orcamento_id
      WHERE o.id = $1
      GROUP BY o.id, l.nome_cliente, l.whatsapp, l.endereco_obra;
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar orçamento.' });
  }
});

// POST /api/orcamentos — Criar novo orçamento para um Lead
router.post('/', async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const {
      lead_id,
      titulo = 'Orçamento de Esquadrias',
      validade,
      desconto = 0,
      acrescimo = 0,
      condicoes_pagamento = '50% entrada + 50% na instalação',
      prazo_entrega = '15 a 20 dias úteis',
      observacoes = 'Garantia de 5 anos nos perfis e 1 ano nos acessórios.',
      itens = []
    } = req.body;

    if (!lead_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'lead_id é obrigatório.' });
    }

    // Calcular subtotal e total
    let totalItens = 0;
    itens.forEach(item => {
      const subtotal = Number(item.subtotal ?? (Number(item.quantidade || 1) * Number(item.preco_unitario || 0)));
      totalItens += subtotal;
    });

    const totalFinal = Math.max(0, totalItens - Number(desconto) + Number(acrescimo));

    const insertOrcamentoQuery = `
      INSERT INTO orcamentos (
        lead_id, titulo, validade, desconto, acrescimo, total,
        condicoes_pagamento, prazo_entrega, observacoes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Enviado')
      RETURNING *;
    `;
    const orcamentoRes = await client.query(insertOrcamentoQuery, [
      lead_id,
      titulo,
      validade || null,
      desconto,
      acrescimo,
      totalFinal,
      condicoes_pagamento,
      prazo_entrega,
      observacoes
    ]);

    const novoOrcamento = orcamentoRes.rows[0];

    // Inserir itens
    const itensInseridos = [];
    for (let index = 0; index < itens.length; index++) {
      const item = itens[index];
      const subtotal = Number(item.subtotal ?? (Number(item.quantidade || 1) * Number(item.preco_unitario || 0)));
      const insertItemQuery = `
        INSERT INTO orcamento_itens (
          orcamento_id, descricao, quantidade, unidade, largura, altura,
          preco_unitario, subtotal, imagem_url, ordem
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const itemRes = await client.query(insertItemQuery, [
        novoOrcamento.id,
        item.descricao || 'Item de Esquadria',
        item.quantidade || 1,
        item.unidade || 'un',
        item.largura || null,
        item.altura || null,
        item.preco_unitario || 0,
        subtotal,
        item.imagem_url || null,
        index
      ]);
      itensInseridos.push(itemRes.rows[0]);
    }

    // Atualizar valor_estimado do Lead no CRM
    await client.query(
      `UPDATE leads SET valor_estimado = $1, status_funil = CASE WHEN status_funil = 'Novo Lead' THEN 'Orçamento Enviado' ELSE status_funil END, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [totalFinal, lead_id]
    );

    // Registrar na timeline de eventos do Lead
    await client.query(
      `INSERT INTO timeline_eventos (lead_id, tipo, descricao, responsavel) VALUES ($1, 'ORCAMENTO_GERADO', $2, 'Sistema')`,
      [lead_id, `Orçamento #${novoOrcamento.numero} gerado no valor de R$ ${totalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
    );

    await client.query('COMMIT');

    novoOrcamento.itens = itensInseridos;
    res.status(201).json(novoOrcamento);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ error: 'Erro ao salvar orçamento.' });
  } finally {
    client.release();
  }
});

// DELETE /api/orcamentos/:id — Excluir orçamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM orcamentos WHERE id = $1', [id]);
    res.json({ message: 'Orçamento excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({ error: 'Erro ao excluir orçamento.' });
  }
});

module.exports = router;
