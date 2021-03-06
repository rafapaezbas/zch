const { EventEmitter } = require('events')
const { handshake, ack, query, error } = require('./messages')
const DHT = require('@hyperswarm/dht')
const Corestore = require('corestore')
const Hyperbee = require('hyperbee')
const Hyperswarm = require('hyperswarm')
const c = require('compact-encoding')
const { sign, signKeyPair } = require('./crypto')

module.exports = class Relay extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.store = new Corestore(opts.storage)
    this.keyPair = opts.keyPair || DHT.keyPair(opts.keyPairSeed)
    this.node = new DHT(opts)

    this.swarm = new Hyperswarm()
    this.swarm.on('connection', connection => {
      this.store.replicate(connection)
    })
    this.server = null
    this.core = null
    this.db = null
    this.signatureKeys = signKeyPair()
  }

  async init () {
    await this._initDHT()
    await this._initStore()
    this.emit('open', this.keyPair.publicKey)
  }

  async _initDHT () {
    this.server = this.node.createServer((socket) => {
      const handshake_ = c.encode(handshake, { pk: this.signatureKeys.pk, core: this.core.key })
      socket.write(handshake_)
      socket.on('data', async (data) => {
        console.log('received!', data)
        let response
        const query_ = this._isQuery(data)
        const entry = query_ ? await this.db.get(query_.address) : null
        if (query_ && !entry) { // dont overwrite an address already used
          await this.db.put(query_.address, data) // TODO remove address from data
          response = this._ack(data)
        } else {
          response = this._error()
        }
        socket.write(response)
        this.emit('data', data)
      })
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
    await this.swarm.flush()
  }

  _isQuery (message) {
    try {
      return c.decode(query, message)
    } catch (err) {

    }
  }

  _ack (data) {
    const signature = sign(data, this.signatureKeys.sk)
    return c.encode(ack, { timestamp: Buffer.from(Date.now().toString()), signature: signature })
  }

  _error () {
    return c.encode(error, { timestamp: Buffer.from(Date.now().toString()), message: Buffer.from('error') })
  }
}
