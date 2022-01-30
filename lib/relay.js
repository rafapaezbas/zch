const { EventEmitter } = require('events')
const { handshake } = require('./messages')
const DHT = require('@hyperswarm/dht')
const Corestore = require('corestore')
const Hyperbee = require('hyperbee')
const Hyperswarm = require('hyperswarm')
const configuration = require('./config')
const c = require('compact-encoding')
const { keyPair } = require('./crypto')

module.exports = class Relay extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.store = new Corestore(configuration.relayConfigFolder)
    this.keyPair = opts.keyPair || DHT.keyPair(opts.keyPairSeed)
    this.node = new DHT(opts)

    this.swarm = new Hyperswarm()
    this.swarm.on('connection', connection => {
      this.store.replicate(connection)
    })
    this.server = null
    this.core = null
    this.db = null
    this.signatureKeys = keyPair()
  }

  async init () {
    await this._initDHT()
    await this._initStore()
    this.emit('open', this.keyPair.publicKey)
  }

  async _initDHT () {
    this.server = this.node.createServer((connection) => {
      const onConectionHandshake = c.encode(handshake, { pk: this.signatureKeys.pk, core: this.core.key })
      connection.write(onConectionHandshake)
    })
    await this.server.listen(this.keyPair)
  }

  async _initStore () {
    await this.store.ready()
    this.core = this.store.get({ name: 'zch-db-core' })
    await this.core.ready()
    this.db = new Hyperbee(this.core, {
      keyEncoding: 'binary',
      valueEncoding: 'binary'
    })
    await this.db.ready()
    await this.swarm.join(this.core.discoveryKey)
  }
}
