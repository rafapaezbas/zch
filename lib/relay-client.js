const { EventEmitter } = require('events')
const { handshake, query, ack } = require('./messages')
const DHT = require('@hyperswarm/dht')
const session = require('protocol-state-machine')
const c = require('compact-encoding')

module.exports = class RelayClient extends EventEmitter {
  constructor (key, opts = {}) {
    super()
    this.node = new DHT()
    this.socket = null
    this.handshake = null
    this.key = key // relay public key

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
  }

  // TODO: create formatQuery function that adds crypto and additional query information
  async send (address, data, pk, signSk) {
    const timestamp = Buffer.from(Date.now().toString())
    /*
    const payload = crypto.encrypt(data, pk)
    const signature = crypto.sign(payload, signSk)
    const prev = Buffer.alloc(32) // get prev message and sign
    */
    const payload = Buffer.from(data)
    const signature = Buffer.allocUnsafe(32)
    const prev = Buffer.allocUnsafe(32)
    const query_ = c.encode(query, { timestamp, address, payload, signature, prev })
    await this.session.input(query_)
  }
}
