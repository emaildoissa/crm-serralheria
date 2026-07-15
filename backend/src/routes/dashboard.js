const express = require('express');
const router = express.Router();
const db = require('../config/db');

// OBTER ESTATÍSTICAS E METRICAS DO DASHBOARD OPERACIONAL
router.get('/', async (req, res) => {
  try {
    // 1. Leads por status do funil
    const statusQuery = `
      SELECT status_funil, COUNT(*) as qtd, SUM(COALESCE(valor_estimado, 0)) as total_estimado
      FROM leads
      GROUP BY status_funil
    `;
    const statusRes = await db.query(statusQuery);

    // 2. Valores Gerais do Pipeline
    const pipelineQuery = `
      SELECT 
        SUM(COALESCE(valor_estimado, 0)) as valor_total_estimado,
        SUM(CASE WHEN status_funil = 'Fechado' OR status_funil = 'Produção' OR status_funil = 'Instalação' OR status_funil = 'Finalizado' THEN COALESCE(valor_fechado, valor_estimado, 0) ELSE 0 END) as valor_total_fechado,
        COUNT(CASE WHEN status_funil = 'Finalizado' OR status_funil = 'Fechado' THEN 1 END) as fechados_qtd,
        COUNT(CASE WHEN status_funil = 'Perdido' THEN 1 END) as perdidos_qtd
      FROM leads
    `;
    const pipelineRes = await db.query(pipelineQuery);

    // 3. Compromissos Pendentes (Medições e Instalações hoje e próximos dias)
    const compromissosQuery = `
      SELECT c.*, l.nome_cliente, l.whatsapp
      FROM compromissos c
      JOIN leads l ON c.lead_id = l.id
      WHERE c.status = 'Agendado' AND c.data_hora >= CURRENT_DATE
      ORDER BY c.data_hora ASC
      LIMIT 10
    `;
    const compromissosRes = await db.query(compromissosQuery);

    // 4. Produção Ativa
    const producaoQuery = `
      SELECT op.*, l.nome_cliente, s.tipo_servico, s.material
      FROM ordem_producao op
      JOIN leads l ON op.lead_id = l.id
      LEFT JOIN servicos s ON l.id = s.lead_id
      WHERE op.status != 'Pronto'
      ORDER BY op.created_at ASC
    `;
    const producaoRes = await db.query(producaoQuery);

    // 5. Insights de IA (Leads parados / Alertas de Medição / Motivos de Perda)
    // Leads parados há mais de 5 dias
    const leadsParadosQuery = `
      SELECT id, nome_cliente, status_funil, updated_at, proxima_acao, temperatura_lead
      FROM leads
      WHERE status_funil NOT IN ('Finalizado', 'Perdido', 'Fechado') 
        AND updated_at < NOW() - INTERVAL '5 days'
      ORDER BY updated_at ASC
      LIMIT 5
    `;
    const leadsParadosRes = await db.query(leadsParadosQuery);

    // Resumo de motivos de perda
    const motivosPerdaQuery = `
      SELECT motivo_perda, COUNT(*) as qtd
      FROM leads
      WHERE status_funil = 'Perdido' AND motivo_perda IS NOT NULL AND motivo_perda != ''
      GROUP BY motivo_perda
      ORDER BY qtd DESC
      LIMIT 5
    `;
    const motivosPerdaRes = await db.query(motivosPerdaQuery);

    res.json({
      status_funil: statusRes.rows,
      pipeline: pipelineRes.rows[0] || {
        valor_total_estimado: 0,
        valor_total_fechado: 0,
        fechados_qtd: 0,
        perdidos_qtd: 0
      },
      compromissos_proximos: compromissosRes.rows,
      producao_ativa: producaoRes.rows,
      insights_ia: {
        leads_parados: leadsParadosRes.rows,
        motivos_perda: motivosPerdaRes.rows
      }
    });
  } catch (error) {
    console.error('Erro ao gerar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
