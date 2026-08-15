import React, { useState, useEffect } from 'react';
import { X, QrCode, Search, Calendar, Package, Tag, Save, Check } from 'lucide-react';
import { lookupBarcodeInfo } from '../services/barcodeService';
import { getDDayStatus } from '../services/notificationService';

const CATEGORIES = [
  '유제품/냉장',
  '신선식품',
  '가공식품',
  '음료/주류',
  '냉동식품',
  '베이커리/간식',
  '의약품/영양제',
  '기타'
];

export default function AddItemModal({ initialData, onClose, onSave, onOpenScanModal, warningDays = 3 }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    barcode: initialData?.barcode || '',
    category: initialData?.category || '유제품/냉장',
    quantity: initialData?.quantity || 1,
    expiryDate: initialData?.expiryDate || '',
    memo: initialData?.memo || ''
  });

  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  // 유통기한 D-Day 계산 결과
  const dDayInfo = getDDayStatus(formData.expiryDate, warningDays);

  // 바코드 입력 시 자동으로 상품 검색
  const handleBarcodeLookup = async (codeToSearch) => {
    const code = codeToSearch || formData.barcode;
    if (!code) return;

    setLoadingLookup(true);
    setLookupMessage('바코드 정보 검색 중...');
    
    const info = await lookupBarcodeInfo(code);
    setLoadingLookup(false);

    if (info.found) {
      setFormData(prev => ({
        ...prev,
        barcode: code,
        name: prev.name || info.name,
        category: info.category || prev.category
      }));
      setLookupMessage(`✨ 바코드 정보 연동 완료 (${info.name})`);
    } else {
      setLookupMessage('등록되지 않은 바코드입니다. 직접 정보를 입력해주세요.');
    }
  };

  // N일 후 유통기한 빠른 설정
  const handleQuickExpiryDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, expiryDate: dateStr }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('품목명을 입력해주세요.');
      return;
    }
    if (!formData.expiryDate) {
      alert('유통기한을 입력해주세요.');
      return;
    }

    onSave({
      ...formData,
      quantity: Number(formData.quantity) || 1,
      createdAt: initialData?.createdAt || new Date().toISOString()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {initialData ? '재고 품목 수정' : '새 재고 품목 등록'}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 바코드 입력 영역 */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              바코드 번호 (선택)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="예: 8801115114154"
                value={formData.barcode}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleBarcodeLookup(formData.barcode)}
                title="바코드 정보 조회"
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={onOpenScanModal}
                style={{ padding: '0.75rem 1rem' }}
                title="카메라/사진 스캔"
              >
                <QrCode size={18} />
                <span>스캔</span>
              </button>
            </div>
            {lookupMessage && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '0.4rem' }}>
                {lookupMessage}
              </p>
            )}
          </div>

          {/* 품목명 */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              품목명 <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 서울우유 1000ml"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* 카테고리 & 수량 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                카테고리
              </label>
              <select
                className="form-select"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                수량
              </label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>

          {/* 유통기한 선택 & 빠른 설정 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                유통기한 <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              {formData.expiryDate && (
                <span className={`badge badge-${dDayInfo.status}`}>
                  {dDayInfo.label}
                </span>
              )}
            </div>

            <input
              type="date"
              className="form-input"
              value={formData.expiryDate}
              onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
              required
            />

            {/* 빠른 날짜 선택 버튼 */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>빠른 입력:</span>
              {[7, 14, 30, 90, 180].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleQuickExpiryDays(days)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  +{days}일
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              보관 위치 / 메모 (선택)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 냉장고 첫째 칸, 팬트리 A"
              value={formData.memo}
              onChange={e => setFormData({ ...formData, memo: e.target.value })}
            />
          </div>

          {/* Submit buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              <Save size={18} />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
