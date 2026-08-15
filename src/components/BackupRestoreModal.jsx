import React, { useState } from 'react';
import { X, Download, Upload, Database, CheckCircle, AlertTriangle, FileJson } from 'lucide-react';
import { exportDatabaseToJson, importDatabaseFromJson } from '../services/dbBackupService';

export default function BackupRestoreModal({ onClose, onRestoreSuccess }) {
  const [importStatus, setImportStatus] = useState(null);
  const [isClearMode, setIsClearMode] = useState(false);

  const handleExport = async () => {
    try {
      await exportDatabaseToJson();
      setImportStatus({ type: 'success', msg: '✨ 백업 파일(.json)이 다운로드 폴더에 저장되었습니다!' });
    } catch (err) {
      setImportStatus({ type: 'error', msg: '백업 실패: ' + err.message });
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportStatus({ type: 'info', msg: '데이터 복원 처리 중...' });
      const result = await importDatabaseFromJson(file, isClearMode);
      setImportStatus({ 
        type: 'success', 
        msg: `🎉 성공적으로 ${result.count}개의 재고 항목을 DB에 복원했습니다!` 
      });
      if (onRestoreSuccess) onRestoreSuccess();
    } catch (err) {
      setImportStatus({ type: 'error', msg: '복원 실패: ' + err.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={22} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>무료 DB 백업 및 복원</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. 백업 내보내기 */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-input)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Download size={22} color="var(--accent-success)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>1. 데이터 백업 파일 받기 (Export)</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              현재 등록된 모든 재고 목록과 설정 정보를 안전한 JSON 파일로 내PC/스마트폰에 저장합니다.
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExport}>
              <FileJson size={18} />
              <span>백업 파일 내보내기 (.json 다운로드)</span>
            </button>
          </div>

          {/* 2. 데이터 복원 가져오기 */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-input)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Upload size={22} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>2. 백업 파일로 복원하기 (Import)</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              이전에 백업해 둔 JSON 파일을 선택하여 다른 기기나 브라우저에 데이터를 복원합니다.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <input
                type="checkbox"
                id="clear-checkbox"
                checked={isClearMode}
                onChange={e => setIsClearMode(e.target.checked)}
              />
              <label htmlFor="clear-checkbox" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                복원 시 기존 데이터 지우고 새로 덮어쓰기
              </label>
            </div>

            <input
              type="file"
              accept=".json"
              id="restore-file-input"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <label htmlFor="restore-file-input" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={18} />
              <span>백업 파일 파일 선택하여 복원하기</span>
            </label>
          </div>

          {/* Alert Status message */}
          {importStatus && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              background: importStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${importStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: importStatus.type === 'success' ? '#6ee7b7' : '#fca5a5'
            }}>
              {importStatus.msg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn-secondary" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
