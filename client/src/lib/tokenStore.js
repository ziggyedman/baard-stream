const DB_NAME = 'baard'
const STORE   = 'tokens'
const VERSION = 1

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE)
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

export async function getToken(platform) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(platform)
    req.onsuccess = e => resolve(e.target.result ?? null)
    req.onerror   = e => reject(e.target.error)
  })
}

export async function setToken(platform, token) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(token, platform)
    req.onsuccess = () => resolve()
    req.onerror   = e => reject(e.target.error)
  })
}

export async function deleteToken(platform) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(platform)
    req.onsuccess = () => resolve()
    req.onerror   = e => reject(e.target.error)
  })
}
