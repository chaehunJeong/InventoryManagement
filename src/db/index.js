import Dexie from 'dexie';

export const db = new Dexie('FreshGuardDB');

db.version(1).stores({
  items: '++id, name, barcode, expiryDate, category, createdAt',
  settings: 'key, value'
});

// 초기 설정 로드 함수 (가짜 샘플 데이터 제거됨)
export async function initDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.bulkPut([
      { key: 'warningDays', value: 3 },
      { key: 'enableBrowserNotif', value: true },
      { key: 'discordWebhookUrl', value: '' },
      { key: 'lastCheckedDate', value: '' }
    ]);
  }
}

// 전체 재고 데이터 비우기
export async function clearAllItems() {
  await db.items.clear();
}
