declare global {
  namespace App {}

  interface ImportMetaEnv {
    readonly VITE_BUILD_VERSION?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
