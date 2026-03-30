# PDF Scanner App

## Current State
Blank scaffold — empty Motoko actor, no App.tsx, just boilerplate frontend files and shadcn/ui components.

## Requested Changes (Diff)

### Add
- Camera-based document scanning (capture photo from camera or file upload)
- Image enhancement filters: grayscale, contrast boost, B&W
- PDF generation from one or more scanned pages (client-side, jsPDF)
- OCR text extraction from scanned images (Tesseract.js)
- User authentication via Internet Identity
- Cloud storage for scanned documents (blob-storage component)
- File/document management: list, rename, delete, download
- Folder organization and search
- Dark mode toggle

### Modify
- Backend actor: add document metadata CRUD (store document name, date, folder, owner principal)

### Remove
- Nothing existing to remove

## Implementation Plan
1. Select components: authorization, blob-storage, camera
2. Generate Motoko backend with document metadata storage (create, list, rename, delete, folder management)
3. Build full frontend:
   - Auth flow (login/logout with Internet Identity)
   - Scanner view: camera capture or file upload, image preview with filter controls
   - PDF builder: multi-page, generate & download PDF
   - OCR panel: extract text from captured image
   - Document library: grid/list view, folders, search, rename, delete
   - Dark mode toggle in header
