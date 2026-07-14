import api from "../api/01_axiosInstance";

const CACHE_DB_NAME = "TareasCacheDB";
const CACHE_STORE_NAME = "get_requests";
const SYNC_DB_NAME = "TareasSyncDB";
const SYNC_STORE_NAME = "failed_requests";

// --- BASE DE DATOS PARA CACHE ---
const openCacheDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: "url" });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
};

// --- BASE DE DATOS PARA COLA SYNC ---
const openSyncDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { autoIncrement: true });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e: any) => reject(e.target.error);
  });
};

// --- SERIALIZACIÓN DE DATOS ---
const serializeData = (data: any) => {
  if (data instanceof FormData) {
    const serialized: { _isFormData: boolean; fields: Array<{ key: string; value: any }> } = {
      _isFormData: true,
      fields: [],
    };
    for (const [key, value] of data.entries()) {
      serialized.fields.push({ key, value });
    }
    return serialized;
  }
  return data;
};

const deserializeData = (data: any) => {
  if (data && data._isFormData) {
    const fd = new FormData();
    for (const { key, value } of data.fields) {
      fd.append(key, value);
    }
    return fd;
  }
  return data;
};

// --- FUNCIONES DE CACHE ---
export const writeToCache = async (urlKey: string, data: any) => {
  try {
    const db = await openCacheDB();
    const tx = db.transaction(CACHE_STORE_NAME, "readwrite");
    tx.objectStore(CACHE_STORE_NAME).put({
      url: urlKey,
      data: data,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn("[Cache] Error al guardar en cache:", err);
  }
};

export const readFromCache = async (urlKey: string): Promise<any> => {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, "readonly");
      const store = tx.objectStore(CACHE_STORE_NAME);
      const request = store.get(urlKey);
      request.onsuccess = () => resolve(request.result?.data ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

// --- FUNCIONES DE COLA SYNC ---
export const saveToOfflineQueue = async (requestConfig: any) => {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_STORE_NAME, "readwrite");
    tx.objectStore(SYNC_STORE_NAME).add({
      url: requestConfig.url,
      method: requestConfig.method,
      data: serializeData(requestConfig.data),
      headers: requestConfig.headers,
      timestamp: Date.now(),
    });
    console.log("💾 Mutación encolada localmente para posterior sincronización offline.");
  } catch (error) {
    console.error("[Sync] Error al guardar en cola offline:", error);
  }
};

const deleteFromOfflineQueue = async (key: any) => {
  const db = await openSyncDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, "readwrite");
    tx.objectStore(SYNC_STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e: any) => reject(e.target.error);
  });
};

export const processOfflineQueue = async () => {
  try {
    const db = await openSyncDB();
    
    const requests: Array<{ key: any; value: any }> = await new Promise((resolve) => {
      const tx = db.transaction(SYNC_STORE_NAME, "readonly");
      const store = tx.objectStore(SYNC_STORE_NAME);
      const request = store.openCursor();
      const result: Array<{ key: any; value: any }> = [];
      
      request.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          result.push({ key: cursor.key, value: cursor.value });
          cursor.continue();
        } else {
          resolve(result);
        }
      };
    });

    if (requests.length === 0) return;

    console.log(`🔄 Sincronizando ${requests.length} peticiones encoladas offline...`);
    let syncSuccessful = false;

    for (const req of requests) {
      try {
        let headers = { ...req.value.headers };
        let finalData = req.value.data;

        // --- CORRECCIÓN DE TIEMPO CLIENTE (Original Timestamp) ---
        const originalTimeISO = new Date(req.value.timestamp).toISOString();

        if (finalData && finalData._isFormData) {
          // Deserializamos FormData y añadimos la fecha si corresponde
          const fields = [...finalData.fields];
          if (req.value.url.includes("/entregar")) {
            // Buscamos si ya tiene fechaEntrega, si no, la añadimos
            if (!fields.some((f: any) => f.key === "fechaEntrega")) {
              fields.push({ key: "fechaEntrega", value: originalTimeISO });
            }
          }
          finalData = deserializeData({ _isFormData: true, fields });
          
          // Axios generará un nuevo Content-Type con el boundary correcto
          delete headers["Content-Type"];
          delete headers["content-type"];
        } else {
          // Si es JSON
          let body = finalData;
          if (typeof body === "string") {
            try { body = JSON.parse(body); } catch {}
          }
          body = body || {};

          if (req.value.url.includes("/revision")) {
            body.fechaRevision = originalTimeISO;
            body.fechaConclusion = originalTimeISO;
          } else if (req.value.url.includes("/complete")) {
            body.fechaConclusion = originalTimeISO;
          }

          finalData = body;
        }

        await api({
          url: req.value.url,
          method: req.value.method,
          data: finalData,
          headers: headers,
          _isRetry: true // Evita encolar de nuevo si falla por red
        } as any);

        await deleteFromOfflineQueue(req.key);
        syncSuccessful = true;
      } catch (err: any) {
        console.error("❌ Falló al sincronizar petición encolada:", err);
        // Si el servidor respondió con error HTTP (ej. 400, 403, 404), es un error definitivo (no de red)
        if (err.response) {
          console.warn("⚠️ Error de validación permanente. Eliminando petición corrupta de la cola.");
          await deleteFromOfflineQueue(req.key);
        } else {
          // Error de conexión persistente: detenemos el procesamiento para intentar más tarde
          console.warn("📡 Sin conexión al servidor. Posponiendo resto de la cola.");
          break;
        }
      }
    }

    if (syncSuccessful) {
      window.dispatchEvent(new CustomEvent("tareas-sync-complete"));
    }
  } catch (error) {
    console.error("Error durante la sincronización offline:", error);
  }
};
