const gui = require('./gui')
const configuration = require('./config')
const contact = require('./contact')
const subcommand = require('subcommand')

const commands = [
  {
    name: 'add-contact',
    command: async (args) => {
      if (args.alias) {
        const config = await configuration.loadConfig()
        const masterkey = Buffer.from(config.masterkey, 'hex')
        const newContact = contact.contact(masterkey, config.contacts.length)
        config.contacts.push({ alias: args.alias, active: true })
        await configuration.saveConfig(config)
        gui.addContact(args.alias, newContact)
      } else {
        gui.appendLogMessage('add-contact needs --alias parameter')
      }
    },
    options: [
      {
        name: 'alias',
        abbr: 'a'
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
