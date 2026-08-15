import React, { useState, useEffect } from 'react';
import { X, Bell, Send, CheckCircle, MessageSquare, Sparkles } from 'lucide-react';
import { 
  requestBrowserNotificationPermission, 
  sendDiscordNotification, 
  sendKakaoTalkNotification 
} from '../services/notificationService';
import { db } from '../db';

export default function NotificationSettingsModal({ onClose, onSaveSettings }) {
  const [permissionState, setPermissionState] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [warningDays, setWarningDays] = useState(3);
  const [enableBrowserNotif, setEnableBrowserNotif] = useState(true);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [kakaoAccessToken, setKakaoAccessToken] = useState('');

  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    db.settings.toArray().then(settings => {
      const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
      if (map.warningDays) setWarningDays(Number(map.warningDays));
      if (map.enableBrowserNotif !== undefined) setEnableBrowserNotif(Boolean(map.enableBrowserNotif));
      if (map.discordWebhookUrl) setDiscordWebhookUrl(map.discordWebhookUrl);
      if (map.kakaoAccessToken) setKakaoAccessToken(map.kakaoAccessToken);
    });
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setPermissionState(granted ? 'granted' : 'denied');
  };

  // Discord 테스트
  const handleTestDiscord = async () => {
    if (!discordWebhookUrl) {
      alert('Discord Webhook URL을 입력해주세요.');
      return;
    }
    setTestResult({ status: 'sending', msg: '디스코드 전송 중...' });
    const success = await sendDiscordNotification(
      discordWebhookUrl,
      'FreshGuard 테스트 알림',
      [{ name: '서울우유 1000ml', quantity: 1, expiryDate: '2026-08-18', statusLabel: 'D-3 (테스트)', memo: '연결 완료' }]
    );

    if (success) {
      setTestResult({ status: 'success', msg: '✨ 디스코드 메시지가 발송되었습니다!' });
    } else {
      setTestResult({ status: 'error', msg: '❌ 디스코드 전송 실패. URL을 다시 확인해주세요.' });
    }
  };

  // KakaoTalk 테스트
  const handleTestKakao = async () => {
    if (!kakaoAccessToken) {
      alert('카카오 액세스 토큰(Access Token)을 입력해 주세요.');
      return;
    }
    setTestResult({ status: 'sending', msg: '카카오톡 메시지 전송 중...' });
    const success = await sendKakaoTalkNotification(
      kakaoAccessToken,
      [{ name: '유기농 두부 300g', quantity: 2, expiryDate: '2026-08-16', statusLabel: 'D-1 (테스트)', memo: '찌개용' }]
    );

    if (success) {
      setTestResult({ status: 'success', msg: '🟡 카카오톡 "나에게 보내기" 메시지가 정상 전송되었습니다!' });
    } else {
      setTestResult({ status: 'error', msg: '❌ 카카오톡 전송 실패. 액세스 토큰을 확인해 주세요.' });
    }
  };

  const handleSave = async () => {
    await db.settings.put({ key: 'warningDays', value: warningDays });
    await db.settings.put({ key: 'enableBrowserNotif', value: enableBrowserNotif });
    await db.settings.put({ key: 'discordWebhookUrl', value: discordWebhookUrl });
    await db.settings.put({ key: 'kakaoAccessToken', value: kakaoAccessToken });

    onSaveSettings({ warningDays, enableBrowserNotif, discordWebhookUrl, kakaoAccessToken });
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
          {/* 1. 카카오톡 알림 (✨신규) */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'rgba(254, 229, 0, 0.1)', borderColor: 'rgba(254, 229, 0, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={20} color="#FEE500" fill="#FEE500" />
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fef08a' }}>1. 카카오톡 무료 알림 (나에게 보내기)</h4>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Kakao Developers의 액세스 토큰(Access Token)을 넣으시면 카카오톡 폰 메시지로 실시간 전달됩니다.
            </p>

            <input
              type="text"
              className="form-input"
              placeholder="카카오 Access Token 입력..."
              value={kakaoAccessToken}
              onChange={e => setKakaoAccessToken(e.target.value)}
              style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#FEE500', color: '#fef08a' }}
                onClick={handleTestKakao}
              >
                <Send size={14} />
                <span>카카오톡 테스트 발송</span>
              </button>
            </div>
          </div>

          {/* 2. 웹 브라우저 푸시 알림 */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-input)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>2. 스마트폰/PC 웹 푸시 알림</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                권한: <strong style={{ color: permissionState === 'granted' ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                  {permissionState === 'granted' ? '승인됨' : '승인 필요'}
                </strong>
              </span>

              {permissionState !== 'granted' ? (
                <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleRequestPermission}>
                  알림 권한 승인
                </button>
              ) : (
                <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem' }}>
                  <CheckCircle size={16} /> 사용 가능
                </span>
              )}
            </div>
          </div>

          {/* 3. 경고 기준 설정 */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              알림 수신 기준 (D-Day)
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

          {/* 4. Discord Webhook */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-input)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem' }}>4. 디스코드(Discord) 메시지</h4>
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
                <span>디스코드 테스트 발송</span>
              </button>
            </div>
          </div>

          {/* Result Alert message */}
          {testResult && (
            <p style={{ 
              fontSize: '0.85rem', 
              color: testResult.status === 'success' ? 'var(--accent-success)' : testResult.status === 'error' ? 'var(--accent-danger)' : 'var(--text-secondary)'
            }}>
              {testResult.msg}
            </p>
          )}

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
