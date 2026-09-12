const DATABASE_NAME = "gacha-daily-checkin-assets";
const STORE_NAME = "backgrounds";

interface StoredBackgroundAsset {
  id: string;
  blob: Blob;
  name: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开背景资源库"));
  });
}

export async function saveBackgroundAsset(file: File): Promise<string> {
  const database = await openDatabase();
  const id = globalThis.crypto?.randomUUID?.() ?? `background-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ id, blob: file, name: file.name } satisfies StoredBackgroundAsset);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("保存背景文件失败"));
  });

  database.close();
  return id;
}

export async function loadBackgroundAsset(id: string): Promise<Blob | null> {
  const database = await openDatabase();
  const asset = await new Promise<StoredBackgroundAsset | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as StoredBackgroundAsset | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("读取背景文件失败"));
  });

  database.close();
  return asset?.blob ?? null;
}