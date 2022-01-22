const blessed = require('neo-blessed')

const screen = blessed.screen({
  smartCSR: true
})

screen.key('escape', function (ch, key) {
  return process.exit(0)
})

screen.title = 'zch'

const chat = blessed.log({
  top: '0',
  left: '0',
  width: '50%',
  height: '50%',
  padding: 0,
  alwaysScroll: true,
  scrollable: true,
  keys: true,
  border: {
    type: 'line'
  },
  scrollbar: {
    style: {
      bg: 'yellow'
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

textarea.key('enter', () => {
  textarea.clearValue()
  textarea.emit('submit')
})

screen.append(chat)
screen.append(textarea)
textarea.focus()

const appendChatMessage = (timestamp, user, msg) => {
  chat.log(timestamp + ' - ' + user + ' - ' + msg)
  screen.render()
}

module.exports = {
  appendChatMessage,
  textarea
}
