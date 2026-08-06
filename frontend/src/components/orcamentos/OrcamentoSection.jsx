import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Trash2, Calendar, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { PDFDownloadButton } from '../pdf/PDFDownloadButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function OrcamentoSection({ lead, onOrcamentoCriado }) {
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('Orçamento de Esquadrias');
  const [validade, setValidade] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('15 a 20 dias úteis');
  const [condicoesPagamento, setCondicoesPagamento] = useState('50% entrada + 50% na conclusão');
  const [observacoes, setObservacoes] = useState('Garantia de 5 anos nos perfis e 1 ano nos acessórios.');
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);

  // Initial Item prepopulated from Lead details
  const [itens, setItens] = useState([
    {
      descricao: lead?.servicos?.[0]?.tipo_servico || lead?.tipo_servico || 'Janela de Alumínio Linha Suprema',
      quantidade: 1,
      unidade: 'un',
      largura: lead?.servicos?.[0]?.medidas_tecnicas?.largura || '',
      altura: lead?.servicos?.[0]?.medidas_tecnicas?.altura || '',
      preco_unitario: lead?.valor_estimado || 0,
      subtotal: lead?.valor_estimado || 0
    }
  ]);

  const fetchOrcamentos = useCallback(async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orcamentos/lead/${lead.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrcamentos(data);
      }
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    }
    setLoading(false);
  }, [lead?.id]);

  useEffect(() => {
    fetchOrcamentos();
  }, [fetchOrcamentos]);

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        descricao: '',
        quantidade: 1,
        unidade: 'un',
        largura: '',
        altura: '',
        preco_unitario: 0,
        subtotal: 0
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (itens.length === 1) return;
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index][field] = value;
    
    // Auto calc subtotal
    const qtd = Number(newItens[index].quantidade || 1);
    const preco = Number(newItens[index].preco_unitario || 0);
    newItens[index].subtotal = qtd * preco;

    setItens(newItens);
  };

  const calcularSubtotal = () => {
    return itens.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  };

  const calcularTotalFinal = () => {
    const sub = calcularSubtotal();
    return Math.max(0, sub - Number(desconto || 0) + Number(acrescimo || 0));
  };

  const handleSaveOrcamento = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        lead_id: lead.id,
        titulo,
        validade: validade || null,
        prazo_entrega: prazoEntrega,
        condicoes_pagamento: condicoesPagamento,
        observacoes,
        desconto: Number(desconto),
        acrescimo: Number(acrescimo),
        itens
      };

      const res = await fetch(`${API_URL}/orcamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsFormOpen(false);
        fetchOrcamentos();
        if (onOrcamentoCriado) onOrcamentoCriado();
      }
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err);
    }
    setSaving(false);
  };

  const handleDeleteOrcamento = async (id) => {
    if (!window.confirm('Deseja excluir este orçamento?')) return;
    try {
      const res = await fetch(`${API_URL}/orcamentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOrcamentos();
      }
    } catch (err) {
      console.error('Erro ao excluir orçamento:', err);
    }
  };

  return (
    <div className="glass-container" style={{ padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: '#D97706' }} /> Orçamentos & Emissão de PDF
        </h3>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsFormOpen(!isFormOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> {isFormOpen ? 'Fechar Formulário' : 'Criar Novo Orçamento'}
        </button>
      </div>

      {/* Form de Criação de Orçamento */}
      {isFormOpen && (
        <form onSubmit={handleSaveOrcamento} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: '#F59E0B' }}>Especificações da Proposta Comercial</h4>
          
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Título da Proposta</label>
              <input type="text" className="form-control" value={titulo} onChange={e => setTitulo(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Validade da Proposta</label>
              <input type="date" className="form-control" value={validade} onChange={e => setValidade(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Prazo de Entrega</label>
              <input type="text" className="form-control" value={prazoEntrega} onChange={e => setPrazoEntrega(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Condição de Pagamento</label>
              <input type="text" className="form-control" value={condicoesPagamento} onChange={e => setCondicoesPagamento(e.target.value)} />
            </div>
          </div>

          {/* Lista de Itens */}
          <h4 style={{ fontSize: '0.85rem', marginTop: '16px', marginBottom: '8px', color: 'var(--text-muted)' }}>Itens / Peças de Esquadrias:</h4>
          
          {itens.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 120px 40px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Descrição (ex: Janela Suprema 2F com vidro)"
                className="form-control"
                value={item.descricao}
                onChange={e => handleItemChange(index, 'descricao', e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Qtd"
                className="form-control"
                value={item.quantidade}
                onChange={e => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 1)}
                min="1"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Larg (m)"
                className="form-control"
                value={item.largura}
                onChange={e => handleItemChange(index, 'largura', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Alt (m)"
                className="form-control"
                value={item.altura}
                onChange={e => handleItemChange(index, 'altura', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Preço R$"
                className="form-control"
                value={item.preco_unitario}
                onChange={e => handleItemChange(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleRemoveItem(index)}
                style={{ padding: '6px', color: '#EF4444' }}
                disabled={itens.length === 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddItem}
            style={{ marginTop: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Adicionar Outra Peça / Item
          </button>

          {/* Totais e Descontos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Desconto (R$)</label>
                <input type="number" className="form-control" style={{ width: '120px' }} value={desconto} onChange={e => setDesconto(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Acréscimo (R$)</label>
                <input type="number" className="form-control" style={{ width: '120px' }} value={acrescimo} onChange={e => setAcrescimo(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subtotal: R$ {calcularSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#F59E0B', marginTop: '2px' }}>
                Total Final: R$ {calcularTotalFinal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Gerando Orçamento...' : 'Gerar Orçamento & Salvar'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Orçamentos Existentes */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Carregando orçamentos...</p>
      ) : orcamentos.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orcamentos.map((orc) => (
            <div
              key={orc.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '1rem', color: '#FFF' }}>Orçamento #{orc.numero}</strong>
                  <span className="tag tag-service" style={{ fontSize: '0.75rem', backgroundColor: '#D97706', color: '#FFF' }}>
                    {orc.status || 'Enviado'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Criado em {new Date(orc.created_at).toLocaleDateString('pt-BR')} • {orc.itens?.length || 0} peça(s) especificada(s)
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10B981', marginTop: '4px' }}>
                  R$ {Number(orc.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PDFDownloadButton orcamento={orc} lead={lead} buttonText="Baixar PDF" />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDeleteOrcamento(orc.id)}
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  title="Excluir Orçamento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
          <AlertCircle size={28} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Nenhum orçamento em PDF emitido para este cliente ainda.
          </p>
        </div>
      )}
    </div>
  );
}
