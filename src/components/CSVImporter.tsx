"use client";

import { useState, useRef } from 'react';
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
        style={{
          padding: '8px 16px',
          backgroundColor: importing ? '#9CA3AF' : '#10B981',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: importing ? 'not-allowed' : 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (!importing) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
          }
        }}
        onMouseLeave={(e) => {
          if (!importing) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10B981';
          }
        }}
      >
        {importing ? 'Importing...' : '📥 Import CSV'}
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
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              Import Results
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                ✅ <strong>Successfully imported:</strong> {result.successCount} application{result.successCount !== 1 ? 's' : ''}
              </p>
              {result.skippedCount > 0 && (
                <p style={{ fontSize: '14px', color: '#B45309', marginBottom: '8px' }}>
                  ⚠️ <strong>Skipped:</strong> {result.skippedCount} row{result.skippedCount !== 1 ? 's' : ''} due to validation errors
                </p>
              )}
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  Errors:
                </h3>
                <div
                  style={{
                    maxHeight: '200px',
                    overflow: 'auto',
                    backgroundColor: '#FEF3C7',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  {result.errors.map((error, index) => (
                    <p
                      key={index}
                      style={{
                        fontSize: '13px',
                        color: '#92400E',
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
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563EB';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3B82F6';
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
