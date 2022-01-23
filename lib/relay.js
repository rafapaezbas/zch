const { EventEmitter } = require('events')
const DHT = require('@hyperswarm/dht')
const Corestore = require('corestore')
const Hyperbee = require('hyperbee')
const Hyperswarm = require('hyperswarm')
const configuration = require('./config')

module.exports = class Relay extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.store = new Corestore(configuration.relayConfigFolder)
    this.keyPair = opts.keyPair || DHT.keyPair(opts.keyPairSeed)
    this.node = new DHT(opts)
    this.server = this.node.createServer()
    this.server.listen(this.keyPair)
    this.server.on('connection', (socket) => {
      socket.on('data', async (data) => {
        socket.write(this.core.key)
        this.emit('data', data)
      })
    })

    this.swarm = new Hyperswarm()
    this.swarm.on('connection', connection => {
      this.store.replicate(connection)
    })
    this.core = null
    this.db = null
  }

  async init () {
    await this.store.ready()
    this.core = this.store.get({ name: 'zch-db-core' })
    await this.core.ready()
    this.db = new Hyperbee(this.core, {
      keyEncoding: 'binary',
      valueEncoding: 'binary'
    })
    await this.db.ready()
    this.swarm.join(this.core.discoveryKey)
    this.emit('open', this.keyPair.publicKey)
  }
}
