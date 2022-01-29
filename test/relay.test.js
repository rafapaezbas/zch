const test = require('brittle')
const Relay = require('../lib/relay')
const DHT = require('@hyperswarm/dht')
const c = require('compact-encoding')
const { handshake } = require('../lib/messages')

test('relay answers with handshake to connection', async ({ is, not, pass, plan, teardown }) => {
  plan(2)

  const relay = new Relay()
  await relay.init()
  not(relay.keyPair, undefined)

  const clientNode = new DHT()
  const clientSocket = await clientNode.connect(relay.keyPair.publicKey)

  clientSocket.on('data', (data) => {
    const message = c.decode(handshake, data)
    console.log(message)
    pass()
  })

  teardown(async () => {
    await relay.server.close()
    await relay.node.destroy()
    await relay.swarm.destroy()
    await clientNode.destroy()
  })
})
