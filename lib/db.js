const levelup = require('levelup')
const leveldown = require('leveldown')

module.exports = (storage) => {
  return levelup(leveldown(storage), {
    keyEncoding: 'utf-8',
    valueEncoding: 'json'
  })
}
