---
"@adapttable/ngx-bootstrap": patch
---

Reopen the native column menu reliably after Escape, including rapid keyboard activation before the close/open input values render separately. Render prepared placement inputs before the native popup opens so short-screen menus open above their trigger, and cancel a second activation while opening is pending. Apply the height and scrolling budget to the complete native popup, including its border and padding, so the outer edge stays on screen.
