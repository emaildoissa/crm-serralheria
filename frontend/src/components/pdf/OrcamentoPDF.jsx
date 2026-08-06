import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#222',
    backgroundColor: '#FFFFFF',
  },
  header: {
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D97706',
    borderBottomStyle: 'solid',
    paddingBottom: 12,
    marginBottom: 16,
  },
  empresaNome: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 4,
    textTransform: uppercaseText('ESQUADRIAS OS — SOLUÇÕES MULTIMATERIAL'),
  },
  empresaSub: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 2,
  },
  titleBadge: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    alignSelf: 'center',
    borderRadius: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCol: {
    width: '48%',
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#D97706',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 9,
    color: '#334155',
    marginBottom: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    borderRadius: 3,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderBottomStyle: 'solid',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  colNum: { width: '8%', textAlign: 'center', color: '#64748B' },
  colDesc: { width: '46%', paddingRight: 6 },
  colQtd: { width: '12%', textAlign: 'center' },
  colPreco: { width: '17%', textAlign: 'right' },
  colTotal: { width: '17%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  
  itemDesc: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#0F172A' },
  itemMedidas: { fontSize: 8, color: '#64748B', marginTop: 2 },
  
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    marginBottom: 16,
  },
  totalsBox: {
    width: '45%',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 9,
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 6,
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#D97706',
  },
  termsSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FAF5FF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  termsHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6B21A8',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 8.5,
    color: '#4C1D95',
    lineHeight: 1.3,
  },
  footerSignatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 10,
  },
  signatureBox: {
    width: '42%',
    borderTopWidth: 1,
    borderTopColor: '#94A3B8',
    textAlign: 'center',
    paddingTop: 6,
  },
  signatureRole: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
  },
  signatureName: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
});

function uppercaseText(str) {
  return (str || '').toUpperCase();
}

function formatMoney(val) {
  return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR');
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function OrcamentoPDF({ orcamento, lead }) {
  const itens = orcamento?.itens || [];
  const subtotal = itens.reduce((acc, i) => acc + Number(i.subtotal ?? (i.quantidade * i.preco_unitario)), 0);
  const desconto = Number(orcamento?.desconto || 0);
  const acrescimo = Number(orcamento?.acrescimo || 0);
  const total = Number(orcamento?.total || Math.max(0, subtotal - desconto + acrescimo));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.empresaNome}>ESQUADRIAS OS</Text>
          <Text style={styles.empresaSub}>Soluções em Alumínio, PVC & Madeira Multimaterial</Text>
          <Text style={styles.empresaSub}>Contato: (11) 99888-1111 | atendimento@esquadrias.com.br</Text>
          
          <View style={styles.titleBadge}>
            <Text>ORÇAMENTO TÉCNICO #{orcamento?.numero || '001'}</Text>
          </View>
        </View>

        {/* Dados do Cliente e Orçamento */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.sectionHeading}>DADOS DO CLIENTE</Text>
            <Text style={styles.infoText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Cliente:</Text> {lead?.nome_cliente || 'N/A'}</Text>
            <Text style={styles.infoText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>WhatsApp:</Text> {lead?.whatsapp || 'N/A'}</Text>
            <Text style={styles.infoText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Local da Obra:</Text> {lead?.endereco_obra || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.sectionHeading}>DETALHES DA PROPOSTA</Text>
            <Text style={styles.infoText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Data de Emissão:</Text> {formatDate(orcamento?.created_at)}</Text>
            <Text style={styles.infoText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Validade:</Text> {orcamento?.validade ? formatDate(orcamento.validade) : '15 dias'}</Text>
            <Text style={styles.infoText}><Text style={{ fontFamily: 'Helvetica-Bold' }}>Prazo de Entrega:</Text> {orcamento?.prazo_entrega || '15 a 20 dias úteis'}</Text>
          </View>
        </View>

        {/* Tabela de Itens */}
        <Text style={[styles.sectionHeading, { marginBottom: 6 }]}>ITENS DA ESQUADRIA / PROJETO</Text>
        
        <View style={styles.tableHeader}>
          <Text style={styles.colNum}>#</Text>
          <Text style={styles.colDesc}>DESCRIÇÃO DA PEÇA / ESPECIFICAÇÃO</Text>
          <Text style={styles.colQtd}>QTD</Text>
          <Text style={styles.colPreco}>VALOR UNIT.</Text>
          <Text style={styles.colTotal}>SUBTOTAL</Text>
        </View>

        {itens.length > 0 ? (
          itens.map((item, index) => {
            const temDimensoes = item.largura && item.altura;
            const itemSubtotal = Number(item.subtotal ?? (item.quantidade * item.preco_unitario));
            return (
              <View key={item.id || index} style={styles.tableRow} wrap={false}>
                <Text style={styles.colNum}>{index + 1}</Text>
                <View style={styles.colDesc}>
                  <Text style={styles.itemDesc}>{item.descricao}</Text>
                  {temDimensoes ? (
                    <Text style={styles.itemMedidas}>
                      Dimensões do Vão: {item.largura}m (Largura) × {item.altura}m (Altura) | Unid: {item.unidade || 'un'}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.colQtd}>{item.quantidade}</Text>
                <Text style={styles.colPreco}>{formatMoney(item.preco_unitario)}</Text>
                <Text style={styles.colTotal}>{formatMoney(itemSubtotal)}</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.tableRow}>
            <Text style={{ width: '100%', textAlign: 'center', color: '#94A3B8', padding: 10 }}>
              Nenhum item especificado neste orçamento.
            </Text>
          </View>
        )}

        {/* Totais */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={{ color: '#475569' }}>Subtotal Itens:</Text>
              <Text>{formatMoney(subtotal)}</Text>
            </View>
            {desconto > 0 ? (
              <View style={styles.totalRow}>
                <Text style={{ color: '#DC2626' }}>Desconto Aplicado:</Text>
                <Text style={{ color: '#DC2626' }}>- {formatMoney(desconto)}</Text>
              </View>
            ) : null}
            {acrescimo > 0 ? (
              <View style={styles.totalRow}>
                <Text style={{ color: '#2563EB' }}>Acréscimo:</Text>
                <Text>+ {formatMoney(acrescimo)}</Text>
              </View>
            ) : null}
            <View style={[styles.totalRow, styles.finalTotal]}>
              <Text>TOTAL FINAL:</Text>
              <Text>{formatMoney(total)}</Text>
            </View>
          </View>
        </View>

        {/* Condições e Garantia */}
        <View style={styles.termsSection}>
          <Text style={styles.termsHeading}>CONDIÇÕES DE PAGAMENTO & GARANTIA TÉCNICA</Text>
          <Text style={styles.termsText}>• Forma de Pagamento: {orcamento?.condicoes_pagamento || '50% de entrada + 50% na conclusão da instalação'}.</Text>
          <Text style={styles.termsText}>• Garantia: 5 anos contra amarelamento/corrosão em perfis de alumínio/PVC e 1 ano em roldanas, fechos e ferragens.</Text>
          <Text style={styles.termsText}>• Observações: {orcamento?.observacoes || 'Valores sujeitos a alteração caso haja modificação nas dimensões após medição fina.'}</Text>
        </View>

        {/* Assinaturas */}
        <View style={styles.footerSignatures}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureRole}>ESQUADRIAS OS (CONTRATADA)</Text>
            <Text style={styles.signatureName}>Departamento Comercial</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureRole}>DE ACORDO DO CLIENTE (CONTRATANTE)</Text>
            <Text style={styles.signatureName}>{lead?.nome_cliente || 'Assinatura do Cliente'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
