const { EventEmitter } = require('events')
const { handshake, query, ack } = require('./messages')
const DHT = require('@hyperswarm/dht')
const session = require('protocol-state-machine')
const Hyperswarm = require('hyperswarm')
const Hyperbee = require('hyperbee')
const c = require('compact-encoding')
const crypto = require('./crypto')

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
            return true
          }
        },
        {
          from: 'idle',
          to: 'waiting_ack',
          message: 'query',
          onMessage: async (message) => {
            const query_ = c.encode(query, message)
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

  async init () {
    this.socket = await this.node.connect(this.key)
    this.socket.on('data', async (data) => {
      await this.session.input(data)
      this.emit('data', data)
    })
    await this.store.ready()
  }

  // TODO: create formatQuery function that adds crypto and additional query information
  async send (address, data, pk, prev, signSk) {
    const timestamp = Buffer.from(Date.now().toString())
    const signature = crypto.sign(data, signSk)
    const prevSignature = Buffer.allocUnsafe(32)
    const payload = crypto.encrypt(data, pk)
    const query_ = c.encode(query, { timestamp, address, payload, signature, prevSignature })
    await this.session.input(query_)
  }

  async _initDB () {
    this.core = this.store.get({ key: this.handshake.core })
    await this.core.ready()
    this.swarm.join(this.core.discoveryKey)
    this.db = new Hyperbee(this.core, {
      keyEncoding: 'binary',
      valueEncoding: 'binary'
    })
    await this.db.ready()
  }
}
