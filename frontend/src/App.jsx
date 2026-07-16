import React, { useState, useEffect } from 'react';
import {
  DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Calendar, 
  Wrench, 
  Plus, 
  Phone, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  MessageSquare,
  User,
  Layers,
  Camera,
  Trash2,
  FileEdit,
  Ruler,
  RefreshCw,
  CheckSquare,
  ArrowRight,
  Lightbulb,
  History,
  Send,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';

const API_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : (import.meta.env.VITE_API_URL || '/api');

// Lista das 13 fases do funil da serralheria
const COLUMNS = [
  { id: 'Novo lead', label: 'Novo Lead', color: 'var(--color-novo)' },
  { id: 'Contato iniciado', label: 'Contato Iniciado', color: 'var(--color-novo)' },
  { id: 'Qualificação', label: 'Qualificação', color: 'var(--color-novo)' },
  { id: 'Medição agendada', label: 'Medição Agendada', color: 'var(--color-medicao)' },
  { id: 'Medição realizada', label: 'Medição Realizada', color: 'var(--color-medicao)' },
  { id: 'Orçamento em elaboração', label: 'Orçamento em Elaboração', color: 'var(--color-orcamento)' },
  { id: 'Orçamento enviado', label: 'Orçamento Enviado', color: 'var(--color-orcamento)' },
  { id: 'Negociação', label: 'Negociação', color: 'var(--color-negociacao)' },
  { id: 'Fechado', label: 'Fechado', color: 'var(--color-fechado)' },
  { id: 'Produção', label: 'Produção', color: 'var(--color-producao)' },
  { id: 'Instalação', label: 'Instalação', color: 'var(--color-instalacao)' },
  { id: 'Finalizado', label: 'Finalizado', color: 'var(--color-finalizado)' },
  { id: 'Perdido', label: 'Perdido', color: 'var(--color-perdido)' }
];

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, kanban, agenda, producao
  const [leads, setLeads] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Modais e Detalhes
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Estados de Form
  const [newLeadForm, setNewLeadForm] = useState({
    nome_cliente: '',
    whatsapp: '',
    origem: 'WhatsApp',
    status_funil: 'Novo lead',
    endereco_obra: '',
    prazo_desejado: '',
    complexidade: 'Média',
    valor_estimado: 0,
    tipo_servico: 'Portão',
    material: 'Alumínio',
    medidas_brutas: '',
    cor_acabamento: 'Preto',
    necessita_instalacao: true
  });

  const [editForm, setEditForm] = useState(null);

  // Estados de Novos Compromissos / Produção
  const [newCompromisso, setNewCompromisso] = useState({
    tipo: 'Medição',
    data_hora: '',
    responsavel: '',
    observacoes: ''
  });

  const [newFoto, setNewFoto] = useState({
    url_foto: '',
    tipo: 'Antes',
    legenda: ''
  });

  const [_errorMsg, setErrorMsg] = useState('');

  // Novos estados para timeline, insights e layout
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [leadInsights, setLeadInsights] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedPanels, setExpandedPanels] = useState({ conversa: false, timeline: false, insights: true });

  const togglePanel = (panel) => {
    setExpandedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  // Carregar todos os leads e dados de dashboard
  useEffect(() => {
    fetchLeads();
    fetchDashboardData();
  }, []);

  // Recarregar dados do lead selecionado para atualizar as abas secundárias
  useEffect(() => {
    if (selectedLeadId) {
      fetchLeadDetail(selectedLeadId);
      fetchTimeline(selectedLeadId);
      fetchInsights(selectedLeadId);
      setEditMode(false);
      setExpandedPanels({ conversa: false, timeline: false, insights: true });
    }
  }, [selectedLeadId]);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/leads`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  };

  const fetchLeadDetail = async (id) => {
    try {
      const res = await fetch(`${API_URL}/leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLeadDetail(data);
        setEditForm(data.lead);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do lead:', err);
    }
  };

  const fetchTimeline = async (id) => {
    try {
      const res = await fetch(`${API_URL}/leads/${id}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTimelineEvents(data);
      }
    } catch (err) {
      console.error('Erro ao carregar timeline:', err);
    }
  };

  const fetchInsights = async (id) => {
    try {
      const res = await fetch(`${API_URL}/leads/${id}/insights`);
      if (res.ok) {
        const data = await res.json();
        setLeadInsights(data);
      }
    } catch (err) {
      console.error('Erro ao carregar insights:', err);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadForm)
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewLeadForm({
          nome_cliente: '',
          whatsapp: '',
          origem: 'WhatsApp',
          status_funil: 'Novo lead',
          endereco_obra: '',
          prazo_desejado: '',
          complexidade: 'Média',
          valor_estimado: 0,
          tipo_servico: 'Portão',
          material: 'Alumínio',
          medidas_brutas: '',
          cor_acabamento: 'Preto',
          necessita_instalacao: true
        });
        fetchLeads();
        fetchDashboardData();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Erro ao criar lead');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Falha na requisição');
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/leads/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        fetchLeadDetail(editForm.id);
        fetchLeads();
        fetchDashboardData();
        alert('Cadastro atualizado com sucesso!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_funil: newStatus })
      });
      if (res.ok) {
        fetchLeads();
        fetchDashboardData();
        if (selectedLeadId === leadId) {
          fetchLeadDetail(leadId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta obra/lead?')) return;
    try {
      const res = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedLeadId(null);
        setLeadDetail(null);
        fetchLeads();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCompromisso = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/leads/${selectedLeadId}/compromissos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompromisso)
      });
      if (res.ok) {
        setNewCompromisso({ tipo: 'Medição', data_hora: '', responsavel: '', observacoes: '' });
        fetchLeadDetail(selectedLeadId);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCompromissoStatus = async (compId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/leads/compromissos/${compId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLeadDetail(selectedLeadId);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProducao = async (producaoData) => {
    try {
      const res = await fetch(`${API_URL}/leads/${selectedLeadId}/producao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producaoData)
      });
      if (res.ok) {
        fetchLeadDetail(selectedLeadId);
        fetchDashboardData();
        alert('Ordem de produção salva!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFoto = async (e) => {
    e.preventDefault();
    if (!newFoto.url_foto) return;
    try {
      const res = await fetch(`${API_URL}/leads/${selectedLeadId}/fotos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFoto)
      });
      if (res.ok) {
        setNewFoto({ url_foto: '', tipo: 'Antes', legenda: '' });
        fetchLeadDetail(selectedLeadId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [sendingMsg, setSendingMsg] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      handleUpdateStatus(active.id, over.id);
    }
  }

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedLeadId) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API_URL}/leads/${selectedLeadId}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: replyText, remetente: 'vendedor' })
      });
      if (res.ok) {
        setReplyText('');
        fetchLeadDetail(selectedLeadId);
      }
    } catch (err) {
      console.error(err);
    }
    setSendingMsg(false);
  };

  function KanbanCard({ lead }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: lead.id,
      data: { status_funil: lead.status_funil }
    });
    const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 999, opacity: 0.85 } : {};
    return (
      <div ref={setNodeRef} {...listeners} {...attributes} className="kanban-card" onClick={() => setSelectedLeadId(lead.id)} style={style}>
        <div className="kanban-card-title">{lead.nome_cliente}</div>
        <div className="kanban-card-meta">
          <div className="meta-row"><Phone size={12} /><span>{lead.whatsapp || 'Sem WhatsApp'}</span></div>
          {lead.endereco_obra && <div className="meta-row"><MapPin size={12} /><span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>{lead.endereco_obra}</span></div>}
        </div>
        <div className="kanban-card-tags">
          {lead.tipo_servico && <span className="tag tag-service">{lead.tipo_servico}</span>}
          {lead.material && <span className="tag tag-material">{lead.material}</span>}
          {lead.temperatura_lead && <span className={`tag tag-temp-${lead.temperatura_lead.toLowerCase()}`}>{lead.temperatura_lead}</span>}
        </div>
        <div className="kanban-card-footer">
          <span className="card-value">{lead.valor_fechado > 0 ? formatCurrency(lead.valor_fechado) : formatCurrency(lead.valor_estimado)}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(lead.updated_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    );
  }

  function KanbanColumn({ col, leads }) {
    const { setNodeRef, isOver } = useDroppable({ id: col.id });
    return (
      <div ref={setNodeRef} className="kanban-column" style={{ backgroundColor: isOver ? 'rgba(67, 97, 238, 0.08)' : 'transparent' }}>
        <div className="kanban-column-header" style={{ borderBottomColor: col.color }}>
          <span className="kanban-column-title">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }}></span>
            {col.label}
          </span>
          <span className="kanban-column-count">{leads.length}</span>
        </div>
        <div className="kanban-cards-container">
          {leads.map(lead => <KanbanCard key={lead.id} lead={lead} />)}
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="app-container">
      {/* Sidebar de Navegação */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">S</div>
          <span className="sidebar-brand-text">Serralheria OS</span>
        </div>
        
        <ul className="sidebar-menu">
          <li>
            <a 
              className={`sidebar-menu-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('dashboard'); fetchDashboardData(); }}
            >
              <LayoutDashboard size={20} />
              Dashboard & IA
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-menu-item ${currentTab === 'kanban' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('kanban'); fetchLeads(); }}
            >
              <KanbanSquare size={20} />
              Funil de Obras
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-menu-item ${currentTab === 'agenda' ? 'active' : ''}`}
              onClick={() => setCurrentTab('agenda')}
            >
              <Calendar size={20} />
              Agenda Técnica
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-menu-item ${currentTab === 'producao' ? 'active' : ''}`}
              onClick={() => setCurrentTab('producao')}
            >
              <Wrench size={20} />
              Fábrica & Produção
            </a>
          </li>
        </ul>
        <div className="sidebar-footer">
          <span>v1.2.0 - Dockerizado</span>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="main-content">
        <header className="app-header">
          <div className="header-title-area">
            <h1>
              {currentTab === 'dashboard' && 'Dashboard & Inteligência de Operação'}
              {currentTab === 'kanban' && 'Painel Operacional (Estágios da Obra)'}
              {currentTab === 'agenda' && 'Controle de Visitas, Medição e Instalação'}
              {currentTab === 'producao' && 'Status de Produção e Fábrica'}
            </h1>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} /> Novo Pedido / Lead
            </button>
          </div>
        </header>

        {/* -------------------- TAB: DASHBOARD & IA -------------------- */}
        {currentTab === 'dashboard' && dashboardData && (
          <div className="dashboard-grid">
            <div className="metric-card glass-container">
              <div className="metric-data">
                <h4>Pipeline Estimado</h4>
                <p>{formatCurrency(dashboardData.pipeline.valor_total_estimado)}</p>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(67, 97, 238, 0.15)', color: 'var(--primary)' }}>
                <DollarSign size={24} />
              </div>
            </div>

            <div className="metric-card glass-container">
              <div className="metric-data">
                <h4>Faturamento Fechado</h4>
                <p>{formatCurrency(dashboardData.pipeline.valor_total_fechado)}</p>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(6, 214, 160, 0.15)', color: 'var(--color-fechado)' }}>
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="metric-card glass-container">
              <div className="metric-data">
                <h4>Conversão (Fechados)</h4>
                <p>
                  {dashboardData.pipeline.fechados_qtd + dashboardData.pipeline.perdidos_qtd > 0 
                    ? ((dashboardData.pipeline.fechados_qtd / (dashboardData.pipeline.fechados_qtd + dashboardData.pipeline.perdidos_qtd)) * 100).toFixed(0) + '%'
                    : '100%'}
                </p>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(76, 201, 240, 0.15)', color: 'var(--color-instalacao)' }}>
                <Layers size={24} />
              </div>
            </div>

            <div className="metric-card glass-container">
              <div className="metric-data">
                <h4>Ordens de Produção</h4>
                <p>{dashboardData.producao_ativa.length} ativas</p>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 183, 3, 0.15)', color: 'var(--color-producao)' }}>
                <Wrench size={24} />
              </div>
            </div>

            {/* Leads Parados (Alerta IA) */}
            <div className="db-section-large glass-container">
              <h3><AlertTriangle size={20} color="var(--temp-quente)" /> Alertas de Ação da IA (Leads Parados/Esfriando)</h3>
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fase Atual</th>
                    <th>Última Atualização</th>
                    <th>Temperatura</th>
                    <th>Próxima Ação Sugerida pela IA</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.insights_ia.leads_parados.length > 0 ? (
                    dashboardData.insights_ia.leads_parados.map(lead => (
                      <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLeadId(lead.id)}>
                        <td><strong>{lead.nome_cliente}</strong></td>
                        <td>{lead.status_funil}</td>
                        <td>{new Date(lead.updated_at).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <span className={`tag tag-temp-${lead.temperatura_lead?.toLowerCase()}`}>
                            {lead.temperatura_lead}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-main)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={14} color="#829aff" /> {lead.proxima_acao || 'Solicitar fotos complementares ou agendar medição.'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum lead com alerta de inatividade! Operação em dia.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Compromissos da Semana */}
            <div className="db-section-large glass-container">
              <h3><Calendar size={20} color="var(--primary)" /> Próximas Medições & Instalações</h3>
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Cliente</th>
                    <th>Data & Hora</th>
                    <th>Responsável</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.compromissos_proximos.length > 0 ? (
                    dashboardData.compromissos_proximos.map(comp => (
                      <tr key={comp.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLeadId(comp.lead_id)}>
                        <td>
                          <span className={`tag ${comp.tipo === 'Medição' ? 'tag-temp-morno' : 'tag-service'}`}>
                            {comp.tipo}
                          </span>
                        </td>
                        <td>{comp.nome_cliente}</td>
                        <td>{new Date(comp.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td>{comp.responsavel || 'Não designado'}</td>
                        <td>{comp.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sem visitas agendadas para os próximos dias.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------- TAB: KANBAN BOARD (13 ESTÁGIOS) -------------------- */}
        {currentTab === 'kanban' && (
          <DndContext sensors={sensors} onDragStart={(e) => setActiveDragId(e.active.id)} onDragEnd={handleDragEnd}>
            <div className="kanban-wrapper">
              {COLUMNS.map(col => {
                const colLeads = leads.filter(l => l.status_funil === col.id);
                return <KanbanColumn key={col.id} col={col} leads={colLeads} />;
              })}
            </div>
            <DragOverlay>
              {activeDragId ? <div className="kanban-card" style={{ opacity: 0.7, padding: '12px' }}>Arraste para mover</div> : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* -------------------- TAB: AGENDA COMPLETA -------------------- */}
        {currentTab === 'agenda' && (
          <div className="calendar-container">
            <div className="calendar-header">
              <h2>Compromissos do Mês ({dashboardData?.compromissos_proximos?.length || 0})</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span className="tag tag-temp-morno" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>● Medições</span>
                <span className="tag tag-service" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>● Instalações</span>
              </div>
            </div>
            
            <div className="calendar-grid">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="calendar-day-label">{day}</div>
              ))}
              
              {(() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const startPad = firstDay.getDay();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                
                const compsByDay = {};
                (dashboardData?.compromissos_proximos || []).forEach(comp => {
                  const d = new Date(comp.data_hora);
                  const day = d.getDate();
                  if (!compsByDay[day]) compsByDay[day] = [];
                  compsByDay[day].push(comp);
                });
                
                const cells = [];
                for (let pad = 0; pad < startPad; pad++) {
                  cells.push(<div key={`pad-${pad}`} className="calendar-day-cell disabled" />);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  const dayComps = compsByDay[day] || [];
                  cells.push(
                    <div key={day} className="calendar-day-cell">
                      <span className="calendar-day-number">{day}</span>
                      {dayComps.map(comp => (
                        <div
                          key={comp.id}
                          className={`calendar-event ${comp.tipo === 'Medição' ? 'event-medicao' : 'event-instalacao'}`}
                          title={`${comp.nome_cliente} - ${comp.tipo}`}
                          onClick={() => setSelectedLeadId(comp.lead_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <strong>{new Date(comp.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
                          {' '}{comp.nome_cliente}
                        </div>
                      ))}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        )}

        {/* -------------------- TAB: PRODUÇÃO -------------------- */}
        {currentTab === 'producao' && (
          <div className="production-container">
            <h2>Acompanhamento da Fábrica</h2>
            <div className="production-list">
              {leads.filter(l => l.status_funil === 'Produção' || l.status_funil === 'Instalação').map(lead => (
                <div key={lead.id} className="production-card glass-container">
                  <div className="prod-details">
                    <h4>{lead.nome_cliente}</h4>
                    <p><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {lead.endereco_obra || 'Sem endereço informado'}</p>
                  </div>
                  <div>
                    <span className="form-label">Serviço:</span>
                    <p style={{ fontWeight: 600 }}>{lead.tipo_servico} ({lead.material})</p>
                  </div>
                  <div>
                    <span className="form-label">Etapa SOS:</span>
                    <p className={`tag ${lead.status_funil === 'Produção' ? 'tag-temp-morno' : 'tag-service'}`} style={{ marginTop: '4px' }}>
                      {lead.status_funil}
                    </p>
                  </div>
                  <div>
                    <button className="btn btn-secondary" onClick={() => { setSelectedLeadId(lead.id); setActiveDetailTab('producao'); }}>
                      Ver Ficha de Produção
                    </button>
                  </div>
                </div>
              ))}
              {leads.filter(l => l.status_funil === 'Produção' || l.status_funil === 'Instalação').length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                  Nenhuma obra em estágio de Fabricação ou Instalação no momento.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* -------------------- MODAL: NOVO LEAD / PEDIDO -------------------- */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ height: 'auto', maxWidth: '650px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>Registrar Nova Oportunidade / Obra</h2>
              </div>
              <button className="btn-icon" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateLead} style={{ padding: '24px' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome do Cliente</label>
                  <input 
                    type="text" required className="form-control" 
                    value={newLeadForm.nome_cliente}
                    onChange={e => setNewLeadForm({...newLeadForm, nome_cliente: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp</label>
                  <input 
                    type="text" placeholder="(DD) 99999-9999" className="form-control" 
                    value={newLeadForm.whatsapp}
                    onChange={e => setNewLeadForm({...newLeadForm, whatsapp: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Peça / Serviço</label>
                  <select 
                    className="form-control"
                    value={newLeadForm.tipo_servico}
                    onChange={e => setNewLeadForm({...newLeadForm, tipo_servico: e.target.value})}
                  >
                    <option value="Portão">Portão</option>
                    <option value="Grade">Grade</option>
                    <option value="Corrimão">Corrimão</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Estrutura Metálica">Estrutura Metálica</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Material Principal</label>
                  <select 
                    className="form-control"
                    value={newLeadForm.material}
                    onChange={e => setNewLeadForm({...newLeadForm, material: e.target.value})}
                  >
                    <option value="Alumínio">Alumínio</option>
                    <option value="Ferro">Ferro / Aço Carbono</option>
                    <option value="Inox">Aço Inox</option>
                  </select>
                </div>
                <div className="form-group-full form-group">
                  <label className="form-label">Endereço da Obra</label>
                  <input 
                    type="text" className="form-control" 
                    value={newLeadForm.endereco_obra}
                    onChange={e => setNewLeadForm({...newLeadForm, endereco_obra: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Medidas Iniciais (solicitadas ou texto do cliente)</label>
                  <input 
                    type="text" placeholder="Ex: 3x2.20m" className="form-control" 
                    value={newLeadForm.medidas_brutas}
                    onChange={e => setNewLeadForm({...newLeadForm, medidas_brutas: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor Estimado (R$)</label>
                  <input 
                    type="number" className="form-control" 
                    value={newLeadForm.valor_estimado}
                    onChange={e => setNewLeadForm({...newLeadForm, valor_estimado: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Obra</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: FICHA OPERACIONAL DO LEAD (DETALHES) -------------------- */}
      {selectedLeadId && leadDetail && editForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h2>{editForm.nome_cliente}</h2>
                  <span className={`tag tag-temp-${(editForm.temperatura_lead || 'morno').toLowerCase()}`}>{editForm.temperatura_lead || 'Morno'}</span>
                  <span className="tag tag-service" style={{ fontSize: '0.75rem' }}>{editForm.status_funil}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <Phone size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {editForm.whatsapp || 'Sem WhatsApp'} &nbsp;·&nbsp; {editForm.origem || 'Origem desconhecida'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className={`btn ${editMode ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8rem' }} onClick={() => setEditMode(!editMode)}>
                  <FileEdit size={14} /> {editMode ? 'Concluir Edição' : 'Editar'}
                </button>
                <button className="btn btn-secondary" style={{ borderColor: 'var(--color-perdido)', color: 'var(--color-perdido)', fontSize: '0.8rem' }} onClick={() => handleDeleteLead(editForm.id)}>
                  <Trash2 size={14} />
                </button>
                <button className="btn-icon" onClick={() => { setSelectedLeadId(null); setLeadDetail(null); }}>✕</button>
              </div>
            </div>

            <div className="modal-body" style={{ overflow: 'hidden' }}>
              {editMode ? (
                /* ==================== EDIT MODE ==================== */
                <div className="lead-edit-container" style={{ overflowY: 'auto', height: '100%', padding: '24px' }}>
                  <div className="glass-container" style={{ padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}><User size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Dados do Lead</h3>
                    <form onSubmit={handleUpdateLead}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Nome do Cliente</label>
                          <input type="text" className="form-control" value={editForm.nome_cliente} onChange={e => setEditForm({...editForm, nome_cliente: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">WhatsApp</label>
                          <input type="text" className="form-control" value={editForm.whatsapp || ''} onChange={e => setEditForm({...editForm, whatsapp: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fase do Funil</label>
                          <select className="form-control" value={editForm.status_funil} onChange={e => { setEditForm({...editForm, status_funil: e.target.value}); handleUpdateStatus(editForm.id, e.target.value); }}>
                            {COLUMNS.map(col => (<option key={col.id} value={col.id}>{col.label}</option>))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Origem</label>
                          <input type="text" className="form-control" value={editForm.origem || ''} onChange={e => setEditForm({...editForm, origem: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Responsável</label>
                          <input type="text" className="form-control" value={editForm.responsavel || ''} onChange={e => setEditForm({...editForm, responsavel: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Temperatura</label>
                          <select className="form-control" value={editForm.temperatura_lead || 'Morno'} onChange={e => setEditForm({...editForm, temperatura_lead: e.target.value})}>
                            <option value="Quente">Quente</option>
                            <option value="Morno">Morno</option>
                            <option value="Frio">Frio</option>
                            <option value="Curioso">Curioso</option>
                          </select>
                        </div>
                        <div className="form-group-full form-group">
                          <label className="form-label">Endereço da Obra</label>
                          <input type="text" className="form-control" value={editForm.endereco_obra || ''} onChange={e => setEditForm({...editForm, endereco_obra: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Valor Estimado (R$)</label>
                          <input type="number" className="form-control" value={editForm.valor_estimado || 0} onChange={e => setEditForm({...editForm, valor_estimado: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Valor Fechado (R$)</label>
                          <input type="number" className="form-control" value={editForm.valor_fechado || 0} onChange={e => setEditForm({...editForm, valor_fechado: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Prazo Desejado</label>
                          <input type="date" className="form-control" value={editForm.prazo_desejado ? editForm.prazo_desejado.substring(0,10) : ''} onChange={e => setEditForm({...editForm, prazo_desejado: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Complexidade</label>
                          <select className="form-control" value={editForm.complexidade || 'Média'} onChange={e => setEditForm({...editForm, complexidade: e.target.value})}>
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                          </select>
                        </div>
                        <div className="form-group-full form-group">
                          <label className="form-label">Motivo de Perda</label>
                          <input type="text" className="form-control" placeholder="Preço alto, prazo longo..." value={editForm.motivo_perda || ''} onChange={e => setEditForm({...editForm, motivo_perda: e.target.value})} />
                        </div>
                      </div>
                      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                      </div>
                    </form>
                  </div>

                  <div className="glass-container" style={{ padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}><Layers size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Dados Técnicos</h3>
                    <div className="form-grid">
                      <div className="form-group"><label className="form-label">Tipo de Peça</label>
                        <input type="text" className="form-control" value={editForm.tipo_servico || ''} onChange={e => setEditForm({...editForm, tipo_servico: e.target.value})} />
                      </div>
                      <div className="form-group"><label className="form-label">Material</label>
                        <input type="text" className="form-control" value={editForm.material || ''} onChange={e => setEditForm({...editForm, material: e.target.value})} />
                      </div>
                      <div className="form-group"><label className="form-label">Cor / Acabamento</label>
                        <input type="text" className="form-control" value={editForm.cor_acabamento || ''} onChange={e => setEditForm({...editForm, cor_acabamento: e.target.value})} />
                      </div>
                      <div className="form-group"><label className="form-label">Medidas</label>
                        <input type="text" className="form-control" placeholder="L: 3m x A: 2.20m" value={editForm.medidas_brutas || ''} onChange={e => setEditForm({...editForm, medidas_brutas: e.target.value})} />
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-primary" onClick={handleUpdateLead}>Atualizar Dados Técnicos</button>
                    </div>
                  </div>

                  <div className="glass-container" style={{ padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Agendar Visita</h3>
                    <form onSubmit={handleAddCompromisso} className="form-grid">
                      <div className="form-group"><label className="form-label">Tipo</label>
                        <select className="form-control" value={newCompromisso.tipo} onChange={e => setNewCompromisso({...newCompromisso, tipo: e.target.value})}>
                          <option value="Medição">Medição</option>
                          <option value="Instalação">Instalação</option>
                        </select>
                      </div>
                      <div className="form-group"><label className="form-label">Data/Hora</label>
                        <input type="datetime-local" required className="form-control" value={newCompromisso.data_hora} onChange={e => setNewCompromisso({...newCompromisso, data_hora: e.target.value})} />
                      </div>
                      <div className="form-group"><label className="form-label">Responsável</label>
                        <input type="text" required className="form-control" value={newCompromisso.responsavel} onChange={e => setNewCompromisso({...newCompromisso, responsavel: e.target.value})} />
                      </div>
                      <div className="form-group"><label className="form-label">Observações</label>
                        <input type="text" className="form-control" value={newCompromisso.observacoes} onChange={e => setNewCompromisso({...newCompromisso, observacoes: e.target.value})} />
                      </div>
                      <div className="form-group-full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary">Agendar</button>
                      </div>
                    </form>
                    {leadDetail.compromissos.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <h4 className="form-label">Visitas Cadastradas:</h4>
                        {leadDetail.compromissos.map(comp => (
                          <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <div>
                              <span className={`tag ${comp.tipo === 'Medição' ? 'tag-temp-morno' : 'tag-service'}`}>{comp.tipo}</span>
                              <strong style={{ marginLeft: '8px' }}>{new Date(comp.data_hora).toLocaleString('pt-BR')}</strong>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>{comp.responsavel}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', color: comp.status === 'Agendado' ? '#ffb703' : '#10b981' }}>{comp.status}</span>
                              {comp.status === 'Agendado' && (
                                <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => handleUpdateCompromissoStatus(comp.id, 'Realizado')}>✓</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-container" style={{ padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}><Wrench size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Ordem de Produção</h3>
                    <div className="form-grid">
                      <div className="form-group"><label className="form-label">Status</label>
                        <select className="form-control" id="prod-status-edit" defaultValue={leadDetail.producao?.status || 'Aguardando Material'}>
                          <option value="Aguardando Material">Aguardando Material</option>
                          <option value="Em Produção">Em Produção</option>
                          <option value="Pronto">Pronto</option>
                        </select>
                      </div>
                      <div className="form-group"><label className="form-label">Equipe</label>
                        <input type="text" className="form-control" id="prod-equipe-edit" defaultValue={leadDetail.producao?.equipe_responsavel || ''} />
                      </div>
                      <div className="form-group"><label className="form-label">Data Limite</label>
                        <input type="date" className="form-control" id="prod-data-edit" defaultValue={leadDetail.producao?.data_entrega_fabrica ? leadDetail.producao.data_entrega_fabrica.substring(0,10) : ''} />
                      </div>
                      <div className="form-group-full"><label className="form-label">Observações</label>
                        <textarea className="form-control" rows="2" id="prod-obs-edit" defaultValue={leadDetail.producao?.observacoes_tecnicas || ''} />
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary" onClick={() => handleSaveProducao({
                        status: document.getElementById('prod-status-edit').value,
                        equipe_responsavel: document.getElementById('prod-equipe-edit').value,
                        data_entrega_fabrica: document.getElementById('prod-data-edit').value,
                        observacoes_tecnicas: document.getElementById('prod-obs-edit').value
                      })}>Salvar Produção</button>
                    </div>
                  </div>

                  <div className="glass-container" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}><Camera size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Fotos</h3>
                    <form onSubmit={handleAddFoto} className="form-grid">
                      <div className="form-group"><label className="form-label">URL</label>
                        <input type="text" required className="form-control" value={newFoto.url_foto} onChange={e => setNewFoto({...newFoto, url_foto: e.target.value})} />
                      </div>
                      <div className="form-group"><label className="form-label">Tipo</label>
                        <select className="form-control" value={newFoto.tipo} onChange={e => setNewFoto({...newFoto, tipo: e.target.value})}>
                          <option value="Antes">Antes</option>
                          <option value="Depois">Depois</option>
                        </select>
                      </div>
                      <div className="form-group-full"><label className="form-label">Legenda</label>
                        <input type="text" className="form-control" value={newFoto.legenda} onChange={e => setNewFoto({...newFoto, legenda: e.target.value})} />
                      </div>
                      <div className="form-group-full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary">Adicionar Foto</button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                /* ==================== VIEW MODE: 7 Blocos ==================== */
                <div className="lead-blocks-scroll">

                  {/* Bloco 1: Cabeçalho do Lead */}
                  <div className="lead-block lead-header-block">
                    <div className="header-grid">
                      <div className="header-item"><span className="header-label">WhatsApp</span><span className="header-value">{editForm.whatsapp || '—'}</span></div>
                      <div className="header-item"><span className="header-label">Origem</span><span className="header-value">{editForm.origem || '—'}</span></div>
                      <div className="header-item"><span className="header-label">Responsável</span><span className="header-value">{editForm.responsavel || 'Não atribuído'}</span></div>
                      <div className="header-item"><span className="header-label">Último Contato</span><span className="header-value">{leadInsights?.ultimo_contato_data ? new Date(leadInsights.ultimo_contato_data).toLocaleDateString('pt-BR') : new Date(editForm.updated_at).toLocaleDateString('pt-BR')}</span></div>
                      <div className="header-item"><span className="header-label">Tempo sem Resposta</span><span className="header-value" style={{ color: (leadInsights?.dias_ultimo_contato || 0) > 7 ? 'var(--temp-quente)' : 'var(--text-main)' }}>{leadInsights ? `${leadInsights.dias_ultimo_contato} dias` : '—'}</span></div>
                    </div>
                  </div>

                  {/* Bloco 2: Resumo da IA */}
                  <div className="lead-block lead-ia-block">
                    <div className="block-header"><Sparkles size={22} color="#829aff" /><h3>Resumo da IA</h3></div>
                    <div className="ia-summary-text">{editForm.resumo_ia || 'Nenhum resumo disponível. As análises da IA aparecerão aqui após o n8n processar as conversas do WhatsApp.'}</div>
                    <div className="ia-meta-row">
                      <div className="ia-meta-item"><span className="ia-meta-label">Próxima Ação</span><span>{editForm.proxima_acao || 'Aguardando análise da IA'}</span></div>
                      <div className="ia-meta-item"><span className="ia-meta-label">Valor Estimado</span><span>{formatCurrency(editForm.valor_estimado)}</span></div>
                      <div className="ia-meta-item"><span className="ia-meta-label">Valor Fechado</span><span style={{ color: editForm.valor_fechado > 0 ? 'var(--color-fechado)' : 'var(--text-muted)' }}>{editForm.valor_fechado > 0 ? formatCurrency(editForm.valor_fechado) : 'Aberto'}</span></div>
                    </div>
                  </div>

                  {/* Bloco 3: Ações Rápidas */}
                  <div className="lead-block lead-actions-block">
                    <div className="block-header"><Send size={18} color="#06d6a0" /><h3>Ações Rápidas</h3></div>
                    <div className="quick-actions-grid">
                      <button className="quick-action-btn" onClick={() => { navigator.clipboard.writeText(`Olá ${editForm.nome_cliente}! Recebemos sua solicitação de ${editForm.tipo_servico || 'serviço'}.`); alert('Mensagem copiada!'); }}><MessageSquare size={16} /> Responder</button>
                      <button className="quick-action-btn" onClick={() => { navigator.clipboard.writeText(`Olá ${editForm.nome_cliente}! Você poderia enviar fotos do local para agilizar o orçamento?`); alert('Mensagem copiada!'); }}><Camera size={16} /> Pedir Fotos</button>
                      <button className="quick-action-btn" onClick={() => { navigator.clipboard.writeText(`Olá ${editForm.nome_cliente}! Para confirmarmos as medidas, informe largura e altura do vão.`); alert('Mensagem copiada!'); }}><Ruler size={16} /> Pedir Medidas</button>
                      <button className="quick-action-btn" onClick={() => setEditMode(true)}><Calendar size={16} /> Marcar Visita</button>
                      <button className="quick-action-btn" onClick={() => { window.open(`https://wa.me/${(editForm.whatsapp || '').replace(/\D/g, '')}`, '_blank'); }}><User size={16} /> WhatsApp</button>
                      <button className="quick-action-btn" onClick={() => { fetchTimeline(editForm.id); fetchInsights(editForm.id); setExpandedPanels(prev => ({ ...prev, insights: true })); }}><RefreshCw size={16} /> Atualizar</button>
                      <button className="quick-action-btn" onClick={() => { const s = prompt('Nova fase:', editForm.status_funil); if (s) handleUpdateStatus(editForm.id, s); }}><ArrowRight size={16} /> Mover Etapa</button>
                      <button className="quick-action-btn" onClick={() => { const t = prompt('Descreva a tarefa:'); if (t) fetch(`${API_URL}/leads/${editForm.id}/timeline`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'tarefa_criada', descricao: `Tarefa: ${t}`, responsavel: 'Sistema' }) }).then(() => fetchTimeline(editForm.id)); }}><CheckSquare size={16} /> Criar Tarefa</button>
                    </div>
                  </div>

                  {/* Blocos 4-6: Accordions */}
                  <div className="lead-accordions">
                    {/* Conversa */}
                    <div className={`accordion-panel ${expandedPanels.conversa ? 'expanded' : ''}`}>
                      <div className="accordion-header" onClick={() => togglePanel('conversa')}>
                        <div className="accordion-title"><MessageSquare size={18} color="#4361ee" /><span>Histórico de Conversa ({leadDetail.mensagens?.length || 0})</span></div>
                        {expandedPanels.conversa ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      {expandedPanels.conversa && (
                        <div className="accordion-body">
                          <div className="chat-messages">
                            {leadDetail.mensagens && leadDetail.mensagens.length > 0 ? (
                              leadDetail.mensagens.map(msg => (
                                <div key={msg.id} className={`chat-msg msg-${msg.remetente === 'cliente' ? 'client' : msg.remetente === 'vendedor' ? 'agent' : 'ia'}`}>
                                  <div className="chat-msg-header">{msg.remetente === 'cliente' ? 'Cliente' : msg.remetente === 'vendedor' ? 'Vendedor' : 'IA'} • {new Date(msg.created_at).toLocaleString('pt-BR')}</div>
                                  <div className="chat-msg-text">{msg.mensagem}</div>
                                </div>
                              ))
                            ) : (
                              <p className="chat-empty">Nenhuma conversa registrada.</p>
                            )}
                          </div>
                          {editForm.resposta_sugerida && (
                            <div className="ia-suggestion-banner">
                              <Sparkles size={14} color="#829aff" />
                              <span className="ia-suggestion-label">Resposta Sugerida pela IA:</span>
                              <span className="ia-suggestion-text">{editForm.resposta_sugerida}</span>
                              <button className="btn btn-sm" onClick={() => setReplyText(editForm.resposta_sugerida)}>Usar</button>
                            </div>
                          )}
                          <div className="chat-input-bar">
                            <input
                              type="text"
                              className="form-control chat-input"
                              placeholder="Digite sua mensagem..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            />
                            <button className="btn btn-primary btn-send" onClick={handleSendMessage} disabled={sendingMsg || !replyText.trim()}>
                              {sendingMsg ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className={`accordion-panel ${expandedPanels.timeline ? 'expanded' : ''}`}>
                      <div className="accordion-header" onClick={() => togglePanel('timeline')}>
                        <div className="accordion-title"><History size={18} color="#f77f00" /><span>Linha do Tempo ({timelineEvents.length} eventos)</span></div>
                        {expandedPanels.timeline ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      {expandedPanels.timeline && (
                        <div className="accordion-body">
                          <div className="timeline-list">
                            {timelineEvents.length > 0 ? (
                              timelineEvents.map(evt => (
                                <div key={evt.id} className={`timeline-item tipo-${evt.tipo}`}>
                                  <div className="timeline-dot" />
                                  <div className="timeline-content">
                                    <div className="timeline-desc">{evt.descricao}</div>
                                    <div className="timeline-meta">{evt.responsavel && <span>{evt.responsavel}</span>}<span>{new Date(evt.created_at).toLocaleString('pt-BR')}</span></div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>Nenhum evento registrado.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Insights */}
                    <div className={`accordion-panel ${expandedPanels.insights ? 'expanded' : ''}`}>
                      <div className="accordion-header" onClick={() => togglePanel('insights')}>
                        <div className="accordion-title"><Lightbulb size={18} color="#ffb703" /><span>Insights & Inteligência</span></div>
                        {expandedPanels.insights ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      {expandedPanels.insights && (
                        <div className="accordion-body">
                          {leadInsights ? (
                            <div className="insights-grid">
                              <div className="insight-card"><div className="insight-icon" style={{ backgroundColor: 'rgba(6, 214, 160, 0.1)', color: '#06d6a0' }}>{leadInsights.lead_recorrente ? <CheckCircle size={20} /> : <User size={20} />}</div><div><div className="insight-label">Tipo de Lead</div><div className="insight-value">{leadInsights.lead_recorrente ? 'Recorrente' : 'Novo'}</div></div></div>
                              <div className="insight-card"><div className="insight-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><MessageSquare size={20} /></div><div><div className="insight-label">Total de Mensagens</div><div className="insight-value">{leadInsights.total_mensagens} msgs</div></div></div>
                              <div className="insight-card"><div className="insight-icon" style={{ backgroundColor: leadInsights.risco_esfriar ? 'rgba(239, 71, 111, 0.1)' : 'rgba(6, 214, 160, 0.1)', color: leadInsights.risco_esfriar ? '#ef476f' : '#06d6a0' }}><AlertTriangle size={20} /></div><div><div className="insight-label">Risco de Esfriar</div><div className="insight-value">{leadInsights.risco_esfriar ? 'Sim — ' + leadInsights.dias_ultimo_contato + ' dias' : 'Baixo'}</div></div></div>
                              <div className="insight-card"><div className="insight-icon" style={{ backgroundColor: 'rgba(247, 127, 0, 0.1)', color: '#f77f00' }}><Calendar size={20} /></div><div><div className="insight-label">Visitas Agendadas</div><div className="insight-value">{leadInsights.total_visitas_agendadas} visita(s)</div></div></div>
                            </div>
                          ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>Carregando insights...</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloco 7: Dados Estruturados */}
                  <div className="lead-block lead-data-block">
                    <div className="block-header"><Layers size={18} color="#4361ee" /><h3>Dados Técnicos</h3></div>
                    <div className="tech-data-grid">
                      <div className="tech-item"><span className="tech-label">Tipo de Serviço</span><span className="tech-value">{editForm.tipo_servico || '—'}</span></div>
                      <div className="tech-item"><span className="tech-label">Material</span><span className="tech-value">{editForm.material || '—'}</span></div>
                      <div className="tech-item"><span className="tech-label">Medidas</span><span className="tech-value">{editForm.medidas_brutas || '—'}</span></div>
                      <div className="tech-item"><span className="tech-label">Cor / Acabamento</span><span className="tech-value">{editForm.cor_acabamento || '—'}</span></div>
                      <div className="tech-item"><span className="tech-label">Endereço da Obra</span><span className="tech-value">{editForm.endereco_obra || '—'}</span></div>
                      <div className="tech-item"><span className="tech-label">Complexidade</span><span className="tech-value"><span className={`tag ${editForm.complexidade === 'Alta' ? 'tag-temp-quente' : editForm.complexidade === 'Média' ? 'tag-temp-morno' : 'tag-temp-frio'}`}>{editForm.complexidade || 'Média'}</span></span></div>
                    </div>
                    {leadDetail.fotos && leadDetail.fotos.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <h4 className="form-label" style={{ marginBottom: '8px' }}>Fotos da Obra ({leadDetail.fotos.length})</h4>
                        <div className="fotos-mini-grid">
                          {leadDetail.fotos.map(foto => (
                            <div key={foto.id} className="foto-mini-card">
                              <img src={foto.url_foto} alt={foto.legenda} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400'; }} />
                              <span className={`tag ${foto.tipo === 'Antes' ? 'tag-temp-morno' : 'tag-service'}`} style={{ fontSize: '0.6rem' }}>{foto.tipo}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
