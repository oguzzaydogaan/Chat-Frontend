// db.js
import { openDB } from 'idb'

const dbPromise = openDB('chat-db', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('notSends')) {
      db.createObjectStore('notSends', { keyPath: 'LocalId' })
    }
    if (!db.objectStoreNames.contains('unsavedMessages')) {
      db.createObjectStore('unsavedMessages', { keyPath: 'LocalId' })
    }
  },
})

const db = {
  // Mesaj ekle veya güncelle
  async saveNotSend(socketMessage) {
    const dbConn = await dbPromise
    const record = {
      ...socketMessage,
      LocalId: socketMessage.Payload.Message.LocalId,
    }
    await dbConn.put('notSends', record)
  },

  // Tüm mesajları al
  async getAllNotSends() {
    const dbConn = await dbPromise
    return await dbConn.getAll('notSends')
  },

  async getNotSend(localId) {
    const dbConn = await dbPromise
    const record = await dbConn.get('notSends', localId)
    if (record) {
      delete record.LocalId
    }
    return record
  },

  // Mesaj sil
  async deleteNotSend(id) {
    const dbConn = await dbPromise
    await dbConn.delete('notSends', id)
  },

  // Tümünü sil
  async clearNotSends() {
    const dbConn = await dbPromise
    await dbConn.clear('notSends')
  },

  // Unsaved mesaj ekle veya güncelle
  async saveUnsaved(message) {
    const dbConn = await dbPromise
    await dbConn.put('unsavedMessages', message)
  },

  // Tüm unsaved mesajları al
  async getAllUnsaved() {
    const dbConn = await dbPromise
    return await dbConn.getAll('unsavedMessages')
  },

  // Unsaved mesaj sil
  async deleteUnsaved(id) {
    const dbConn = await dbPromise
    await dbConn.delete('unsavedMessages', id)
  },

  // Tüm unsaved mesajları sil
  async clearUnsaved() {
    const dbConn = await dbPromise
    await dbConn.clear('unsavedMessages')
  },

  // Unsaved mesajı al
  async getUnsaved(localId) {
    const dbConn = await dbPromise
    const record = await dbConn.get('unsavedMessages', localId)
    return record
  },

  async clearAll() {
    const dbConn = await dbPromise
    await dbConn.clear()
  },
}

export default db
