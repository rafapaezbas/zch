const levelup = require('levelup')
const leveldown = require('leveldown')
const { getConfig } = require('./config')

let db = null

const loadDB = async () => {
  if (!db) {
    const storage = (await getConfig()).dbStorage
    db = levelup(leveldown(storage), {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    })
  }
  return db
}

module.exports = {
  loadDB
}
