import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Search, Trash2, Edit3, DollarSign, Percent, Tag, Building2, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function MateriaisPage() {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nome: '',
    categoria: 'Perfis de Alumínio',
    unidade: 'm²',
    fornecedor: '',
    preco_custo: 0,
    preco_venda: 0,
    margem_padrao_pct: 15,
    observacoes: ''
  });

  const fetchMateriais = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/materiais`);
      if (res.ok) {
        const data = await res.json();
        setMateriais(data);
      }
    } catch (err) {
      console.error('Erro ao carregar materiais:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMateriais();
  }, [fetchMateriais]);

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API_URL}/materiais/${editingId}` : `${API_URL}/materiais`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setIsFormOpen(false);
        setEditingId(null);
        setForm({
          nome: '',
          categoria: 'Perfis de Alumínio',
          unidade: 'm²',
          fornecedor: '',
          preco_custo: 0,
          preco_venda: 0,
          margem_padrao_pct: 15,
          observacoes: ''
        });
        fetchMateriais();
      }
    } catch (err) {
      console.error('Erro ao salvar material:', err);
    }
  };

  const handleEdit = (mat) => {
    setEditingId(mat.id);
    setForm({
      nome: mat.nome,
      categoria: mat.categoria || 'Perfis de Alumínio',
      unidade: mat.unidade || 'm²',
      fornecedor: mat.fornecedor || '',
      preco_custo: Number(mat.preco_custo || 0),
      preco_venda: Number(mat.preco_venda || 0),
      margem_padrao_pct: Number(mat.margem_padrao_pct || 15),
      observacoes: mat.observacoes || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este item do catálogo?')) return;
    try {
      const res = await fetch(`${API_URL}/materiais/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMateriais();
      }
    } catch (err) {
      console.error('Erro ao excluir material:', err);
    }
  };

  const filteredMateriais = materiais.filter(m => {
    const matchSearch = m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || m.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'TODOS' || m.categoria === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Layers size={24} style={{ color: '#D97706' }} /> Catálogo de Materiais & Precificação
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px', margin: 0 }}>
            Gerencie perfis, vidros e tabelas de preços de fornecedores para orçamentos rápidos e precisos.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setForm({
              nome: '',
              categoria: 'Perfis de Alumínio',
              unidade: 'm²',
              fornecedor: '',
              preco_custo: 0,
              preco_venda: 0,
              margem_padrao_pct: 15,
              observacoes: ''
            });
            setIsFormOpen(!isFormOpen);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> {isFormOpen ? 'Fechar Formulário' : 'Novo Material / Perfil'}
        </button>
      </div>

      {/* Formulário Novo / Editar */}
      {isFormOpen && (
        <form onSubmit={handleSaveMaterial} className="glass-container" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#F59E0B' }}>
            {editingId ? 'Editar Item do Catálogo' : 'Cadastrar Novo Material / Preço de Referência'}
          </h3>

          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nome do Material / Peça</label>
              <input
                type="text"
                placeholder="Ex: Linha Suprema - Janela 2 Folhas"
                className="form-control"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                className="form-control"
                value={form.categoria}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
              >
                <option value="Perfis de Alumínio">Perfis de Alumínio</option>
                <option value="Perfis de PVC">Perfis de PVC</option>
                <option value="Madeira Engenheirada">Madeira Engenheirada</option>
                <option value="Vidros Temperados / Laminados">Vidros Temperados / Laminados</option>
                <option value="Acessórios / Ferragens">Acessórios / Ferragens</option>
                <option value="Motorização / Automação">Motorização / Automação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unidade de Medida</label>
              <select
                className="form-control"
                value={form.unidade}
                onChange={e => setForm({ ...form, unidade: e.target.value })}
              >
                <option value="m²">m² (Metro quadrado)</option>
                <option value="m">m (Metro linear)</option>
                <option value="un">un (Unidade)</option>
                <option value="kg">kg (Quilo)</option>
                <option value="conjunto">conjunto (Conjunto)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fabricante / Fornecedor</label>
              <input
                type="text"
                placeholder="Ex: Alcoa / Belmetal / Blindex"
                className="form-control"
                value={form.fornecedor}
                onChange={e => setForm({ ...form, fornecedor: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preço de Custo / Fábrica (R$)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={form.preco_custo}
                onChange={e => {
                  const custo = parseFloat(e.target.value) || 0;
                  const venda = custo * (1 + Number(form.margem_padrao_pct) / 100);
                  setForm({ ...form, preco_custo: custo, preco_venda: venda });
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Margem Padrão (%)</label>
              <input
                type="number"
                step="1"
                className="form-control"
                value={form.margem_padrao_pct}
                onChange={e => {
                  const margem = parseFloat(e.target.value) || 0;
                  const venda = Number(form.preco_custo) * (1 + margem / 100);
                  setForm({ ...form, margem_padrao_pct: margem, preco_venda: venda });
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preço Final de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={form.preco_venda}
                onChange={e => setForm({ ...form, preco_venda: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> Salvar Item
            </button>
          </div>
        </form>
      )}

      {/* Filtros e Busca */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por material ou fornecedor..."
            className="form-control"
            style={{ paddingLeft: '38px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '220px' }}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="TODOS">Todas as Categorias</option>
          <option value="Perfis de Alumínio">Perfis de Alumínio</option>
          <option value="Perfis de PVC">Perfis de PVC</option>
          <option value="Madeira Engenheirada">Madeira Engenheirada</option>
          <option value="Vidros Temperados / Laminados">Vidros Temperados / Laminados</option>
          <option value="Acessórios / Ferragens">Acessórios / Ferragens</option>
        </select>
      </div>

      {/* Tabela de Materiais */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Carregando materiais...</p>
      ) : filteredMateriais.length > 0 ? (
        <div className="glass-container" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '14px 16px' }}>Material / Descrição</th>
                <th style={{ padding: '14px 16px' }}>Categoria</th>
                <th style={{ padding: '14px 16px' }}>Unidade</th>
                <th style={{ padding: '14px 16px' }}>Fornecedor</th>
                <th style={{ padding: '14px 16px' }}>Custo Fábrica</th>
                <th style={{ padding: '14px 16px' }}>Margem</th>
                <th style={{ padding: '14px 16px' }}>Preço Venda</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMateriais.map(mat => (
                <tr key={mat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{mat.nome}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{mat.categoria}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="tag tag-service" style={{ fontSize: '0.75rem' }}>{mat.unidade}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{mat.fornecedor || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>R$ {Number(mat.preco_custo || 0).toFixed(2)}</td>
                  <td style={{ padding: '14px 16px', color: '#3B82F6' }}>+{mat.margem_padrao_pct}%</td>
                  <td style={{ padding: '14px 16px', color: '#10B981', fontWeight: 'bold' }}>
                    R$ {Number(mat.preco_venda || 0).toFixed(2)} / {mat.unidade}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '6px' }} onClick={() => handleEdit(mat)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '6px', color: '#EF4444' }} onClick={() => handleDelete(mat.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-container" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Nenhum material encontrado no catálogo.</p>
        </div>
      )}
    </div>
  );
}
