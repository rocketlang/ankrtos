# PDF Upload Guide for Pratham Educational Content

## Quick Upload from WSL

### Method 1: Direct Upload
```bash
# Upload single PDF
scp "/mnt/c/Users/Hp/Downloads/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf" root@216.48.185.29:/root/pdfs-pratham/

# Upload all PDFs
scp /mnt/c/Users/Hp/Downloads/*.pdf root@216.48.185.29:/root/pdfs-pratham/
```

### Method 2: Using RSYNC (recommended for multiple files)
```bash
# Sync entire Downloads folder
rsync -avz --progress "/mnt/c/Users/Hp/Downloads/" root@216.48.185.29:/root/pdfs-pratham/

# Only PDFs
rsync -avz --progress --include="*.pdf" --exclude="*" "/mnt/c/Users/Hp/Downloads/" root@216.48.185.29:/root/pdfs-pratham/
```

## After Upload - Processing on Server

Once uploaded, SSH into the server and run:

```bash
# List uploaded files
ls -lh /root/pdfs-pratham/

# Process PDFs (extract text, metadata, create thumbnails)
node /root/process-pratham-pdfs.js

# Import into ANKR LMS
node /root/import-pdfs-to-ankr-lms.js
```

## File Structure

```
/root/pdfs-pratham/                    # Upload destination
├── 6 Bookset QA - ISBN.pdf            # Your uploaded files
└── ...

/root/ankr-labs-nx/node_modules/@ankr/interact/data/
├── pdfs/                              # Processed PDFs
├── thumbnails/                        # PDF thumbnails
└── metadata/                          # Extracted metadata
```

## ANKR LMS URLs

- **Public URL:** https://ankrlms.ankr.in
- **Local Dev:** http://localhost:5173
- **Backend API:** http://localhost:3199

## Troubleshooting

If you get "Permission denied":
```bash
# Add your SSH key
ssh-copy-id root@216.48.185.29
```

If upload is slow:
```bash
# Use compression
scp -C "/mnt/c/Users/Hp/Downloads/file.pdf" root@216.48.185.29:/root/pdfs-pratham/
```

## Next Steps

1. Upload PDFs using scp command above
2. I'll create a processing script to:
   - Extract text from PDFs
   - Generate thumbnails
   - Extract ISBN and metadata
   - Create structured content for ANKR LMS
   - Enable search and navigation

## Features for Pratham (like Byju's)

✅ PDF upload and storage
✅ Text extraction and indexing
✅ Thumbnail generation
✅ ISBN/metadata extraction
✅ Chapter-wise navigation
✅ Search within PDFs
✅ Progress tracking
✅ Bookmarks and annotations
✅ Multi-language support
✅ Mobile-friendly viewer
