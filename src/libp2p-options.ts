import { webRTCStar } from '@libp2p/webrtc-star'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { GossipSub, gossipsub } from '@chainsafe/libp2p-gossipsub'
import { DualKadDHT, kadDHT } from '@libp2p/kad-dht'
import { identifyService } from 'libp2p/identify'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import { bootstrap } from '@libp2p/bootstrap';
import { addr } from './server-peer.js'
import { DefaultIdentifyService } from 'libp2p/dist/src/identify/identify'
import { ServiceMap } from '@libp2p/interface-libp2p'
import * as filters from '@libp2p/websockets/filters'
import { webSockets } from '@libp2p/websockets';
import { mplex } from "@libp2p/mplex"
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import { webTransport } from '@libp2p/webtransport'
import { circuitRelayTransport } from 'libp2p/circuit-relay'
import type { Libp2pOptions } from 'libp2p'
import type { ConnectionGater } from '@libp2p/interface-connection-gater'

console.log(addr)

interface Services extends ServiceMap {
  identify: DefaultIdentifyService,
  pubsub: GossipSub,
  dht: DualKadDHT
}

const connectionGater = (): ConnectionGater => {
  return {
    denyDialPeer: async () => false,
    denyDialMultiaddr: async () => false,
    denyInboundConnection: async () => false,
    denyOutboundConnection: async () => false,
    denyInboundEncryptedConnection: async () => false,
    denyOutboundEncryptedConnection: async () => false,
    denyInboundUpgradedConnection: async () => false,
    denyOutboundUpgradedConnection: async () => false,
    filterMultiaddrForPeer: async () => true
  }
}

export function createLibp2pOptions (opts: Libp2pOptions = {}): Libp2pOptions<Services> {
  const webRtcStar = webRTCStar()

  const options: Libp2pOptions = {
    connectionGater: connectionGater(),
    addresses: {
      listen: [
        // '/dns4/localhost/tcp/24642/ws/p2p-webrtc-star/'
        '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
        '/webrtc'
        // '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
        // '/dns4/libp2p-rdv.vps.revolunet.com/tcp/443/wss/p2p-webrtc-star/'

      ]
    },
    transports: [
      webSockets({ filter: filters.all }),
      circuitRelayTransport({
        discoverRelays: 1
      }),
      webRTC(),
      webRTCDirect(),
      webTransport(),
      webRtcStar.transport
    ],
    peerDiscovery: [
      bootstrap({ list: [addr.toString()] }),
      webRtcStar.discovery
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      mplex(),
      yamux(),
    ],
    services: {
      identify: identifyService(),
      pubsub: gossipsub({ emitSelf: true, allowPublishToZeroPeers: true }),
      dht: kadDHT({
        clientMode: true,
        validators: { ipns: ipnsValidator },
        selectors: { ipns: ipnsSelector }
      })
    }
  }

  return options
}
