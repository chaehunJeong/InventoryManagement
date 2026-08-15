// 샘플 바코드 데이터베이스 (유용한 한국 주요 상품 바코드 예시)
const LOCAL_BARCODE_DB = {
  '8801115114154': { name: '서울우유 1000ml', category: '유제품/냉장', defaultExpiryDays: 10 },
  '8801043014830': { name: '신라면 5개입', category: '가공식품', defaultExpiryDays: 180 },
  '8801056123456': { name: '유기농 두부 300g', category: '신선식품', defaultExpiryDays: 7 },
  '8801062627019': { name: '코카콜라 500ml', category: '음료/주류', defaultExpiryDays: 365 },
  '8801045260112': { name: '오뚜기 3분 카레', category: '가공식품', defaultExpiryDays: 365 },
  '8801062634086': { name: '삼다수 2L', category: '음료/주류', defaultExpiryDays: 730 },
  '8801117141011': { name: '매일유업 오리지널 우유', category: '유제품/냉장', defaultExpiryDays: 10 }
};

/**
 * 바코드 번호로 품목 정보 자동 조회 (로컬 DB + Open Food Facts API)
 * @param {string} barcode 
 */
export async function lookupBarcodeInfo(barcode) {
  const cleanBarcode = barcode.trim();

  // 1. 로컬 매핑 데이터 확인
  if (LOCAL_BARCODE_DB[cleanBarcode]) {
    return {
      found: true,
      source: 'local',
      ...LOCAL_BARCODE_DB[cleanBarcode]
    };
  }

  // 2. Open Food Facts 글로벌 오픈 API 조회 (무료)
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const prod = data.product;
        return {
          found: true,
          source: 'openfoodfacts',
          name: prod.product_name_ko || prod.product_name || `바코드 상품 (${cleanBarcode})`,
          category: prod.categories_tags?.[0]?.replace('en:', '') || '기타 식품',
          defaultExpiryDays: 30
        };
      }
    }
  } catch (err) {
    console.warn('Open Food Facts API 조회 실패 또는 오프라인:', err);
  }

  // 못 찾은 경우 기본 템플릿 반환
  return {
    found: false,
    name: '',
    category: '기타 식품',
    defaultExpiryDays: 7
  };
}
