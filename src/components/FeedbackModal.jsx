import React, { useState, useEffect } from 'react';
import { X, MessageSquareHeart, Bug, Lightbulb, Send, CheckCircle2, ListFilter, Trash2, Calendar, Mail, Image, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../db';
import { sendDiscordNotification } from '../services/notificationService';

export default function FeedbackModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'admin'
  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [attachedImage, setAttachedImage] = useState(null); // base64 또는 파일명
  const [submitted, setSubmitted] = useState(false);

  const [feedbackList, setFeedbackList] = useState([]);

  const loadFeedbacks = async () => {
    const list = await db.feedbacks.toArray();
    setFeedbackList(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      loadFeedbacks();
    }
  }, [activeTab]);

  // 이미지 파일 선택 처리 (Base64 변환)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하만 첨부 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
      attachedImage: attachedImage || null,
      createdAt: new Date().toISOString()
    };

    await db.feedbacks.add(feedbackData);

    const settingsList = await db.settings.toArray();
    const settingsMap = Object.fromEntries(settingsList.map(s => [s.key, s.value]));
    const discordWebhookUrl = settingsMap.discordWebhookUrl;

    if (discordWebhookUrl) {
      const typeLabel = type === 'bug' ? '🐞 버그 제보' : '💡 기능 요청';
      await sendDiscordNotification(discordWebhookUrl, `새로운 피드백 [${typeLabel}]`, [
        {
          name: title,
          quantity: 1,
          expiryDate: new Date().toLocaleDateString(),
          statusLabel: typeLabel,
          memo: `${content}\n(연락처: ${contact || '없음'}, 이미지첨부: ${attachedImage ? '있음' : '없음'})`
        }
      ]);
    }

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    setSubmitted(true);
  };

  const handleDeleteFeedback = async (id) => {
    if (window.confirm('이 피드백 항목을 목록에서 지우시겠습니까?')) {
      await db.feedbacks.delete(id);
      loadFeedbacks();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        {/* Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquareHeart size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>버그 제보 & 요청 게시판</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* View mode Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            className={activeTab === 'write' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
            onClick={() => { setActiveTab('write'); setSubmitted(false); }}
          >
            <Send size={16} />
            <span>새 제보 작성하기</span>
          </button>
          <button
            className={activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('admin')}
          >
            <ListFilter size={16} />
            <span>📋 접수 목록 ({feedbackList.length}건)</span>
          </button>
        </div>

        {/* TAB 1: 작성 폼 */}
        {activeTab === 'write' ? (
          submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <CheckCircle2 size={54} color="var(--accent-success)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                소중한 의견이 등록되었습니다! 🎉
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                첨부하신 내용과 파일이 안전하게 저장되었습니다.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('admin')}>
                제보 목록 확인하러 가기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Type Category */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={type === 'bug' ? 'btn-primary' : 'btn-secondary'}
                  style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                  onClick={() => setType('bug')}
                >
                  <Bug size={16} />
                  <span>🐞 버그 제보</span>
                </button>

                <button
                  type="button"
                  className={type === 'feature' ? 'btn-primary' : 'btn-secondary'}
                  style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                  onClick={() => setType('feature')}
                >
                  <Lightbulb size={16} />
                  <span>💡 기능 요청</span>
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
                  placeholder="제목을 입력해주세요"
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
                  rows={3}
                  placeholder="불편한 점이나 요청사항을 입력해주세요."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* File / Image Attachment (신규) */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  스크린샷 / 사진 파일 첨부 (선택)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="feedback-image-input"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="feedback-image-input" className="btn-secondary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Upload size={14} />
                    <span>사진 파일 선택</span>
                  </label>
                  {attachedImage && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Image size={14} /> 첨부 완료
                    </span>
                  )}
                </div>
                {attachedImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={attachedImage} alt="미리보기" style={{ maxHeight: '100px', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                  </div>
                )}
              </div>

              {/* Contact */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  연락처 / 이메일 (선택)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="답변 받아보실 연락처나 이메일"
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
                  <span>제출하기</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* TAB 2: 관리자용 목록 및 첨부사진 보기 */
          <div>
            {feedbackList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <MessageSquareHeart size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                <p>아직 접수된 버그 제보나 요청사항이 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }}>
                {feedbackList.map(item => (
                  <div key={item.id} className="glass-card" style={{ padding: '1rem', background: 'var(--bg-input)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className={`badge ${item.type === 'bug' ? 'badge-expired' : 'badge-warning'}`}>
                        {item.type === 'bug' ? '🐞 버그 제보' : '💡 기능 요청'}
                      </span>
                      <button className="btn-icon" onClick={() => handleDeleteFeedback(item.id)} title="삭제">
                        <Trash2 size={16} color="var(--accent-danger)" />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      {item.title}
                    </h4>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '0.75rem', background: 'var(--bg-main)', padding: '0.6rem', borderRadius: '0.4rem' }}>
                      {item.content}
                    </p>

                    {/* 첨부 이미지 표시 */}
                    {item.attachedImage && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>🖼️ 첨부 이미지:</p>
                        <img src={item.attachedImage} alt="첨부" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Mail size={13} /> {item.contact || '익명'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={13} /> {new Date(item.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn-secondary" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
