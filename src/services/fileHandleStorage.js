const templateDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('clarity-reporting', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('files')
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const saveStoredHandle = async (key, handle) => {
  try {
    const db = await templateDb()
    const transaction = db.transaction('files', 'readwrite')
    transaction.objectStore('files').put(handle, key)
    await new Promise((resolve) => { transaction.oncomplete = resolve })
  } catch {}
}

const clearStoredHandle = async (key) => {
  try {
    const db = await templateDb()
    const transaction = db.transaction('files', 'readwrite')
    transaction.objectStore('files').delete(key)
  } catch {}
}

const loadStoredHandle = async (key) => {
  try {
    const db = await templateDb()
    return await new Promise((resolve, reject) => {
      const request = db.transaction('files').objectStore('files').get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export const saveTemplateHandle = (handle) => saveStoredHandle('inventory-template', handle)
export const clearTemplateHandle = () => clearStoredHandle('inventory-template')
export const loadTemplateHandle = () => loadStoredHandle('inventory-template')
export const saveNegativeTemplateHandle = (handle) => saveStoredHandle('negative-template', handle)
export const loadNegativeTemplateHandle = () => loadStoredHandle('negative-template')
export const saveSupplierListHandle = (handle) => saveStoredHandle('supplier-list', handle)
export const loadSupplierListHandle = () => loadStoredHandle('supplier-list')
