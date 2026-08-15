import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, LayoutGrid, List, Plus, Minus, Trash2, Edit3, Calendar, QrCode, Tag } from 'lucide-react';
import { getDDayStatus } from '../services/notificationService';

export default function InventoryList({ 
  items = [], 
  warningDays = 3, 
  onEdit, 
  onDelete, 
  onUpdateQuantity,
  activeStatusFilter,
  setActiveStatusFilter
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('expiry'); // 'expiry' | 'name' | 'created'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // 필터링 및 정렬 처리
  const filteredItems = items.filter(item => {
    // 1. 검색어 필터
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchTerm)) ||
      (item.memo && item.memo.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. 카테고리 필터
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

    // 3. 상태 필터 (대시보드에서 클릭한 상태)
    if (activeStatusFilter !== 'all') {
      const status = getDDayStatus(item.expiryDate, warningDays).status;
      if (activeStatusFilter === 'expired' && status !== 'expired') return false;
      if (activeStatusFilter === 'warning' && (status !== 'warning' && status !== 'critical')) return false;
      if (activeStatusFilter === 'safe' && status !== 'safe') return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'expiry') {
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'ko');
    } else {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

  return (
    <div>
      {/* Control Panel: Search & Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="품목명, 바코드, 메모 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters & Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Category Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={16} color="var(--text-secondary)" />
              <select
                className="form-select"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="all">전체 카테고리</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpDown size={16} color="var(--text-secondary)" />
              <select
                className="form-select"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="expiry">유통기한순 정렬</option>
                <option value="name">품목명순 정렬</option>
                <option value="created">최근 등록순</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <button
                className="btn-icon"
                style={{ padding: '0.35rem', background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)' }}
                onClick={() => setViewMode('grid')}
                title="카드 보기"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className="btn-icon"
                style={{ padding: '0.35rem', background: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)' }}
                onClick={() => setViewMode('table')}
                title="리스트 보기"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Status Filter Reset Banner */}
        {activeStatusFilter !== 'all' && (
          <div style={{
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <span>
              필터 적용 중: <strong>
                {activeStatusFilter === 'expired' ? '유통기한 만료' : activeStatusFilter === 'warning' ? '유통기한 임박' : '안전 재고'}
              </strong>
            </span>
            <button
              onClick={() => setActiveStatusFilter('all')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              전체 보기 해제 ✕
            </button>
          </div>
        )}
      </div>

      {/* Items Empty State */}
      {filteredItems.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Tag size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            조건에 해당하는 재고 품목이 없습니다.
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            새 품목을 추가하거나 검색/필터를 변경해 보세요.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredItems.map(item => {
            const dDay = getDDayStatus(item.expiryDate, warningDays);
            return (
              <div key={item.id} className="glass-card" style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div>
                  {/* Top Badge & Category */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '0.35rem', background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                      {item.category || '기타'}
                    </span>
                    <span className={`badge badge-${dDay.status}`}>
                      {dDay.label}
                    </span>
                  </div>

                  {/* Item Name */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', wordBreak: 'break-word' }}>
                    {item.name}
                  </h3>

                  {/* Barcode if present */}
                  {item.barcode && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                      <QrCode size={13} />
                      <span>{item.barcode}</span>
                    </div>
                  )}

                  {/* Expiry Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <Calendar size={14} color="var(--accent-primary)" />
                    <span>유통기한: <strong>{item.expiryDate}</strong></span>
                  </div>

                  {/* Memo */}
                  {item.memo && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', marginBottom: '1rem' }}>
                      📍 {item.memo}
                    </p>
                  )}
                </div>

                {/* Bottom Actions & Quantity Selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-color)',
                  marginTop: '0.75rem'
                }}>
                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.2rem 0.4rem', borderRadius: '0.5rem' }}>
                    <button 
                      className="btn-icon" 
                      style={{ padding: '0.2rem' }}
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '1.5rem', textAlign: 'center' }}>
                      {item.quantity}개
                    </span>
                    <button 
                      className="btn-icon" 
                      style={{ padding: '0.2rem' }}
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn-icon" onClick={() => onEdit(item)} title="수정">
                      <Edit3 size={16} color="var(--text-secondary)" />
                    </button>
                    <button className="btn-icon" onClick={() => onDelete(item.id)} title="삭제">
                      <Trash2 size={16} color="var(--accent-danger)" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>품목명</th>
                <th style={{ padding: '1rem' }}>카테고리</th>
                <th style={{ padding: '1rem' }}>유통기한</th>
                <th style={{ padding: '1rem' }}>상태</th>
                <th style={{ padding: '1rem' }}>수량</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const dDay = getDDayStatus(item.expiryDate, warningDays);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      {item.name}
                      {item.barcode && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.barcode}</div>}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.category || '-'}</td>
                    <td style={{ padding: '1rem' }}>{item.expiryDate}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge badge-${dDay.status}`}>
                        {dDay.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-input)', padding: '0.2rem 0.4rem', borderRadius: '0.5rem' }}>
                        <button className="btn-icon" style={{ padding: '0.2rem' }} onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: 700 }}>{item.quantity}</span>
                        <button className="btn-icon" style={{ padding: '0.2rem' }} onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => onEdit(item)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => onDelete(item.id)}>
                        <Trash2 size={16} color="var(--accent-danger)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
