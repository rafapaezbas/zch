const gui = require('./lib/gui')
const command = require('./lib/command')
const configuration = require('./lib/config')
const RelayClient = require('./lib/relay-client')

const start = async () => {
  (await configuration.loadConfig()).contacts.filter(c => c.active).forEach(c => {
    gui.addContact(c.alias)
  })

  // TODO generate relayClient from contacts list
  const key = Buffer.from('314fe5479f48fb1da8900f33da72b74d7a9eb6611669039e31d93864b7b5a9ea', 'hex')
  const client = new RelayClient(key)
  await client.init()

  gui.textarea.on('submit', async (data) => {
    const isCommand = data[0] === '\\'
    if (isCommand) {
      command(data.substring(1).split(' '))
    } else {
      await client.send(data)
    }
  })
}

start()

module.exports = {
  start
}
