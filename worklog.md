---
Task ID: 1
Agent: Main
Task: Add @vercel/speed-insights and create Image Gallery to show stored images

Work Log:
- Installed `@vercel/speed-insights` package and integrated `<SpeedInsights />` into layout.tsx
- Explored entire image storage architecture (base64 in PostgreSQL via Prisma)
- Created `GET /api/images/[id]?type=selfie|branded|card` — serves stored images as JPEG responses
- Created `GET /api/images` — lists all contacts with their stored image metadata
- Updated `POST /api/save-contact` to:
  - Accept `branded_selfie_base64` field
  - Populate `brandedSelfieBase64` in the database
  - Generate proper image serving URLs (`/api/images/{id}?type=...`)
  - Update contact with `selfieDriveUrl` and `cardDriveUrl`
- Updated `AppMode` type to include `'gallery'`
- Added `branded_drive_url` to `AutomationResults` interface
- Created `ImageGallery` component with:
  - Fetches image data from `/api/images`
  - Expandable contact cards with image thumbnails
  - 3-column image grid (selfie, branded, card types)
  - Image preview modal (Dialog-based)
  - Copy link and open-in-new-tab buttons
  - Refresh button
  - Loading and empty states
- Updated `ModeToggle` to 3-tab layout: Capture | Gallery | Agent
- Added Gallery section to main page with header
- Updated save-contact call to include `branded_selfie_base64`
- Lint passes clean, dev server compiles without errors
- Browser verification: All 3 tabs work, Gallery shows 3 images across 2 contacts, preview modal works on both desktop and mobile

Stage Summary:
- Images stored in Prisma PostgreSQL are now fully viewable through the Gallery tab
- Image serving API works: `GET /api/images/{id}?type=selfie|branded|card` returns JPEG
- New contacts get proper image URLs populated automatically
- 3-tab mode toggle: Capture, Gallery, Agent
