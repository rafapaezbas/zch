const { once } = require('events')
const test = require('brittle')
const Relay = require('../lib/relay')
const RelayClient = require('../lib/relay-client')
const { types, messageTypeOffset, query, ack } = require('../lib/messages')
const c = require('compact-encoding')
const ram = require('random-access-memory')

test('relay answers with handshake to connection', async ({ is, plan, teardown }) => {
  plan(4)

  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey)

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()

  relayClient.on('data', data => {
    is(data[messageTypeOffset], types.HANDSHAKE)
    is(relayClient.handshake.pk.toString(), relay.signatureKeys.pk.toString())
    is(relayClient.handshake.core.toString(), relay.core.key.toString())
    is(relayClient.session.state.name, 'idle')
  })
})

test('relay client can send message', async ({ is, not, plan, ok, teardown }) => {
  plan(7)

  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey)
  const message = Buffer.allocUnsafe(32).toString()
  const address = Buffer.allocUnsafe(32).toString()

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()
  await once(relayClient, 'data') // handshake
  await relayClient.send(address, message)

  relay.on('data', data => {
    const data_ = c.decode(query, data)
    is(data[messageTypeOffset], types.QUERY)
    is(data_.payload.toString(), message)
    not(data_.signature, undefined)
    not(data_.prev, undefined)
    not(data_.timestamp, undefined)
    ok(parseInt(data_.timestamp) > 0)
    is(relayClient.session.state.name, 'waiting_ack')
  })
})

test('relay returns ack for well-formed message', async ({ is, not, plan, ok, teardown }) => {
  plan(3)

  const relay = new Relay({ storage: ram })
  const relayClient = new RelayClient(relay.keyPair.publicKey)
  const message = Buffer.allocUnsafe(32).toString()
  const address = Buffer.allocUnsafe(32).toString()

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relayClient.socket.destroy()
    await relayClient.node.destroy()
    await relay.swarm.destroy()
  })

  await relay.init()
  await relayClient.init()
  await once(relayClient, 'data') // handshake
  await relayClient.send(address, message)
  is(relayClient.session.state.name, 'waiting_ack')
  await once(relay, 'data') // message received by relay
  relayClient.on('data', data => {
    const ack_ = c.decode(ack, data)
    not(ack_.signature, undefined)
    is(relayClient.session.state.name, 'idle')
  })
})
