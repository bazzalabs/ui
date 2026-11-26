export default {
  '**/*.{js,cjs,mjs,jsx,ts,mts,cts,tsx,json,jsonc}': [
    'biome check --write --no-errors-on-unmatched',
  ],
  'packages/{react,menu-core}/**/*.{js,cjs,mjs,jsx,ts,mts,cts,tsx}': [
    'oxlint --disable-nested-config',
  ],
}
