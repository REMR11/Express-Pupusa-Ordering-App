const FILE_PATH = /(^|[\\/])\.env(\.[^\\/]*)?$/i
const CONFIG_PATH = /(^|[\\/])opencode\.jsonc?$/i
const BASH_REF = /(^|[\s\\/'"=])(\.env(\.[^\s\\/'"`]*)?|opencode\.jsonc?)(?=$|[\s\\/'"`;&|])/i

function isSecret(value: unknown) {
  return typeof value === "string" && (FILE_PATH.test(value) || CONFIG_PATH.test(value))
}

const READS_CONTENT = new Set(["read", "grep"])

export default async () => ({
  "tool.execute.before": async (input: { tool: string }, output: { args?: any }) => {
    const args = output.args ?? {}

    if (READS_CONTENT.has(input.tool)) {
      const hit = [args.filePath, args.path, args.include].find(isSecret)
      if (hit) throw new Error(`Bloqueado: ${hit} es un archivo protegido (.env / opencode.jsonc).`)
    }

    if (input.tool === "bash" && BASH_REF.test(String(args.command ?? ""))) {
      throw new Error("Bloqueado: el comando hace referencia a un .env u opencode.jsonc protegido.")
    }
  },
})
