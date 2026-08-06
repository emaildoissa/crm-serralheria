import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OrcamentoPDF } from './OrcamentoPDF';

export function PDFDownloadButton({ orcamento, lead, className = '', buttonText = 'Baixar Orçamento PDF' }) {
  const fileName = `Orcamento_${orcamento?.numero || '001'}_${(lead?.nome_cliente || 'Cliente').replace(/\s+/g, '_')}.pdf`;

  return (
    <PDFDownloadLink
      document={<OrcamentoPDF orcamento={orcamento} lead={lead} />}
      fileName={fileName}
      className={`btn-pdf-download ${className}`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading, error }) => (
        <button
          type="button"
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: loading ? '#64748B' : '#D97706',
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: '0.875rem',
            borderRadius: '6px',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'background-color 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <polyline points="9 15 12 18 15 15"></polyline>
          </svg>
          {loading ? 'Gerando PDF...' : buttonText}
        </button>
      )}
    </PDFDownloadLink>
  );
}
