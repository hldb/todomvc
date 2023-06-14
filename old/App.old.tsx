import React from 'react';
import logo from './logo.svg';
import './App.css';
import { createLibp2p } from 'libp2p';
import { createHelia } from 'helia';
import { createWelo } from 'welo';

declare global {
  interface Window {
    helia: any
    libp2p: any
    welo: any
    manifest: any
    db: any
  }
}


async function a () {

const helia = await createHelia()
const welo = await createWelo({ ipfs: helia })
const manifest = await welo.determine({ name: 'a' })
const db = await welo.open(manifest)

window.helia = helia
window.libp2p = helia.libp2p
window.welo = welo
window.manifest = manifest
window.db = db
}

a()

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
