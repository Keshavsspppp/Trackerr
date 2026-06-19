"use client";

import { useState, useRef } from 'react';
import { Upload, Check, AlertTriangle } from 'lucide-react';
import { importApplicationsFromCSV, type CSVImportResult } from '@/src/lib/csvImport';

interface CSVImporterProps {
  userId: string;
  onImportComplete: () => void;
}

export default function CSVImporter({ userId, onImportComplete }: CSVImporterProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const importResult = await importApplicationsFromCSV(file, userId);
      setResult(importResult);
      setShowModal(true);
      
      if (importResult.successCount > 0) {
        onImportComplete();
      }
    } catch (err) {
      setResult({
        successCount: 0,
        skippedCount: 0,
        errors: [{ row: 0, reason: err instanceof Error ? err.message : 'Import failed' }],
      });
      setShowModal(true);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setResult(null);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        disabled={importing}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="hover-btn-neutral"
        style={{
          padding: '8px 16px',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: importing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: importing ? 0.6 : 1,
        }}
      >
        <Upload size={16} />
        {importing ? 'Importing...' : 'Import CSV'}
      </button>

      {/* Result Modal */}
      {showModal && result && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: '16px',
              }}
            >
              Import Results
            </h2>

            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' }}>
                <Check size={16} style={{ color: 'var(--color-offer-dot)', marginRight: '6px' }} />
                <strong>Successfully imported:</strong>&nbsp;{result.successCount} application{result.successCount !== 1 ? 's' : ''}
              </p>
              {result.skippedCount > 0 && (
                <p style={{ fontSize: '14px', color: 'var(--color-stale-text)', display: 'flex', alignItems: 'center' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--color-stale-border)', marginRight: '6px' }} />
                  <strong>Skipped:</strong>&nbsp;{result.skippedCount} row{result.skippedCount !== 1 ? 's' : ''} due to validation errors
                </p>
              )}
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '12px',
                  }}
                >
                  Errors:
                </h3>
                <div
                  style={{
                    maxHeight: '200px',
                    overflow: 'auto',
                    backgroundColor: 'var(--color-stale-bg)',
                    border: '1px solid var(--color-stale-border)',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  {result.errors.map((error, index) => (
                    <p
                      key={index}
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-stale-text)',
                        marginBottom: '6px',
                      }}
                    >
                      <strong>Row {error.row}:</strong> {error.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCloseModal}
              className="hover-btn-accent"
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: 'var(--color-accent)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
