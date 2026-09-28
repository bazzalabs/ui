---
'@bazza-ui/react': minor
---

Add `asyncContentMode` to data-first surfaces. With `'append'`, rows from `asyncContent` are added after `content` instead of replacing it, and local rows stay ahead of loaded ones while searching. A loaded row with the same Resolved ID as a local row is dropped so the local row wins, and a loaded group with the same ID as a local group adds its new rows to that group. The default, `'replace'`, keeps today's behaviour.
