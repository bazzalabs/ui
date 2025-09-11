import Script from 'next/script'
export default function OneDollarStatsScript() {
  return (
    // biome-ignore lint/correctness/useUniqueElementIds: allowed
    <Script
      defer
      src="https://assets.onedollarstats.com/stonks.js"
      id="stonks"
      data-debug={
        process.env.NEXT_PUBLIC_RELEASE_TYPE === 'canary'
          ? 'canary.bazza-ui.com'
          : 'ui.bazza.dev'
      }
    />
  )
}
