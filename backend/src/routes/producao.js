const express = require('express');
const router = express.Router();
const db = require('../db');

// Listar todas as Ordens de Produção
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        op.*,
        l.nome_cliente,
        l.whatsapp,
        l.endereco_obra,
        l.status_funil,
        o.numero as orcamento_numero,
        o.total as orcamento_total,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'descricao', oi.descricao,
              'quantidade', oi.quantidade,
              'unidade', oi.unidade,
              'largura', oi.largura,
              'altura', oi.altura
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as itens
      FROM ordens_producao op
      JOIN leads l ON op.lead_id = l.id
      LEFT JOIN orcamentos o ON op.orcamento_id = o.id
      LEFT JOIN orcamento_itens oi ON o.id = oi.orcamento_id
      GROUP BY op.id, l.id, o.id
      ORDER BY op.created_at DESC;
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar ordens de produção:', error);
    res.status(500).json({ error: 'Erro ao listar ordens de produção' });
  }
});

// Criar nova Ordem de Produção manualmente
router.post('/', async (req, res) => {
  const { lead_id, orcamento_id, status, prazo_fabricacao, responsavel, observacoes } = req.body;
  try {
    const numRes = await db.query("SELECT COUNT(*) + 1001 as num FROM ordens_producao");
    const opNumber = numRes.rows[0].num;
    const codigo_op = `OP-${opNumber}`;

    const query = `
      INSERT INTO ordens_producao (lead_id, orcamento_id, codigo_op, status, prazo_fabricacao, responsavel, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [
      lead_id,
      orcamento_id || null,
      codigo_op,
      status || 'Aguardando Medição Final',
      prazo_fabricacao || null,
      responsavel || 'Equipe de Fábrica',
      observacoes || ''
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar ordem de produção:', error);
    res.status(500).json({ error: 'Erro ao criar ordem de produção' });
  }
});

// Atualizar status de uma Ordem de Produção
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, responsavel, observacoes } = req.body;

  try {
    const query = `
      UPDATE ordens_producao
      SET 
        status = COALESCE($1, status),
        responsavel = COALESCE($2, responsavel),
        observacoes = COALESCE($3, observacoes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;
    const { rows } = await db.query(query, [status, responsavel, observacoes, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ordem de produção não encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status da produção:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da produção' });
  }
});

// Excluir Ordem de Produção
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM ordens_producao WHERE id = $1', [id]);
    res.json({ message: 'Ordem de produção excluída' });
  } catch (error) {
    console.error('Erro ao excluir ordem de produção:', error);
    res.status(500).json({ error: 'Erro ao excluir ordem de produção' });
  }
});

module.exports = router;
