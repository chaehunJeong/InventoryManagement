import React from 'react';
import { ShieldCheck, Plus, Bell, Sun, Moon, QrCode, Database, MessageSquareHeart } from 'lucide-react';

export default function Header({ 
  onOpenAddModal, 
  onOpenScanModal, 
  onOpenSettingsModal,
  onOpenBackupModal,
  onOpenFeedbackModal,
  theme,
  setTheme,
  urgentCount
}) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 0',
      marginBottom: '2rem',
      borderBottom: '1px solid var(--border-color)'
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '0.75rem',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}>
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FreshGuard
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            바코드 스캔 & 무료 DB 저장 / 유통기한 알림
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* 바코드 스캔 */}
        <button 
          onClick={onOpenScanModal}
          className="btn-secondary"
          title="바코드 찍기"
        >
          <QrCode size={18} />
          <span>바코드 스캔</span>
        </button>

        {/* 품목 등록 */}
        <button 
          onClick={onOpenAddModal}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>재고 등록</span>
        </button>

        {/* DB 백업/복원 버튼 */}
        <button
          onClick={onOpenBackupModal}
          className="btn-secondary"
          title="무료 DB 백업 및 파일 복원"
          style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
        >
          <Database size={18} color="#10b981" />
          <span style={{ color: '#10b981', fontWeight: 600 }}>DB 백업</span>
        </button>

        {/* 버그 및 요청사항 버튼 */}
        <button
          onClick={onOpenFeedbackModal}
          className="btn-secondary"
          title="버그 제보 및 기능 요청"
          style={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}
        >
          <MessageSquareHeart size={18} color="#a855f7" />
          <span style={{ color: '#a855f7', fontWeight: 600 }}>버그/요청</span>
        </button>

        {/* 무료 알림 설정 버튼 */}
        <button 
          onClick={onOpenSettingsModal}
          className="btn-icon"
          title="알림 설정"
          style={{ position: 'relative', background: 'var(--bg-input)' }}
        >
          <Bell size={20} />
          {urgentCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'var(--accent-danger)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {urgentCount}
            </span>
          )}
        </button>

        {/* 테마 전환 버튼 */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn-icon"
          title="테마 변경"
          style={{ background: 'var(--bg-input)' }}
        >
          {theme === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#6366f1" />}
        </button>
      </div>
    </header>
  );
}
