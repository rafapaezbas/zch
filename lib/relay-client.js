const { EventEmitter } = require('events')
const { handshake, query, ack } = require('./messages')
const DHT = require('@hyperswarm/dht')
const session = require('protocol-state-machine')

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
          onMessage: (message) => {
            this.handshake = message
            return true
          }
        },
        {
          from: 'idle',
          to: 'waiting_ack',
          message: 'query',
          onMessage: (message) => {
            this.socket.write(message)
            return true
          }
        },
        {
          from: 'waiting_ack',
          to: 'idle',
          message: 'ack',
          onMessage: (message) => {
            console.log('ACK!', message)
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
}
