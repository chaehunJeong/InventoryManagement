import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Upload, AlertCircle } from 'lucide-react';

export default function BarcodeScannerModal({ onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file'
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const qrRegionId = 'html5qr-code-full-region';

  // 카메라 비디오 스캐너 시작
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let html5QrcodeInstance = null;
    let isSubscribed = true;

    const startScanner = async () => {
      try {
        setErrorMsg('');

        // 이전 DOM 내부 자식 노드 제거 (2개 렌더링 중복 방지)
        const container = document.getElementById(qrRegionId);
        if (container) {
          container.innerHTML = '';
        }

        html5QrcodeInstance = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrcodeInstance;

        const config = { 
          fps: 15, 
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.333333,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        };

        await html5QrcodeInstance.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isSubscribed) {
              onScanSuccess(decodedText);
              stopScanner();
            }
          },
          () => {}
        );
      } catch (err) {
        console.error('카메라 시작 실패:', err);
        if (isSubscribed) {
          setErrorMsg('카메라 접근 권한이 없거나 이미 다른 곳에서 사용 중입니다.');
        }
      }
    };

    // 약간의 DOM 마운트 타임아웃 지원
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [activeTab]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('스캐너 정지 처리:', err);
      } finally {
        scannerRef.current = null;
        const container = document.getElementById(qrRegionId);
        if (container) container.innerHTML = '';
      }
    }
  };

  // 이미지 파일 스캔
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setErrorMsg('');
      const html5Qrcode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5Qrcode.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error('이미지 바코드 스캔 실패:', err);
      setErrorMsg('선택한 사진에서 바코드를 인식하지 못했습니다. 더 선명한 이미지를 선택해주세요.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>바코드 스캔</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            className={activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTab('camera')}
          >
            <Camera size={18} />
            <span>카메라 스캔</span>
          </button>
          <button
            className={activeTab === 'file' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              stopScanner();
              setActiveTab('file');
            }}
          >
            <Upload size={18} />
            <span>바코드 사진 업로드</span>
          </button>
        </div>

        {/* Camera View */}
        {activeTab === 'camera' && (
          <div>
            <div 
              id={qrRegionId} 
              style={{ 
                width: '100%', 
                height: '300px', 
                background: '#000000', 
                borderRadius: '0.75rem',
                overflow: 'hidden',
                position: 'relative'
              }} 
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.75rem' }}>
              카메라로 제품 포장지의 바코드를 비춰주세요
            </p>
          </div>
        )}

        {/* File Upload View */}
        {activeTab === 'file' && (
          <div style={{
            border: '2px dashed var(--border-highlight)',
            borderRadius: '1rem',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: 'var(--bg-input)'
          }}>
            <Upload size={40} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>바코드 사진 선택</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              스마트폰으로 찍은 제품 바코드 이미지를 업로드하세요
            </p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              id="barcode-file-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="barcode-file-input" className="btn-primary" style={{ cursor: 'pointer' }}>
              사진 파일 찾기
            </label>
            <div id="file-scanner-temp" style={{ display: 'none' }}></div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
