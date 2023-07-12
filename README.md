# todomvc

> uses online and offline replication to create preserved and real-time P2P applications

**Web app base is from [todomvc.com](todomvc.com)**

## Running the demo

**DEMO STILL BROKE, NEED TO FIX SOME THINGS IN ZZZYNC REPLICATORS UPLOAD METHOD**

> Have only tested the webapp using chromium browsers.

### Prerequisites

- web3.storage API token

### Create .env file

In the project root create a file named `.env` and write:

```
REACT_APP_W3_TOKEN='<web3.storage token>'
```

### Start Circuit-Relay Server

In a separate prompt, start a local relay-server using the command:

```bash
$ npm run relay
```

### Start Dev Server

In a separate terminal, start hosting the webapp locally by using the command:

```bash
$ npm run start
```

### Testing Live Replication

Using a browser, navigate to `localhost:3000`. Open another tab for the same url.

Begin making changes on either side. After a few moments the browser clients should find eachother over pubsub and updates can be observed immediately on the other side. Open more tabs if you like.

### Testing Offline Replication

Using a browser, navigate to `localhost:3000`.

Make changes to the todo list. Wait a moment for the changes to be uploaded. (not currently part of the UI but upload events can be observed in the console)

Reload the tab, this will wipe all previous data. After the new browser libp2p instance has connected to the local circuit-relay server the changes advertised by the previous instance can be queried from the dht, then w3name, and finally pulled from web3.storage.

## Demo topology

There is helia instance running in the browser which connects to public dev webrtc-star servers.
The browser clients also connect to a local circuit-relay server, clients use the `/webrtc` multiaddr to write to the lan DHT.
Clients will upload their immutable changes to web3.storage and advertise them either over pubsub with other online peers, or using the DHT and w3name for later use by currently offline peers.
