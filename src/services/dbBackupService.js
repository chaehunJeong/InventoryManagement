import { db } from '../db';

/**
 * 현재 IndexedDB의 모든 재고 및 설정 데이터를 JSON 파일로 백업 다운로드
 */
export async function exportDatabaseToJson() {
  const items = await db.items.toArray();
  const settings = await db.settings.toArray();

  const backupData = {
    version: 1,
    exportDate: new Date().toISOString(),
    appName: 'FreshGuard',
    items,
    settings
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `FreshGuard_Inventory_Backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 사용자가 선택한 JSON 백업 파일로 DB 복원 (가져오기)
 * @param {File} file 
 * @param {boolean} clearExisting 
 */
export async function importDatabaseFromJson(file, clearExisting = false) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const backupData = JSON.parse(content);

        if (!backupData || !Array.isArray(backupData.items)) {
          throw new Error('올바르지 않은 FreshGuard 백업 파일 형식입니다.');
        }

        if (clearExisting) {
          await db.items.clear();
        }

        // 기존 ID 중복 방지를 위해 id 제거 후 bulkAdd 또는 기존 ID 보존
        const itemsToImport = backupData.items.map(item => {
          const { id, ...rest } = item;
          return rest;
        });

        await db.items.bulkAdd(itemsToImport);

        if (Array.isArray(backupData.settings) && backupData.settings.length > 0) {
          await db.settings.bulkPut(backupData.settings);
        }

        resolve({ success: true, count: itemsToImport.length });
      } catch (err) {
        console.error('DB 복원 처리 실패:', err);
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
}
