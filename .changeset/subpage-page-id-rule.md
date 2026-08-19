---
'@bazza-ui/react': minor
---

**Behavior change.** Subpage page ids now follow the canonical segment rule — explicit `id`s pass through verbatim instead of being slugified (`subpage.My.Page` where the id is `"My.Page"`; previously `subpage.mypage`). Ids without explicit `id`, and explicit `pageId` props, are unaffected. Update any hardcoded `targetPageId`/`pageId` strings that relied on slugified explicit ids.
