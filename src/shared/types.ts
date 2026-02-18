export interface CliType {
  id: string
  name: string
  envKeys: EnvKeyDef[]
  envDefaults: Record<string, string>
}

export interface EnvKeyDef {
  key: string
  label?: string
  secret?: boolean
}

export interface Profile {
  id: string
  name: string
  cliTypeId: string
  env: Record<string, string>
}

export interface StoreData {
  profiles: Profile[]
  activeProfileId: string | null
}
