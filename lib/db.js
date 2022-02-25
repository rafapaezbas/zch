var levelup = require('levelup')
var leveldown = require('leveldown')

module.exports = (storage) => {
    return levelup(leveldown(storage), {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
    })
}
