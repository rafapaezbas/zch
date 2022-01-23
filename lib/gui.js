const blessed = require('neo-blessed')

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
  items: ['a', 'b', 'c'],
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

screen.key('escape', function (ch, key) {
  return process.exit(0)
})

screen.key('up', function (ch, key) {
  return contacts.up(1)
})

screen.key('down', function (ch, key) {
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

const appendLogMessage = (msg) => {
  logs.log(msg)
}

const addContact = (alias, contact) => {
  contacts.addItem(alias)
  if (contact) { // also used in gui setup without contact info
    appendLogMessage('New contact created!')
    appendLogMessage([contact.address.toString('hex'), contact.pk.toString('hex')].join(''))
  }
  screen.render()
}

const removeContact = (alias) => {
  contacts.removeItem(alias)
}

module.exports = {
  appendChatMessage,
  textarea,
  appendLogMessage,
  addContact,
  removeContact
}
