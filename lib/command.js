const gui = require('./gui')
// const config = require('./config')
const contact = require('./contact')
const subcommand = require('subcommand')
const crypto = require('./crypto')

const commands = [
  {
    name: 'create-contact',
    command: (args) => {
      if (args.alias) {
        const masterkey = crypto.generateMasterkey() // TODO retrieve master key from config
        const newContact = contact.contact(masterkey, 0) // TODO count existing contacts
        gui.addContact(args.alias)
        gui.appendLogMessage('New contact created!')
        gui.appendLogMessage([newContact.address.toString('hex'), newContact.pk.toString('hex')].join(''))
      } else {
        gui.appendLogMessage('create-contact needs --alias parameter')
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
