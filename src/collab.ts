import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createWelo, type Welo, type Manifest, type Database, Keyvalue } from 'welo'
import { liveReplicator } from 'welo/dist/src/replicator/live'
import { zzzyncReplicator, ZzzyncReplicator } from 'welo/dist/src/replicator/zzzync'
import { Web3Storage } from 'web3.storage'
import type { Libp2p } from 'libp2p'
import type { Helia } from '@helia/interface'
import { createLibp2pOptions } from './libp2p-options'
import { multiaddr } from '@multiformats/multiaddr';
import { peerIdFromString } from '@libp2p/peer-id'
import { decode } from '@ipld/dag-cbor'
import { TodoModel } from './todoModel'
import { Key } from 'interface-datastore'
import { addr } from './server-peer.js'

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
    client: any,
    render: any,
    decode: any,
    setTodos: any,
    Key: any
  }
}

window.multiaddr = multiaddr
window.peerIdFromString = peerIdFromString
window.decode = decode
window.Key = Key

let 
  helia: Helia<any>,
  libp2p: Libp2p<any>,
  welo: Welo,
  manifest: Manifest,
  db: Database,
  model: TodoModel

export function attach (_model: TodoModel) {
  model = _model
  void start()
}

export async function start (): Promise<void> {
  libp2p = await createLibp2p(createLibp2pOptions())
  helia = await createHelia({ libp2p })

  welo = await createWelo({
    ipfs: helia,
    replicators: [
      liveReplicator(),
      zzzyncReplicator({
        w3: { client: new Web3Storage({ token }) },
        createEphemeralLibp2p: () => helia.libp2p // fine because there is only one database to replicate
      })
    ]
  })
  manifest = await welo.determine({
    name: 'todomvc',
    protocol: 'keyvalue',
    access: { protocol: '/hldb/access/static', config: { write: ['*'] } }
  })
  db = await welo.open(manifest)

  if (libp2p.getMultiaddrs().length === 3) {
    await download(db)
  } else {
    libp2p.addEventListener('self:peer:update', (event) => {
      if (event.detail.peer.addresses.length === 2) {
        console.log('download')
        void download(db)
      }
    })
  }

  void updateModel(db, model)

  db.replica.events.addEventListener('update', updateModel.bind(undefined, db, model))
  db.replica.events.addEventListener('update', uploadChanges.bind(undefined, db))

  window.helia = helia
  window.libp2p = libp2p
  window.welo = welo
  window.manifest = manifest
  window.db = db

  started = true
  void putTodos(prestart.put)
  void delTodos(prestart.del)
}

const updateModel = async (db: Database, model: TodoModel): Promise<void> => {
  await db.store.latest()
  model.todos = await getTodos(db)
  model.inform()
}

const getTodos = async (db: Database): Promise<ITodo[]> => {
  const todos: ITodo[] = []
  const store = db.store as Keyvalue
  for await (const { value: cborTodo } of store.index.query({})) {
    const value: ITodo = decode(cborTodo)
    console.log(value)
    if (value != null) todos.push(value)
  }
  return todos
}

const uploadChanges = async (db: Database): Promise<void> => {
  const zzzync = db.replicators.filter(r => r instanceof ZzzyncReplicator)[0] as ZzzyncReplicator | undefined

  if (zzzync != null) {
    return
  }

  await zzzync.upload()
  console.log('uploaded replica')
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

async function download (db: Database) {
  for (const replicator of db.replicators) {
    if (replicator instanceof ZzzyncReplicator) {
      console.log(helia.libp2p.getMultiaddrs())
      void replicator.download()
        .then(() => console.log('no way...'))
        .catch(() => console.log('yes way'))
    }
  }
}

