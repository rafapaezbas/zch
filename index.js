const { appendChatMessage, textarea } = require('./lib/gui')

/*
appendChatMessage(Date.now(), 'userA', 'In id erat non orci commodo lobortis.  ')
appendChatMessage(Date.now(), 'userB', 'Donec vitae dolor.  ')
appendChatMessage(Date.now(), 'userA', 'Etiam laoreet quam sed arcu.  ')
appendChatMessage(Date.now(), 'userB', 'Proin quam nisl, tincidunt et, mattis eget, convallis nec, purus.  ')
appendChatMessage(Date.now(), 'userA', 'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.  ')
*/

setInterval(() => {
  appendChatMessage(Date.now(), 'user', 'New message')
}, 1000)

textarea.on('submit', () => {
  appendChatMessage("submited")
})
