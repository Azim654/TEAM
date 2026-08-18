/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.png" {
  const src: string
  export default src
}

declare module "*.svg" {
  const src: string
  export default src
}

declare module "*.jpg" {
  const src: string
  export default src
}

declare module "*.scss" {
  const content: Record<string, string>
  export default content
}

declare module "*.sass" {
  const content: Record<string, string>
  export default content
}

declare module "*.css" {
  const content: Record<string, string>
  export default content
}
