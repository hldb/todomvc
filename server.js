import kubo from 'go-ipfs'
import * as kuboRpcModule from 'kubo-rpc-client'
import { createServer } from 'ipfsd-ctl'

const server = await createServer({
  host: '127.0.0.1',
  port: 5001
}, {
  ipfsBin: kubo.path(),
  kuboRpcModule,
  ipfsOptions: {
    config: {
      Addresses: {
        Swarm: [
          // '/ip4/127.0.0.1/udp/4001/quic-v1/webtransport',
          // '/ip4/127.0.0.1/tcp/0/ws',
          // '/p2p-circuit'
        ]
      },
      Swarm: {
        RelayClient: {
          Enabled: true
        },
        RelayService: {
          Enabled: true
        }
      }
    }
  }
}).start()

console.log(`kubo api listening at ${server.host}:${server.port}`)
