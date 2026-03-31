declare module '@capacitor/cli' {
  export type CapacitorConfig = Record<string, any>
  const config: CapacitorConfig
  export default config
}
