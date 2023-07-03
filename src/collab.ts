import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createWelo, type Welo, type Manifest, type Database } from 'welo'
import { liveReplicator } from 'welo/dist/src/replicator/live'
import { zzzyncReplicator, ZzzyncReplicator } from 'welo/dist/src/replicator/zzzync'
import { Web3Storage } from 'web3.storage'
import type { Libp2p } from 'libp2p'
import type { Helia } from '@helia/interface'
import { createLibp2pOptions } from './libp2p-options'
import { multiaddr } from '@multiformats/multiaddr';
import { peerIdFromString } from '@libp2p/peer-id'

const token = process.env.REACT_APP_W3_TOKEN
let started = false

declare global {
  interface Window {
    helia: Helia<any>,
    libp2p: Libp2p<any>,
    welo: Welo,
    manifest: Manifest,
    db: Database,
    multiaddr: any,
    peerIdFromString: any,
    client: any
  }
}

window.multiaddr = multiaddr
window.peerIdFromString = peerIdFromString

let 
  helia: Helia<any>,
  libp2p: Libp2p<any>,
  welo: Welo,
  manifest: Manifest,
  db: Database,
  subscription: () => void

export function subscribe (render: () => void) {
  subscription = render
  void start()
}
// let first = true

export async function start (): Promise<void> {
  libp2p = await createLibp2p(createLibp2pOptions())
  helia = await createHelia({ libp2p })
  // libp2p.addEventListener('self:peer:update', (event) => {
  //   console.log('addrs')
  //   console.log(libp2p.getMultiaddrs())
  //   if (first && event.detail.peer.addresses.length > 1) {
  //     new Promise(resolve => setTimeout(resolve, 3000)).then(() => void download())
  //     // void download()
  //   }
  // })
  welo = await createWelo({
    ipfs: helia,
    replicators: [
      liveReplicator(),
      // zzzyncReplicator({
      //   w3: { client: new Web3Storage({ token }) },
      //   createEphemeralLibp2p: () => helia.libp2p // fine because there is only one database to replicate
      // })
    ]
  })
  manifest = await welo.determine({
    name: 'todomvc',
    protocol: 'keyvalue',
    access: { protocol: '/hldb/access/static', config: { write: ['*'] } }
  })
  db = await welo.open(manifest)

  db.events.addEventListener('update', () => {
    // 
    
    subscription()
  })


  window.helia = helia
  window.libp2p = libp2p
  window.welo = welo
  window.manifest = manifest
  window.db = db

  started = true
  void putTodos(prestart.put)
  void delTodos(prestart.del)
}

const prestart: { put: ITodo[], del: ITodo[] } = {
  put: [],
  del: []
}

export async function putTodos (todos: ITodo[]): Promise<void> {
  if (started === false)  {
    prestart.put.push(...todos)
    return
  }

  for (const todo of todos) {
    const payload = db.store.creators.put(todo.id, todo)
    void db.replica.write(payload)
  }
}

export async function delTodos (todos: ITodo[]): Promise<void> {
  if (started === false)  {
    prestart.del.push(...todos)
    return
  }

  for (const todo of todos) {
    const payload = db.store.creators.del(todo.id, todo)
    void db.replica.write(payload)
  }
}

// async function download () {
//   for (const replicator of db.replicators) {
//     if (replicator instanceof ZzzyncReplicator) {
//       console.log(helia.libp2p.getMultiaddrs())
//       void replicator.download()
//         .then(() => console.log('no way...'))
//         .catch(() => console.log('yes way'))
//     }
//   }
// }
// 
