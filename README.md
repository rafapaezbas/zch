# ZCH

Decentralized anonymous messaging app, does not require registration. ~~F*ck Whatsapp.~~

**Work in progress.**

## How does it work? 

In zch every contact is represented as the concatenation of at least 4 keys:

- Address key: the derived subkeys of the address key, [derived from the address key](https://sodium-friends.github.io/docs/docs/keyderivation) are used by a contact to know which messages are adressed to him/her. The databases will store the messages in a key/value format like:

``` javascript
[
  { "key": $subkey1, "message": $encryptedmessage, timestamp: $timestamp, signature: $signature, prev: $prev_message_signature },
  { "key": $subkey2, "message": $encryptedmessage, timestamp: $timestamp, signature: $signature, prev: $prev_message_signature },
]
```

Its like an always changing user id, only know by the user that derives the parent key.

- Public key: for public key encryption of the messages between contacts.

- Signature public key: for verification of messages signature.

- Relay public key: the relay will be associated with a [Hypercore](https://github.com/hypercore-protocol/hypercore-next), the public key of the relay will allow a user to know the key of the Hypercore associated with the relay, and send messages to the relay in order to store them. Only a relay can write on a core. Sender and receiver will interact through the core associated with the relay.
Any user can start its own relay and/or mirror any of the cores.

## The client

Every client generates a random 32 bytes master key, which is derives a new subkey for every new contact, in a similar way as a bitcoin [HD wallet](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) work.

``` javascript
const key = crypto.randomBytes(32) // This represents the master key
const contactA = { address: derive(key, 0), pk: derive(key, 1), relay: Buffer.from('...') }
const contactB = { address: derive(key, 2), pk: derive(key, 3), relay: Buffer.from('...') }

/*
contactA will send message to derive(contactA.address, 0), derive(contactA.address, 1) (m/0/0, m/0/1) ...
contactB will send message to derive(contactB.address, 0), derive(contactB.address, 1) (m/1/0, m/1/1) ...
It is important to notice that contactA and contactB cannot derive their keys to get each other keys.
*/

```

## The interface

![alt text](https://user-images.githubusercontent.com/15270736/150698695-8b773da1-f921-4dea-93ea-115dedaa4615.png)


ZCH is a cli-tool based on [neo-blessed](https://github.com/embarklabs/neo-blessed/).  The textarea input works like any messaging app, but also as a command line. See:

``` bash:
\add-contact --alias bar # generates a new contact, adds it to your list of contacts and prints the contact iformation that needs to be exchanged with the other party. (90bfc6c234e22425fb2a9614dcb751a46720d46df1914765562dc2c94218dfd263022f4a2ecc45f951255121e95563022dddf80ddbfe2f2d20640fbf72fb1b4f )
\add-contact --alias foo --invitation 90bfc6c234e22425fb2a9614dcb751a46720d46df1914765562dc2c94218dfd263022f4a2ecc45f951255121e95563022dddf80ddbfe2f2d20640fbf72fb1b4f # adds a new contact and sends acknowledgement message. Now users can start exchanging messages.
``` 
