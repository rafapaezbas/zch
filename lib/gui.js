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
  return contacts.up(1)
})

screen.key('down', function (ch, key) {
  if (contacts.selectedItem !== contacts.items.length - 1) contacts.selectedItem++
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

// TODO remove lorem ipsum
appendChatMessage(new Date().toISOString(), 'userA', 'In id erat non orci commodo lobortis.  ')
appendChatMessage(new Date().toISOString(), 'userB', 'Donec vitae dolor.  ')
appendChatMessage(new Date().toISOString(), 'userA', 'Etiam laoreet quam sed arcu.  ')
appendChatMessage(new Date().toISOString(), 'userB', 'Proin quam nisl, tincidunt et, mattis eget, convallis nec, purus.  ')
appendChatMessage(new Date().toISOString(), 'userA', 'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.  ')

module.exports = {
  appendChatMessage,
  textarea,
  appendLogMessage,
  addContact,
  removeContact,
  getSelectedContactIndex
}
