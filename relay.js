import { createLibp2p } from "libp2p"
import { mplex } from "@libp2p/mplex"
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from "@chainsafe/libp2p-noise"
import { circuitRelayServer } from 'libp2p/circuit-relay'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { identifyService } from 'libp2p/identify'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { kadDHT } from "@libp2p/kad-dht"
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import { id, addr } from "./src/server-peer.js"

const server = await createLibp2p({
  peerId: id,
  addresses: {
    listen: [addr.toString()]
  },
  transports: [
    webSockets({ filter: filters.all }),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux(), mplex()],
  services: {
    identify: identifyService(),
    pubsub: gossipsub(),
    circuitRelayServer: circuitRelayServer({ advertise: true }),
    dht: kadDHT({
      clientMode: false,
      validators: { ipns: ipnsValidator },
      selectors: { ipns: ipnsSelector },
    })
  }
})

console.log("p2p addr: ", server.getMultiaddrs().map((ma) => ma.toString())[0])
console.log('')
console.log('automatically dialed by clients')
