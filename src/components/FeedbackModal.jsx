import React, { useState } from 'react';
import { X, MessageSquareHeart, Bug, Lightbulb, Send, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../db';
import { sendDiscordNotification } from '../services/notificationService';

export default function FeedbackModal({ onClose }) {
  const [type, setType] = useState('bug'); // 'bug' | 'feature' | 'opinion'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const feedbackData = {
      type,
      title,
      content,
      contact: contact.trim() || '익명',
      createdAt: new Date().toISOString()
    };

    // 1. IndexedDB에 저장
    await db.feedbacks.add(feedbackData);

    // 2. 디스코드 Webhook이 설정되어 있는 경우 개발자에게 실시간 메시지 전송
    const settingsList = await db.settings.toArray();
    const settingsMap = Object.fromEntries(settingsList.map(s => [s.key, s.value]));
    const discordWebhookUrl = settingsMap.discordWebhookUrl;

    if (discordWebhookUrl) {
      const typeLabel = type === 'bug' ? '🐞 버그 제보' : type === 'feature' ? '💡 기능 요청' : '💬 기타 의견';
      await sendDiscordNotification(discordWebhookUrl, `새로운 피드백 [${typeLabel}]`, [
        {
          name: title,
          quantity: 1,
          expiryDate: new Date().toLocaleDateString(),
          statusLabel: typeLabel,
          memo: `${content}\n(연락처: ${contact || '없음'})`
        }
      ]);
    }

    // 축하 폭죽 효과
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    setSubmitted(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquareHeart size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>버그 제보 & 기능 요청</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={54} color="var(--accent-success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              소중한 의견이 등록되었습니다! 🎉
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              제출해 주신 버그/요청사항을 검토하여 더욱 편리한 서비스로 개선하겠습니다.
            </p>
            <button className="btn-primary" onClick={onClose}>
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Feedback Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={type === 'bug' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => setType('bug')}
              >
                <Bug size={16} />
                <span>버그 제보</span>
              </button>

              <button
                type="button"
                className={type === 'feature' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => setType('feature')}
              >
                <Lightbulb size={16} />
                <span>기능 요청</span>
              </button>
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                제목 <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={type === 'bug' ? '예: 바코드 스캔 카메라가 켜지지 않아요' : '예: 유통기한 정렬 순서 변경 기능 희망'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Content */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                상세 내용 <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="불편하셨던 점이나 원하시는 기능 상세 내용을 자유롭게 적어주세요."
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Contact (Optional) */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                연락처 / 이메일 (선택)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="답변을 받아보실 이메일이나 연락처 (생략 가능)"
                value={contact}
                onChange={e => setContact(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                취소
              </button>
              <button type="submit" className="btn-primary">
                <Send size={16} />
                <span>의견 제출하기</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
