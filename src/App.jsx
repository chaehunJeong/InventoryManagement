import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';

import { db, initDatabase } from './db';
import { checkAndSendExpiryNotifications, getDDayStatus } from './services/notificationService';
import { lookupBarcodeInfo } from './services/barcodeService';

import Header from './components/Header';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import AddItemModal from './components/AddItemModal';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import BackupRestoreModal from './components/BackupRestoreModal';
import FeedbackModal from './components/FeedbackModal';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Dexie 데이터베이스 실시간 바인딩
  const items = useLiveQuery(() => db.items.toArray(), []) || [];
  const settingsList = useLiveQuery(() => db.settings.toArray(), []) || [];

  const settingsMap = Object.fromEntries(settingsList.map(s => [s.key, s.value]));
  const warningDays = Number(settingsMap.warningDays || 3);

  // DB 초기화 및 테마/알림 자동 체크
  useEffect(() => {
    const bootstrap = async () => {
      await initDatabase();
      
      const sampleCleaned = localStorage.getItem('freshguard_sample_cleaned');
      if (!sampleCleaned) {
        await db.items.clear();
        localStorage.setItem('freshguard_sample_cleaned', 'true');
      }

      await checkAndSendExpiryNotifications(false);
    };
    bootstrap();
  }, []);

  // 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 임박 항목 수 계산
  const urgentCount = items.filter(item => {
    const status = getDDayStatus(item.expiryDate, warningDays).status;
    return status === 'expired' || status === 'critical' || status === 'warning';
  }).length;

  // 품목 추가/수정 처리
  const handleSaveItem = async (formData) => {
    if (editingItem) {
      await db.items.update(editingItem.id, formData);
    } else {
      await db.items.add(formData);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }

    setIsAddModalOpen(false);
    setEditingItem(null);

    await checkAndSendExpiryNotifications(true);
  };

  // 품목 삭제
  const handleDeleteItem = async (id) => {
    if (window.confirm('이 재고 항목을 삭제하시겠습니까?')) {
      await db.items.delete(id);
    }
  };

  // 수량 증감 변경
  const handleUpdateQuantity = async (id, newQuantity) => {
    if (newQuantity <= 0) {
      if (window.confirm('수량이 0개가 되었습니다. 재고 소진 처리(삭제)하시겠습니까?')) {
        await db.items.delete(id);
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
      }
    } else {
      await db.items.update(id, { quantity: newQuantity });
    }
  };

  // 바코드 카메라/사진 스캔 성공 시
  const handleScanSuccess = async (barcodeText) => {
    setIsScanModalOpen(false);
    
    const info = await lookupBarcodeInfo(barcodeText);

    setEditingItem(null);
    setIsAddModalOpen(true);

    setTimeout(() => {
      const barcodeInput = document.querySelector('input[placeholder*="8801115114154"]');
      if (barcodeInput) {
        barcodeInput.value = barcodeText;
        barcodeInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <Header
        onOpenAddModal={() => { setEditingItem(null); setIsAddModalOpen(true); }}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
        theme={theme}
        setTheme={setTheme}
        urgentCount={urgentCount}
      />

      {/* Dashboard Overview & Warning Banner */}
      <Dashboard
        items={items}
        warningDays={warningDays}
        onFilterStatus={(status) => setActiveStatusFilter(status)}
      />

      {/* Main Inventory Tracker List */}
      <InventoryList
        items={items}
        warningDays={warningDays}
        onEdit={(item) => { setEditingItem(item); setIsAddModalOpen(true); }}
        onDelete={handleDeleteItem}
        onUpdateQuantity={handleUpdateQuantity}
        activeStatusFilter={activeStatusFilter}
        setActiveStatusFilter={setActiveStatusFilter}
      />

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <AddItemModal
          initialData={editingItem}
          warningDays={warningDays}
          onClose={() => { setIsAddModalOpen(false); setEditingItem(null); }}
          onSave={handleSaveItem}
          onOpenScanModal={() => { setIsAddModalOpen(false); setIsScanModalOpen(true); }}
        />
      )}

      {/* Barcode Camera & Photo Scanner Modal */}
      {isScanModalOpen && (
        <BarcodeScannerModal
          onClose={() => setIsScanModalOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}

      {/* Notification Settings Modal */}
      {isSettingsModalOpen && (
        <NotificationSettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          onSaveSettings={() => {
            checkAndSendExpiryNotifications(true);
          }}
        />
      )}

      {/* Free DB Backup & Restore Modal */}
      {isBackupModalOpen && (
        <BackupRestoreModal
          onClose={() => setIsBackupModalOpen(false)}
          onRestoreSuccess={() => {
            checkAndSendExpiryNotifications(true);
          }}
        />
      )}

      {/* Bug & Feature Request Modal */}
      {isFeedbackModalOpen && (
        <FeedbackModal
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      )}
    </div>
  );
}
