const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/conhecimento - Buscar todas as regras da Base de Conhecimento
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM conhecimento_ia ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar base de conhecimento:', error);
    res.status(500).json({ error: 'Erro ao buscar base de conhecimento' });
  }
});

// POST /api/conhecimento - Criar nova regra na Base de Conhecimento
router.post('/', async (req, res) => {
  try {
    const { categoria, titulo, conteudo } = req.body;
    if (!categoria || !titulo || !conteudo) {
      return res.status(400).json({ error: 'Campos obrigatórios: categoria, titulo, conteudo' });
    }
    const result = await db.query(
      'INSERT INTO conhecimento_ia (categoria, titulo, conteudo) VALUES ($1, $2, $3) RETURNING *',
      [categoria, titulo, conteudo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar regra de conhecimento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/conhecimento/:id - Atualizar regra existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, titulo, conteudo, ativo } = req.body;
    const result = await db.query(
      'UPDATE conhecimento_ia SET categoria = $1, titulo = $2, conteudo = $3, ativo = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [categoria, titulo, conteudo, ativo !== undefined ? ativo : true, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar conhecimento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/conhecimento/:id - Excluir regra
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM conhecimento_ia WHERE id = $1', [id]);
    res.json({ message: 'Regra removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conhecimento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
