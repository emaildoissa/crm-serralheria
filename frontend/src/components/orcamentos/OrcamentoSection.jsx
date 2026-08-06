import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Trash2, Zap, Layers, Percent, DollarSign, AlertCircle } from 'lucide-react';
import { PDFDownloadButton } from '../pdf/PDFDownloadButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function OrcamentoSection({ lead, onOrcamentoCriado }) {
  const [orcamentos, setOrcamentos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [modoPrecificacao, setModoPrecificacao] = useState('DIRETO'); // 'DIRETO' ou 'CATALOGO'
  const [percentualMajoracao, setPercentualMajoracao] = useState(0); // Ex: 15% de lucro/margem sobre a fábrica

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
      subtotal: lead?.valor_estimado || 0,
      material_id: ''
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

  const fetchMateriais = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/materiais`);
      if (res.ok) {
        const data = await res.json();
        setMateriais(data);
      }
    } catch (err) {
      console.error('Erro ao carregar catálogo de materiais:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrcamentos();
    fetchMateriais();
  }, [fetchOrcamentos, fetchMateriais]);

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
        subtotal: 0,
        material_id: ''
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

  const handleSelectMaterial = (index, materialId) => {
    const mat = materiais.find(m => m.id === materialId);
    if (!mat) return;

    const newItens = [...itens];
    newItens[index].material_id = materialId;
    newItens[index].descricao = `${mat.nome} (${mat.categoria})`;
    newItens[index].unidade = mat.unidade || 'un';
    newItens[index].preco_unitario = Number(mat.preco_venda || mat.preco_custo || 0);

    const qtd = Number(newItens[index].quantidade || 1);
    newItens[index].subtotal = qtd * newItens[index].preco_unitario;

    setItens(newItens);
  };

  const calcularBaseSubtotal = () => {
    return itens.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  };

  const calcularValorMajoracao = () => {
    const base = calcularBaseSubtotal();
    return base * (Number(percentualMajoracao || 0) / 100);
  };

  const calcularTotalFinal = () => {
    const base = calcularBaseSubtotal();
    const maj = calcularValorMajoracao();
    return Math.max(0, base + maj - Number(desconto || 0) + Number(acrescimo || 0));
  };

  const handleSaveOrcamento = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ajustar preço unitário final considerando a % de majoração
      const factor = 1 + (Number(percentualMajoracao || 0) / 100);
      const itensComMajoracao = itens.map(item => ({
        ...item,
        preco_unitario: Number(item.preco_unitario || 0) * factor,
        subtotal: Number(item.subtotal || 0) * factor
      }));

      const payload = {
        lead_id: lead.id,
        titulo,
        modo_precificacao: modoPrecificacao,
        percentual_majoracao: Number(percentualMajoracao),
        validade: validade || null,
        prazo_entrega: prazoEntrega,
        condicoes_pagamento: condicoesPagamento,
        observacoes,
        desconto: Number(desconto),
        acrescimo: Number(acrescimo),
        itens: itensComMajoracao
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
          
          {/* Seletor de Modo de Precificação */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${modoPrecificacao === 'DIRETO' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModoPrecificacao('DIRETO')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Zap size={15} /> ⚡ Preço Direto (Fabricante)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${modoPrecificacao === 'CATALOGO' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModoPrecificacao('CATALOGO')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Layers size={15} /> 📐 Catálogo de Materiais / m²
            </button>
          </div>

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
          <h4 style={{ fontSize: '0.85rem', marginTop: '16px', marginBottom: '8px', color: 'var(--text-muted)' }}>
            {modoPrecificacao === 'DIRETO' ? 'Itens / Peças (Com valores informados pela fábrica):' : 'Selecionar Itens do Catálogo:'}
          </h4>
          
          {itens.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: modoPrecificacao === 'CATALOGO' ? '1.5fr 1.5fr 70px 70px 70px 100px 36px' : '2fr 70px 70px 70px 110px 36px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              
              {modoPrecificacao === 'CATALOGO' && (
                <select
                  className="form-control"
                  value={item.material_id}
                  onChange={e => handleSelectMaterial(index, e.target.value)}
                >
                  <option value="">-- Selecionar do Catálogo --</option>
                  {materiais.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome} (R$ {Number(m.preco_venda || m.preco_custo).toFixed(2)})
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                placeholder="Descrição (ex: Janela Suprema 2F)"
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
                placeholder={modoPrecificacao === 'DIRETO' ? 'Custo Fábrica R$' : 'Preço Un R$'}
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

          {/* Majoração & Totais */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
                    <Percent size={14} /> Majoração / Margem sobre Fábrica (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 15%"
                    className="form-control"
                    style={{ width: '130px', borderColor: '#F59E0B' }}
                    value={percentualMajoracao}
                    onChange={e => setPercentualMajoracao(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Desconto (R$)</label>
                  <input type="number" className="form-control" style={{ width: '110px' }} value={desconto} onChange={e => setDesconto(parseFloat(e.target.value) || 0)} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Acréscimo (R$)</label>
                  <input type="number" className="form-control" style={{ width: '110px' }} value={acrescimo} onChange={e => setAcrescimo(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Custo Fábrica: R$ {calcularBaseSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                {percentualMajoracao > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#3B82F6' }}>
                    + Margem ({percentualMajoracao}%): R$ {calcularValorMajoracao().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10B981', marginTop: '4px' }}>
                  Total ao Cliente: R$ {calcularTotalFinal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
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
                  {orc.modo_precificacao === 'DIRETO' ? (
                    <span className="tag" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>⚡ Direto Fábrica</span>
                  ) : (
                    <span className="tag" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}>📐 Catálogo m²</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Criado em {new Date(orc.created_at).toLocaleDateString('pt-BR')} • {orc.itens?.length || 0} peça(s)
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
