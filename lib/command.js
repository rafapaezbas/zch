const gui = require('./gui')
const configuration = require('./config')
const contact = require('./contact')
const subcommand = require('subcommand')
const zch = require('../index')

const commands = [
  {
    name: 'add-contact',
    command: async (args) => {
      if (args.alias) {
        const config = await configuration.loadConfig()
        const masterkey = Buffer.from(config.masterkey, 'hex')
        const newContact = await contact.contact(masterkey, config.contacts.length)
        config.contacts.push({ alias: args.alias, invitation: args.invitation, active: true })
        await configuration.saveConfig(config)
        gui.addContact(args.alias, contact.invitation(newContact))
        if(args.invitation){
          const { rootAddress, pk, signPk, relay }  = invitationTransform(args.invitation)
          const relayClient = zch.newRelayClient(relay)
          await relayClient.init()
        }

      } else {
        gui.appendLogMessage('add-contact needs --alias parameter')
      }
    },
    options: [
      {
        name: 'alias',
        abbr: 'a'
      },
      {
        name: 'invitation',
        abbr: 'i'
      }
    ]
  }
]

module.exports = (command) => {
  const match = subcommand(commands)
  const matched = match(command)
  if (!matched) {
    gui.appendLogMessage('help')
  }
}
