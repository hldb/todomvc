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
import type { Libp2pOptions } from 'libp2p'
import { DefaultIdentifyService } from 'libp2p/dist/src/identify/identify'
import { ServiceMap } from '@libp2p/interface-libp2p'

interface Services extends ServiceMap {
  identify: DefaultIdentifyService,
  pubsub: GossipSub,
  dht: DualKadDHT
}

export function createLibp2pOptions (opts: Libp2pOptions = {}): Libp2pOptions<Services> {
  const webRtcStar = webRTCStar()

  const options: Libp2pOptions = {
    addresses: {
      listen: [
        // '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
        // '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
        // '/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/',
        '/dns4/libp2p-rdv.vps.revolunet.com/tcp/443/wss/p2p-webrtc-star/'
      ]
    },
    transports: [
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
      yamux()
    ],
    connectionManager: {
      maxParallelDials: 150, // 150 total parallel multiaddr dials
      dialTimeout: 10e3 // 10 second dial timeout per peer dial
    },
    services: {
      identify: identifyService(),
      pubsub: gossipsub({ emitSelf: true, allowPublishToZeroPeers: true }),
      dht: kadDHT({
        clientMode: false,
        validators: { ipns: ipnsValidator },
        selectors: { ipns: ipnsSelector }
      })
    }
  }

  return options
}
