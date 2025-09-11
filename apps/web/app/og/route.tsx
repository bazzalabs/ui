/** biome-ignore-all lint/performance/noImgElement: <explanation> */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

async function loadAssets(): Promise<
  { name: string; data: Buffer; weight: 400 | 600; style: 'normal' }[]
> {
  const [{ data: normal }, { data: semibold }] = await Promise.all([
    import('./inter-regular-woff2.json').then((mod) => mod.default || mod),
    import('./inter-display-semibold.json').then((mod) => mod.default || mod),
  ])

  return [
    {
      name: 'Inter',
      data: Buffer.from(normal, 'base64'),
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'Inter Display',
      data: Buffer.from(semibold, 'base64'),
      weight: 600 as const,
      style: 'normal' as const,
    },
  ]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const description = searchParams.get('description')

  const [fonts] = await Promise.all([loadAssets()])

  const logoData = await readFile(
    join(process.cwd(), 'public/bazzaui-v3-color.png'),
  )
  const logoSrc = Uint8Array.from(logoData).buffer

  return new ImageResponse(
    <div
      style={{ width: 1200, height: 628 }}
      tw="bg-neutral-900 flex flex-col relative"
    >
      <div tw="flex border absolute border-neutral-700 border-dashed inset-y-0 left-16 w-[1px]" />
      <div tw="flex border absolute border-neutral-700 border-dashed inset-y-0 right-16 w-[1px]" />
      <div tw="flex border absolute border-neutral-700 inset-x-0 h-[1px] bottom-16" />
      <div tw="flex border absolute border-neutral-700 inset-x-0 h-[1px] top-16" />
      <div tw="flex border-l border-t absolute border-neutral-100 border-dashed top-16 left-16 h-[32px] w-[32px]" />
      <div tw="flex border-r border-t absolute border-neutral-100 border-dashed top-16 right-16 h-[32px] w-[32px]" />
      <div tw="flex border-r border-b absolute border-neutral-100 border-dashed bottom-16 right-16 h-[32px] w-[32px]" />
      <div tw="flex border-l border-b absolute border-neutral-100 border-dashed bottom-16 left-16 h-[32px] w-[32px]" />
      <div tw="flex-1 flex flex-col m-12 relative justify-center">
        <div tw="flex flex-col m-16">
          <p
            tw="text-7xl text-neutral-50 flex items-center"
            style={{ fontFamily: 'Inter Display', textWrap: 'balance' }}
          >
            {title}
          </p>
          <span
            tw="mt-8 text-4xl text-neutral-200 leading-[1.3]"
            style={{ fontFamily: 'Inter' }}
          >
            {description}
          </span>
        </div>
        <img
          // @ts-expect-error
          src={logoSrc}
          tw="absolute bottom-10 right-10"
          alt="bazza/ui"
          height={64}
          width={64}
        />
      </div>
    </div>,
    {
      width: 1200,
      height: 628,
      fonts,
    },
  )
}
