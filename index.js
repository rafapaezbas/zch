const gui = require('./lib/gui')
const command = require('./lib/command')
const configuration = require('./lib/config')

// TODO remove lorem ipsum
// TODO add date format
gui.appendChatMessage(Date.now(), 'userA', 'In id erat non orci commodo lobortis.  ')
gui.appendChatMessage(Date.now(), 'userB', 'Donec vitae dolor.  ')
gui.appendChatMessage(Date.now(), 'userA', 'Etiam laoreet quam sed arcu.  ')
gui.appendChatMessage(Date.now(), 'userB', 'Proin quam nisl, tincidunt et, mattis eget, convallis nec, purus.  ')
gui.appendChatMessage(Date.now(), 'userA', 'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.  ')

const start = async () => {
  (await configuration.loadConfig()).contacts.filter(c => c.active).forEach(c => {
    gui.addContact(c.alias)
  })

  gui.textarea.on('submit', (data) => {
    const isCommand = data[0] === '\\'
    if (isCommand) {
      command(data.substring(1).split(' '))
    } else {
      // sendMessageToRelay
    }
  })
}

module.exports = {
  start
}
