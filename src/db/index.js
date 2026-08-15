import Dexie from 'dexie';

export const db = new Dexie('FreshGuardDB');

db.version(1).stores({
  items: '++id, name, barcode, expiryDate, category, createdAt',
  settings: 'key, value'
});

// 초기 설정 및 샘플 데이터 로드 함수
export async function initDatabase() {
  const itemCount = await db.items.count();
  if (itemCount === 0) {
    const today = new Date();
    
    // N일 후 YYYY-MM-DD 스트링 생성
    const getFutureDate = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    await db.items.bulkAdd([
      {
        name: '서울우유 1000ml',
        barcode: '8801115114154',
        category: '유제품/냉장',
        quantity: 2,
        expiryDate: getFutureDate(2), // 2일 후 (임박!)
        memo: '냉장고 둘째 칸',
        createdAt: new Date().toISOString()
      },
      {
        name: '신라면 5개입',
        barcode: '8801043014830',
        category: '가공식품',
        quantity: 1,
        expiryDate: getFutureDate(30), // 30일 후 (안전)
        memo: '팬트리 A구역',
        createdAt: new Date().toISOString()
      },
      {
        name: '유기농 두부 300g',
        barcode: '8801056123456',
        category: '신선식품',
        quantity: 1,
        expiryDate: getFutureDate(0), // 오늘 (당일 임박)
        memo: '된장찌개용',
        createdAt: new Date().toISOString()
      },
      {
        name: '맛있는 슬라이스 치즈',
        barcode: '8801234567890',
        category: '유제품/냉장',
        quantity: 3,
        expiryDate: getFutureDate(-1), // 만료됨!
        memo: '버리기 전 확인 필요',
        createdAt: new Date().toISOString()
      }
    ]);

    // 기본 설정
    await db.settings.bulkPut([
      { key: 'warningDays', value: 3 }, // 3일 이하 임박 시 경고
      { key: 'enableBrowserNotif', value: true },
      { key: 'discordWebhookUrl', value: '' },
      { key: 'lastCheckedDate', value: '' }
    ]);
  }
}
