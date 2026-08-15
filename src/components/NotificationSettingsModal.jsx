import React, { useState, useEffect } from 'react';
import { X, Bell, Send, CheckCircle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { requestBrowserNotificationPermission, sendDiscordNotification, checkAndSendExpiryNotifications } from '../services/notificationService';
import { db } from '../db';

export default function NotificationSettingsModal({ onClose, onSaveSettings }) {
  const [permissionState, setPermissionState] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [warningDays, setWarningDays] = useState(3);
  const [enableBrowserNotif, setEnableBrowserNotif] = useState(true);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // 저장된 설정 로드
    db.settings.toArray().then(settings => {
      const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
      if (map.warningDays) setWarningDays(Number(map.warningDays));
      if (map.enableBrowserNotif !== undefined) setEnableBrowserNotif(Boolean(map.enableBrowserNotif));
      if (map.discordWebhookUrl) setDiscordWebhookUrl(map.discordWebhookUrl);
    });
  }, []);

  // 브라우저 권한 요청
  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setPermissionState(granted ? 'granted' : 'denied');
  };

  // Discord 테스트 발송
  const handleTestDiscord = async () => {
    if (!discordWebhookUrl) {
      alert('Discord Webhook URL을 입력해주세요.');
      return;
    }
    setTestResult({ status: 'sending', msg: '전송 중...' });
    const success = await sendDiscordNotification(
      discordWebhookUrl,
      'FreshGuard 테스트 알림',
      [{ name: '테스트 우유', quantity: 1, expiryDate: '2026-08-18', statusLabel: 'D-3 (테스트)', memo: '정상 연결 확인' }]
    );

    if (success) {
      setTestResult({ status: 'success', msg: '✨ 디스코드 메시지가 성공적으로 발송되었습니다!' });
    } else {
      setTestResult({ status: 'error', msg: '❌ 디스코드 전송 실패. URL을 다시 확인해주세요.' });
    }
  };

  const handleSave = async () => {
    await db.settings.put({ key: 'warningDays', value: warningDays });
    await db.settings.put({ key: 'enableBrowserNotif', value: enableBrowserNotif });
    await db.settings.put({ key: 'discordWebhookUrl', value: discordWebhookUrl });

    onSaveSettings({ warningDays, enableBrowserNotif, discordWebhookUrl });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={22} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>무료 알림 설정</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. 웹 브라우저 푸시 알림 */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-input)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>1. 브라우저/스마트폰 알림 (100% 무료)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  기기 데스크톱 및 스마트폰 앱 알림을 통해 직접 수신합니다.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                권한 상태: 
                <span style={{ 
                  marginLeft: '0.4rem', 
                  color: permissionState === 'granted' ? 'var(--accent-success)' : 'var(--accent-warning)',
                  fontWeight: 700 
                }}>
                  {permissionState === 'granted' ? '승인됨 (알림 수신 가능)' : '승인 필요'}
                </span>
              </span>

              {permissionState !== 'granted' ? (
                <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleRequestPermission}>
                  알림 권한 허용하기
                </button>
              ) : (
                <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem' }}>
                  <CheckCircle size={16} /> 활성화됨
                </span>
              )}
            </div>
          </div>

          {/* 2. 경고 기준 날짜 설정 */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              유통기한 임박 경고 알림 기준 (D-Day)
            </label>
            <select
              className="form-select"
              value={warningDays}
              onChange={e => setWarningDays(Number(e.target.value))}
            >
              <option value={1}>1일 전 알림 (D-1)</option>
              <option value={3}>3일 전 알림 (D-3)</option>
              <option value={5}>5일 전 알림 (D-5)</option>
              <option value={7}>7일 전 알림 (D-7)</option>
            </select>
          </div>

          {/* 3. Discord Webhook 무료 메시지 연동 */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-input)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>2. 디스코드(Discord) 무료 메시지 알림</span>
              <Sparkles size={16} color="#8b5cf6" />
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              개인 디스코드 채널 Webhook 주소를 넣으시면 스마트폰 폰 메시지로 바로 통보받을 수 있습니다.
            </p>

            <input
              type="text"
              className="form-input"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhookUrl}
              onChange={e => setDiscordWebhookUrl(e.target.value)}
              style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={handleTestDiscord}
              >
                <Send size={14} />
                <span>테스트 메시지 발송</span>
              </button>
            </div>

            {testResult && (
              <p style={{ 
                fontSize: '0.8rem', 
                marginTop: '0.5rem',
                color: testResult.status === 'success' ? 'var(--accent-success)' : testResult.status === 'error' ? 'var(--accent-danger)' : 'var(--text-secondary)'
              }}>
                {testResult.msg}
              </p>
            )}
          </div>

          {/* Footer Save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn-secondary" onClick={onClose}>
              닫기
            </button>
            <button className="btn-primary" onClick={handleSave}>
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
