/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_W3_TOKEN: string;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
