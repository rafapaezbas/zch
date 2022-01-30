const test = require('brittle')
const Relay = require('../lib/relay')
const RelayClient = require('../lib/relay-client')
const { types, messageTypeOffset } = require('../lib/messages')

test('relay answers with handshake to connection', async ({ is, plan, teardown }) => {
  plan(4)

  const relay = new Relay()
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
