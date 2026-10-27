---
'@bazza-ui/react': patch
---

Data-first surfaces now use their `filter` prop. A custom `filter` scores rows in search and deep search, with `forceScore` still taking precedence, where before every data-first search used `commandScore`. `filter={false}` turns filtering off: the surface shows its rows as it does with no search, which suits `content` you filter yourself or a query loader that filters on the server.
