import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createWelo, type Welo, type Manifest, type Database, Keyvalue } from 'welo'
import { liveReplicator } from 'welo/dist/src/replicator/live'
import { zzzyncReplicator, ZzzyncReplicator } from 'welo/dist/src/replicator/zzzync'
import { Web3Storage } from 'web3.storage'
import { multiaddr } from '@multiformats/multiaddr';
import { peerIdFromString } from '@libp2p/peer-id'
import { decode } from '@ipld/dag-cbor'
import { Key } from 'interface-datastore'
import type { Libp2p } from 'libp2p'
import type { Helia } from '@helia/interface'
import type { Ed25519PeerId } from '@libp2p/interface-peer-id'
import { createLibp2pOptions } from './libp2p-options'
import { TodoModel } from './todoModel'
import * as cbor from '@ipld/dag-cbor'
import { EntryInstance } from 'welo/dist/src/entry/interface'

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
    Key: any,
    cbor: any
  }
}

window.multiaddr = multiaddr
window.peerIdFromString = peerIdFromString
window.decode = decode
window.Key = Key
window.cbor = cbor

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
        // @ts-expect-error
        createEphemeralLibp2p: () => ({ libp2p: helia.libp2p }), // fine because there is only one database to replicate
        scope: 'lan' // only checking the lan dht for dcids
      })
    ]
  })
  manifest = await welo.determine({
    name: 'todomvc',
    protocol: 'keyvalue',
    access: { protocol: '/hldb/access/static', config: { write: ['*'] } }
  })
  db = await welo.open(manifest, { provider: libp2p.peerId as Ed25519PeerId })

  const initialDownload = async (num: number) => {
    if (num === 2) {
      await download(db)
    } else {
      libp2p.addEventListener(
        'self:peer:update',
        (event) => initialDownload(event.detail.peer.addresses.length),
        { once: true }
      )
    }
  }
  initialDownload(libp2p.getMultiaddrs().length)

  void updateModel(db, model)

  db.replica.events.addEventListener('update', updateModel.bind(undefined, db, model))
  db.replica.events.addEventListener('update', throttledUpload.bind(undefined, db))

  window.helia = helia
  window.libp2p = libp2p
  window.welo = welo
  window.manifest = manifest
  window.db = db

  started = true
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
    if (value != null) todos.push(value)
  }
  return todos
}

let uploading: Promise<unknown> | null = null 
let nextUpload: () => Promise<unknown> | null = null

const throttledUpload = async (db: Database): Promise<void> => {
  const _uploadChanges = () => uploadChanges(db).then(() => {
    uploading = null
    if (nextUpload != null) {
      uploading = nextUpload()
      nextUpload = null
    }
  })
  if (uploading == null) {
    uploading = _uploadChanges()
  } else {
    nextUpload = _uploadChanges
  }
}


const uploadChanges = async (db: Database): Promise<void> => {
  const zzzync = db.replicators.filter(r => r instanceof ZzzyncReplicator)[0] as ZzzyncReplicator | undefined

  if (zzzync == null) {
    return
  }

  await zzzync.upload()
  console.log('uploaded replica')
}

export async function putTodos (todos: ITodo[]): Promise<void> {
  const entries: Array<Promise<EntryInstance<any>>> = []
  for (const todo of todos) {
    const payload = db.store.creators.put(todo.id, todo)
    entries.push(db.replica.newEntry(payload))
  }
  void db.replica.add(await Promise.all(entries))
}

export async function delTodos (todos: ITodo[]): Promise<void> {
  const entries: Array<Promise<EntryInstance<any>>> = []
  for (const todo of todos) {
    const payload = db.store.creators.del(todo.id, todo)
    entries.push(db.replica.newEntry(payload))
  }
  void db.replica.add(await Promise.all(entries))
}

async function download (db: Database) {
  for (const replicator of db.replicators) {
    if (replicator instanceof ZzzyncReplicator) {
      console.log(helia.libp2p.getMultiaddrs())
      await replicator.download()
    }
  }
}

