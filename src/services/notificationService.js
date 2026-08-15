import { db } from '../db';

/**
 * 유통기한 D-Day 및 상태 계산
 */
export function getDDayStatus(expiryDateStr, warningDays = 3) {
  if (!expiryDateStr) return { status: 'safe', dDay: 999, label: '미정' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', dDay: diffDays, label: `유통기한 만료 (${Math.abs(diffDays)}일 지난)` };
  } else if (diffDays === 0) {
    return { status: 'critical', dDay: 0, label: '오늘 만료!' };
  } else if (diffDays <= warningDays) {
    return { status: 'warning', dDay: diffDays, label: `D-${diffDays} (임박)` };
  } else {
    return { status: 'safe', dDay: diffDays, label: `D-${diffDays}` };
  }
}

/**
 * 브라우저 웹 알림 권한 요청
 */
export async function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) {
    alert('이 브라우저는 웹 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * 브라우저 푸시 알림 발송
 */
export function triggerLocalNotification(title, body, icon = '/favicon.ico') {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: icon,
      vibrate: [200, 100, 200]
    });
  }
}

/**
 * Discord Webhook 무료 메시지 전송
 */
export async function sendDiscordNotification(webhookUrl, title, messageItems) {
  if (!webhookUrl) return false;

  try {
    const embeds = [
      {
        title: `🚨 ${title}`,
        color: 15158332,
        fields: messageItems.map(item => ({
          name: `${item.name} (${item.quantity}개)`,
          value: `📅 유통기한: **${item.expiryDate}** (${item.statusLabel})\n📍 메모: ${item.memo || '없음'}`,
          inline: false
        })),
        footer: {
          text: 'FreshGuard 무료 재고/유통기한 관리 솔루션'
        },
        timestamp: new Date().toISOString()
      }
    ];

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔔 **유통기한 임박 및 만료 재고 알림** (${messageItems.length}건)`,
        embeds
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Discord Webhook 전송 실패:', error);
    return false;
  }
}

/**
 * KakaoTalk "나에게 메시지 보내기" API 전송 (무료)
 * @param {string} accessToken - 카카오 액세스 토큰
 * @param {Array} messageItems 
 */
export async function sendKakaoTalkNotification(accessToken, messageItems) {
  if (!accessToken) return false;

  try {
    const summaryText = messageItems.slice(0, 3).map(item => `• ${item.name} (${item.statusLabel})`).join('\n');
    const extraText = messageItems.length > 3 ? `\n외 ${messageItems.length - 3}건 더 있음` : '';

    const templateObject = {
      object_type: 'feed',
      content: {
        title: `🚨 FreshGuard 유통기한 임박 알림 (${messageItems.length}건)`,
        description: `${summaryText}${extraText}\n\n냉장고와 팬트리를 확인해 주세요!`,
        image_url: 'https://cdn-icons-png.flaticon.com/512/3081/3081986.png',
        link: {
          web_url: window.location.origin,
          mobile_web_url: window.location.origin
        }
      },
      buttons: [
        {
          title: '재고 관리 앱으로 이동',
          link: {
            web_url: window.location.origin,
            mobile_web_url: window.location.origin
          }
        }
      ]
    };

    const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken.trim()}`
      },
      body: new URLSearchParams({
        template_object: JSON.stringify(templateObject)
      })
    });

    return response.ok;
  } catch (error) {
    console.error('카카오톡 메시지 전송 실패:', error);
    return false;
  }
}

/**
 * 임박 재고 전체 체크 및 무료 알림 전송
 */
export async function checkAndSendExpiryNotifications(force = false) {
  const settingsList = await db.settings.toArray();
  const settingsMap = Object.fromEntries(settingsList.map(s => [s.key, s.value]));

  const warningDays = Number(settingsMap.warningDays || 3);
  const enableBrowserNotif = settingsMap.enableBrowserNotif ?? true;
  const discordWebhookUrl = settingsMap.discordWebhookUrl || '';
  const kakaoAccessToken = settingsMap.kakaoAccessToken || '';
  const lastCheckedDate = settingsMap.lastCheckedDate || '';

  const todayStr = new Date().toISOString().split('T')[0];

  if (!force && lastCheckedDate === todayStr) {
    return { checked: false, reason: 'already_checked_today' };
  }

  const allItems = await db.items.toArray();
  const urgentItems = [];

  allItems.forEach(item => {
    const statusInfo = getDDayStatus(item.expiryDate, warningDays);
    if (statusInfo.status === 'expired' || statusInfo.status === 'critical' || statusInfo.status === 'warning') {
      urgentItems.push({
        ...item,
        statusLabel: statusInfo.label,
        status: statusInfo.status
      });
    }
  });

  if (urgentItems.length === 0) {
    await db.settings.put({ key: 'lastCheckedDate', value: todayStr });
    return { checked: true, alertCount: 0 };
  }

  // 1. 브라우저/스마트폰 알림
  if (enableBrowserNotif && Notification.permission === 'granted') {
    const title = `FreshGuard 유통기한 임박 알림 (${urgentItems.length}건)`;
    const bodyText = urgentItems.slice(0, 3).map(i => `${i.name}: ${i.statusLabel}`).join('\n') + 
                     (urgentItems.length > 3 ? ` 외 ${urgentItems.length - 3}건` : '');
    
    triggerLocalNotification(title, bodyText);
  }

  // 2. 디스코드 Webhook
  if (discordWebhookUrl) {
    await sendDiscordNotification(discordWebhookUrl, '유통기한 체크 리포트', urgentItems);
  }

  // 3. 카카오톡 메시지
  if (kakaoAccessToken) {
    await sendKakaoTalkNotification(kakaoAccessToken, urgentItems);
  }

  await db.settings.put({ key: 'lastCheckedDate', value: todayStr });

  return { checked: true, alertCount: urgentItems.length, urgentItems };
}
