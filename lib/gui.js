const blessed = require('neo-blessed')
const EventEmitter = require('events')

const guiEmitter = new EventEmitter()

const screen = blessed.screen({
  smartCSR: true
})

screen.title = 'zch'

const chat = blessed.log({
  top: '0',
  left: '0',
  width: '50%',
  height: '50%',
  padding: 1,
  alwaysScroll: true,
  scrollable: true,
  keys: true,
  tags: true,
  border: {
    type: 'line'
  },
  scrollbar: {
    style: {
      bg: 'white'
    }
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'white'
    }
  }
})

const logs = blessed.log({
  top: '50%',
  left: '50%',
  width: '50%',
  height: '50%',
  padding: 1,
  tags: true,
  alwaysScroll: true,
  scrollable: true,
  keys: true,
  border: {
    type: 'line'
  },
  scrollbar: {
    style: {
      bg: 'white'
    }
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'white'
    }
  }
})

const textarea = blessed.textarea({
  top: '50%',
  left: '0%',
  width: '50%',
  height: '50%',
  padding: 1,
  tags: true,
  keys: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'white'
    }
  }
})

const contacts = blessed.list({
  top: '0',
  left: '50%',
  width: '50%',
  height: '50%',
  padding: 1,
  items: [],
  keys: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: 'white'
    },
    selected: {
      fg: 'black',
      bg: 'white'
    }
  }
})

contacts.selectedItem = 0 // init selected

screen.key('escape', function (ch, key) {
  return process.exit(0)
})

screen.key('up', function (ch, key) {
  if (contacts.selectedItem !== 0) contacts.selectedItem--
  guiEmitter.emit('contact-gui-update', contacts.selectedItem)
  return contacts.up(1)
})

screen.key('down', function (ch, key) {
  if (contacts.selectedItem !== contacts.items.length - 1) contacts.selectedItem++
  guiEmitter.emit('contact-gui-update', contacts.selectedItem)
  return contacts.down(1)
})

textarea.key('enter', () => {
  if (textarea.getValue().length > 0 && textarea.getValue() !== '\n') {
    textarea.emit('submit', textarea.getValue().slice(0, -1)) // remove \n last char
  }
  textarea.clearValue()
})

screen.append(chat)
screen.append(textarea)
screen.append(contacts)
screen.append(logs)
textarea.focus()
contacts.select(0)

const appendChatMessage = (timestamp, user, msg) => {
  chat.log(timestamp + ' - {bold}' + user + '{/bold} - ' + msg)
}

const resetChat = () => {
  chat.setContent('')
}

const appendLogMessage = (msg) => {
  logs.log(msg)
}

const addContact = (alias, invitation) => {
  contacts.addItem(alias)
  if (invitation) { // also used in gui setup without contact info
    appendLogMessage('New contact created!')
    appendLogMessage(invitation)
  }
  screen.render()
}

const removeContact = (alias) => {
  contacts.removeItem(alias)
}

const getSelectedContactIndex = () => {
  return contacts.selectedItem
}

const renderChat = (alias, outbox, inbox) => { // localMessages === sent messages, remote Messages === received messages
  resetChat()
  inbox.map(m => ({ ...m, alias: alias })).concat(outbox.map(m => ({ ...m, alias: 'user' })))
    .sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1).forEach(m => {
      appendChatMessage(new Date(parseInt(m.timestamp.toString())).toISOString(), m.alias, m.payload)
    })
}

const logo = () => {
  chat.log('')
  chat.log('███████╗ ██████╗██╗  ██╗')
  chat.log('╚══███╔╝██╔════╝██║  ██║')
  chat.log('  ███╔╝ ██║     ███████║')
  chat.log(' ███╔╝  ██║     ██╔══██║')
  chat.log('███████╗╚██████╗██║  ██║')
  chat.log('╚══════╝ ╚═════╝╚═╝  ╚═╝')
  chat.log('')
  appendChatMessage(new Date().toISOString(), 'zch', 'Welcome to zch!')
}

module.exports = {
  appendChatMessage,
  textarea,
  appendLogMessage,
  addContact,
  removeContact,
  getSelectedContactIndex,
  renderChat,
  guiEmitter,
  logo
}
