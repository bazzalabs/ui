#!/bin/sh
# The docs site's dev server (`portless run` runs it as the `dev:app` script). With
# BAZZA_UI_TAILNET=1 (`bun run dev:tailnet` at the root), devdoor also shares it on the tailnet
# and runs this script again inside its share; the app's own URL is then the tailnet one, since
# that's where it's opened from.
if [ "${BAZZA_UI_TAILNET:-}" = 1 ] && [ -z "${DEVDOOR_URL:-}" ]; then
  exec devdoor run web -- sh "$0" "$@"
fi
app_url="${DEVDOOR_URL:-${PORTLESS_URL:-}}"
if [ -n "$app_url" ]; then
  export NEXT_PUBLIC_APP_URL="$app_url"
fi
exec next dev --turbopack "$@"
