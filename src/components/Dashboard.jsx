import React from 'react';
import { Package, AlertTriangle, AlertCircle, CheckCircle2, BellRing } from 'lucide-react';
import { getDDayStatus, triggerLocalNotification } from '../services/notificationService';

export default function Dashboard({ items = [], warningDays = 3, onFilterStatus }) {
  let expiredCount = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let safeCount = 0;

  items.forEach(item => {
    const status = getDDayStatus(item.expiryDate, warningDays).status;
    if (status === 'expired') expiredCount++;
    else if (status === 'critical') criticalCount++;
    else if (status === 'warning') warningCount++;
    else safeCount++;
  });

  const urgentTotal = expiredCount + criticalCount + warningCount;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* 만료/임박 재고 경고 배너 */}
      {urgentTotal > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '1rem',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={28} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fca5a5' }}>
                유통기한 관리가 필요한 항목이 {urgentTotal}건 있습니다!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                만료됨 {expiredCount}건 | 오늘 만료 {criticalCount}건 | D-{warningDays} 이하 임박 {warningCount}건
              </p>
            </div>
          </div>
          <button 
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', fontSize: '0.85rem' }}
            onClick={() => {
              triggerLocalNotification(
                'FreshGuard 알림 테스트',
                `유통기한 임박/만료 재고가 총 ${urgentTotal}건 있습니다!`
              );
            }}
          >
            <BellRing size={16} />
            <span>즉시 테스트 알림 울리기</span>
          </button>
        </div>
      )}

      {/* 요약 통계 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* 전체 재고 */}
        <div className="glass-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => onFilterStatus('all')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>전체 재고</span>
            <Package size={22} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {items.length} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>개 품목</span>
          </div>
        </div>

        {/* 유통기한 만료 */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: expiredCount > 0 ? 'rgba(239,68,68,0.5)' : undefined, cursor: 'pointer' }} onClick={() => onFilterStatus('expired')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: 600 }}>유통기한 만료</span>
            <AlertCircle size={22} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>
            {expiredCount} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>개</span>
          </div>
        </div>

        {/* 임박 / 오늘 만료 */}
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: (criticalCount + warningCount) > 0 ? 'rgba(245,158,11,0.5)' : undefined, cursor: 'pointer' }} onClick={() => onFilterStatus('warning')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>임박 / 오늘 만료</span>
            <AlertTriangle size={22} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
            {criticalCount + warningCount} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>개</span>
          </div>
        </div>

        {/* 안전 */}
        <div className="glass-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => onFilterStatus('safe')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: 600 }}>유통기한 여유</span>
            <CheckCircle2 size={22} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
            {safeCount} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)' }}>개</span>
          </div>
        </div>
      </div>
    </div>
  );
}
