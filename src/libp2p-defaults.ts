import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { bootstrap } from '@libp2p/bootstrap'
import { ipniContentRouting } from '@libp2p/ipni-content-routing'
import { type DualKadDHT, kadDHT } from '@libp2p/kad-dht'
import { mplex } from '@libp2p/mplex'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import { webTransport } from '@libp2p/webtransport'
import { ipnsSelector } from 'ipns/selector'
import { ipnsValidator } from 'ipns/validator'
import { autoNATService } from 'libp2p/autonat'
import { circuitRelayTransport } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'
import { all } from '@libp2p/websockets/filters'
import { multiaddr } from '@multiformats/multiaddr'
import type { PubSub } from '@libp2p/interface-pubsub'
import type { Libp2pOptions } from 'libp2p'
import type { ConnectionGater } from '@libp2p/interface-connection-gater'
import { type Controller, createController } from 'ipfsd-ctl'
import * as kuboRpcClient from 'kubo-rpc-client'
// import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { webRTCStar } from '@libp2p/webrtc-star'

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


export async function libp2pDefaults (): Promise<Libp2pOptions<{ dht: DualKadDHT, pubsub: PubSub, identify: unknown, autoNAT: unknown }>> {
  let list: string[] = ['/ip4/127.0.0.1/tcp/8001/ws/p2p/12D3KooWKc8t4AH7pV1gTNecAhg5yFRGsYVjXVXPgxpnrBZ3JrVF']
  const webRtcStar = webRTCStar()

  if (process.env.NODE_ENV === 'development') {
    const client = await createController({
      kuboRpcModule: kuboRpcClient,
      test: true,
      endpoint: 'http://localhost:5001',
    })
    window.client = client
    list = [...list, ...client.peer.addresses.map(String)]
  } else {
    // this list comes from https://github.com/ipfs/kubo/blob/da28fbc65a2e0f1ce59f9923823326ae2bc4f713/config/bootstrap_peers.go#L17
    list = [
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
      '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',      // mars.i.ipfs.io
      '/ip4/104.131.131.82/udp/4001/quic/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ', // mars.i.ipfs.io
    ]
  }

  const production: Libp2pOptions = process.env.NODE_ENV === 'production'
    ? {
      contentRouters: [
        ipniContentRouting('https://cid.contact')
      ]
    }
    : {
      connectionGater: connectionGater()
    }
  
  const dht = kadDHT({
        clientMode: true,
        validators: {
          ipns: ipnsValidator
        },
        selectors: {
          ipns: ipnsSelector
        }
      })

  return {
    addresses: {
      listen: [
        '/dns4/libp2p-rdv.vps.revolunet.com/tcp/443/wss/p2p-webrtc-star/'
      ]
    },
    peerDiscovery: [
      bootstrap({ list }),
      // pubsubPeerDiscovery({ interval: 1000 })      
      webRtcStar.discovery
    ],
    transports: [
      webRTC(),
      webRTCDirect(),
      webTransport(),
      webSockets({ filter: all }),
      circuitRelayTransport({
        discoverRelays: 1
      }),
      webRtcStar.transport
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux(),
      mplex()
    ],
    services: {
      identify: identifyService(),
      pubsub: gossipsub(),
      dht
    },
    ...production
  }
}
