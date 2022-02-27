const { EventEmitter, once } = require('events')
const { handshake, query, ack } = require('./messages')
const DHT = require('@hyperswarm/dht')
const session = require('protocol-state-machine')
const Hyperswarm = require('hyperswarm')
const Hyperbee = require('hyperbee')
const c = require('compact-encoding')
const crypto = require('./crypto')
const { subaddress } = require('./contact')

module.exports = class RelayClient extends EventEmitter {
  constructor (key, store, opts = {}) {
    super()
    this.node = new DHT()
    this.socket = null
    this.handshake = null
    this.key = key // relay public key
    this.db = null
    this.store = store
    this.swarm = new Hyperswarm()
    this.started = false

    this.swarm.on('connection', connection => {
      this.store.replicate(connection)
    })

    this.protocolDefinition = {
      states: [
        { name: 'initial_state' },
        { name: 'idle' },
        { name: 'waiting_ack' }
      ],
      messages: [
        { name: 'handshake', type: handshake },
        { name: 'query', type: query },
        { name: 'ack', type: ack }
      ],
      transitions: [
        {
          from: 'initial_state',
          to: 'idle',
          message: 'handshake',
          onMessage: async (message) => {
            this.handshake = message
            await this._initDB()
            this.emit('handshake', this.handshake)
            return true
          }
        },
        {
          from: 'idle',
          to: 'waiting_ack',
          message: 'query',
          onMessage: async (message) => {
            console.log('sending message...')
            const query_ = c.encode(query, message)
            console.log(query_)
            this.socket.write(query_)
            return true
          }
        },
        {
          from: 'waiting_ack',
          to: 'idle',
          message: 'ack',
          onMessage: async (message) => {
            return true
          }
        }
      ],
      logLength: 100
    }

    this.session = session(this.protocolDefinition)
  }

  async ready () {
    if (this.handshake) return
    await once(this, 'handshake') // TODO control timeout
  }

  async init () {
    if (this.started) return
    this.socket = await this.node.connect(this.key)
    this.socket.on('data', async (data) => {
      await this.session.input(data)
      this.emit('data', data)
    })
    await this.store.ready()
    this.started = true
  }

  async send ({ timestamp, address, payload, pk, prev, signSk }, opts = {}) {
    const signature = opts.invitation ? undefined : crypto.sign(payload, signSk)
    const prevSignature = Buffer.allocUnsafe(32) // TODO
    const encryptedPayload = crypto.encrypt(payload, pk)
    const query_ = c.encode(query, { timestamp, address, payload: encryptedPayload, signature, prevSignature })
    await this.session.input(query_)
  }

  async _initDB () {
    this.core = this.store.get({ key: this.handshake.core })
    await this.core.ready()
    this.swarm.join(this.core.discoveryKey)
    await this.swarm.flush()
    this.db = new Hyperbee(this.core, {
      keyEncoding: 'binary',
      valueEncoding: 'binary'
    })
    await this.db.ready()
  }

  watch (rootAddress, startIndex, alias, interval = 1000) {
    let index = startIndex
    let address = subaddress(rootAddress, index)
    return new Promise((resolve) => {
      setInterval(async () => {
        const result = await this.db.get(address)
        if (result) {
          result.alias = alias
          this.emit('message', result)
          address = subaddress(rootAddress, ++index)
        }
      }, interval)
    })
  }
}
