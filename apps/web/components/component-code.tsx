import fs from 'node:fs/promises'
import path from 'node:path'
import { CodeBlock } from './code-block'

export default async function ComponentCode({ src }: { src: string }) {
  const file = await fs.readFile(path.join(process.cwd(), src), 'utf-8')
  const code = file
  return (
    <CodeBlock
      className="rounded-none border-none shadow-none"
      code={code}
      lang="tsx"
    />
  )
}
