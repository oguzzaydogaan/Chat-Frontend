// db.js
import { deleteDB, openDB } from 'idb'

const dbPromise = openDB('chat-db', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('notSends', { keyPath: 'LocalId' })
    }
    if (oldVersion < 2) {
      db.createObjectStore('unsavedMessages', { keyPath: 'LocalId' })
    }
  },
})

dbPromise.then((db) => {
  db.addEventListener('versionchange', () => {
    db.close()
  })
})

const db = {
  async saveNotSend(socketMessage) {
    const dbConn = await dbPromise
    const record = {
      ...socketMessage,
      LocalId: socketMessage.Payload.Message.LocalId,
    }
    await dbConn.put('notSends', record)
  },

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

  async deleteNotSend(id) {
    const dbConn = await dbPromise
    await dbConn.delete('notSends', id)
  },

  async clearNotSends() {
    const dbConn = await dbPromise
    await dbConn.clear('notSends')
  },

  async saveUnsaved(message) {
    const dbConn = await dbPromise
    await dbConn.put('unsavedMessages', message)
  },

  async getAllUnsaved() {
    const dbConn = await dbPromise
    return await dbConn.getAll('unsavedMessages')
  },

  async deleteUnsaved(id) {
    const dbConn = await dbPromise
    await dbConn.delete('unsavedMessages', id)
  },

  async clearUnsaved() {
    const dbConn = await dbPromise
    await dbConn.clear('unsavedMessages')
  },

  async getUnsaved(localId) {
    const dbConn = await dbPromise
    const record = await dbConn.get('unsavedMessages', localId)
    return record
  },

  async clearAll() {
    await clearNotSends()
    await clearUnsaved()
  },

  async resetDb() {
    const db = await dbPromise
    db.close()
    await deleteDB('chat-db')
  },
}

export default db
