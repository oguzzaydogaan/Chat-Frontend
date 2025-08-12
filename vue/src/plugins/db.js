// db.js
import { openDB } from 'idb'

const dbPromise = openDB('chat-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('notSends')) {
      db.createObjectStore('notSends', { keyPath: 'LocalId' })
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
}

export default db
