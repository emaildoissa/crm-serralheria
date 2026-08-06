const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/materiais — Listar catálogo de materiais
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM materiais ORDER BY categoria ASC, nome ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar materiais:', error);
    res.status(500).json({ error: 'Erro interno ao buscar materiais.' });
  }
});

// POST /api/materiais — Criar novo item no catálogo
router.post('/', async (req, res) => {
  try {
    const {
      nome,
      categoria = 'Perfis de Alumínio',
      unidade = 'm²',
      fornecedor = '',
      preco_custo = 0,
      preco_venda = 0,
      margem_padrao_pct = 15,
      observacoes = ''
    } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome do material é obrigatório.' });
    }

    const query = `
      INSERT INTO materiais (
        nome, categoria, unidade, fornecedor,
        preco_custo, preco_venda, margem_padrao_pct, observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const result = await db.query(query, [
      nome,
      categoria,
      unidade,
      fornecedor,
      preco_custo,
      preco_venda || (Number(preco_custo) * (1 + Number(margem_padrao_pct) / 100)),
      margem_padrao_pct,
      observacoes
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ error: 'Erro ao cadastrar material.' });
  }
});

// PUT /api/materiais/:id — Atualizar material
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      categoria,
      unidade,
      fornecedor,
      preco_custo,
      preco_venda,
      margem_padrao_pct,
      observacoes
    } = req.body;

    const query = `
      UPDATE materiais
      SET nome = COALESCE($1, nome),
          categoria = COALESCE($2, categoria),
          unidade = COALESCE($3, unidade),
          fornecedor = COALESCE($4, fornecedor),
          preco_custo = COALESCE($5, preco_custo),
          preco_venda = COALESCE($6, preco_venda),
          margem_padrao_pct = COALESCE($7, margem_padrao_pct),
          observacoes = COALESCE($8, observacoes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *;
    `;

    const result = await db.query(query, [
      nome, categoria, unidade, fornecedor,
      preco_custo, preco_venda, margem_padrao_pct, observacoes, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ error: 'Erro ao atualizar material.' });
  }
});

// DELETE /api/materiais/:id — Excluir material
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM materiais WHERE id = $1', [id]);
    res.json({ message: 'Material excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ error: 'Erro ao excluir material.' });
  }
});

module.exports = router;
