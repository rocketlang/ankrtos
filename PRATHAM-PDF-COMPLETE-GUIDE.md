# 🎓 Pratham Educational PDFs - Complete Setup Guide

## 📤 STEP 1: Upload PDFs from WSL

### Quick Command
```bash
# From your WSL terminal:
scp "/mnt/c/Users/Hp/Downloads/6 Bookset QA - Comprehensive Book with First page (ISBN).pdf" root@216.48.185.29:/root/pdfs-pratham/
```

### Upload Multiple Files
```bash
# Upload all PDFs:
scp /mnt/c/Users/Hp/Downloads/*.pdf root@216.48.185.29:/root/pdfs-pratham/

# Or use rsync for better progress tracking:
rsync -avz --progress /mnt/c/Users/Hp/Downloads/*.pdf root@216.48.185.29:/root/pdfs-pratham/
```

### Verify Upload
```bash
ssh root@216.48.185.29 "ls -lh /root/pdfs-pratham/"
```

---

## ⚙️ STEP 2: Process PDFs on Server

Once uploaded, SSH into the server and run the automated setup:

```bash
ssh root@216.48.185.29
bash /root/setup-pratham-pdfs.sh
```

This will:
1. ✅ Extract PDF metadata (title, pages, ISBN)
2. ✅ Generate thumbnails for each book
3. ✅ Extract text for search indexing
4. ✅ Create structured catalog
5. ✅ Import into ANKR LMS database

---

## 📚 Features Available

### For Students (like Byju's):
- 📖 **PDF Viewer** - Read books in browser
- 🔍 **Full-text Search** - Find content across all books
- 🎯 **Bookmarks** - Save your place
- ✍️ **Annotations** - Highlight and take notes
- 📊 **Progress Tracking** - Track reading progress
- 📱 **Mobile Friendly** - Works on phones/tablets
- 🌐 **Multi-language** - Support for regional languages
- 💾 **Offline Mode** - Download for offline reading

### For Teachers:
- 📈 **Analytics** - Track student engagement
- 👥 **Class Management** - Assign books to classes
- 📝 **Quizzes** - Create assessments from content
- 🎓 **Progress Reports** - Monitor student progress

---

## 🌐 Access URLs

| Service | URL | Status |
|---------|-----|--------|
| **Public URL** | https://ankrlms.ankr.in | ✅ |
| **API** | https://ankrlms.ankr.in/api | ✅ |
| **Local Dev** | http://216.48.185.29:5173 | ✅ |

---

## 📁 File Structure

```
/root/pdfs-pratham/                                    # Upload here
├── 6 Bookset QA - ISBN.pdf
└── [your other PDFs]

/root/ankr-labs-nx/node_modules/@ankr/interact/data/
├── pdfs/                                              # Processed PDFs
│   └── 6 Bookset QA - ISBN.pdf
├── thumbnails/                                        # Cover images
│   └── 6 Bookset QA - ISBN.jpg
├── metadata/                                          # Book info
│   └── 6 Bookset QA - ISBN.json
└── pratham-catalog.json                               # Master catalog
```

---

## 🔧 Manual Processing (if needed)

### Process Single PDF
```bash
node /root/process-pratham-pdfs.js
```

### Import to Database
```bash
node /root/import-pdfs-to-ankr-lms.js
```

### Check Logs
```bash
tail -f /root/ankr-viewer.log
```

---

## 🐛 Troubleshooting

### Cannot access ankrlms.ankr.in
```bash
# Check services:
netstat -tlnp | grep -E "(5173|3199)"

# Restart if needed:
pkill -f vite
cd /root/ankr-labs-nx/node_modules/@ankr/interact
npx vite --host 0.0.0.0 --port 5173 &

# Check nginx:
nginx -t
systemctl restart nginx
```

### PDF Upload Failed
```bash
# Check disk space:
df -h

# Check permissions:
ls -la /root/pdfs-pratham/

# Create directory if missing:
mkdir -p /root/pdfs-pratham
chmod 755 /root/pdfs-pratham
```

### Processing Failed
```bash
# Install required tools:
apt-get update
apt-get install -y poppler-utils imagemagick

# Check PDF is valid:
pdfinfo "/root/pdfs-pratham/yourfile.pdf"
```

---

## 📊 Example Workflow

1. **Teacher uploads books** via scp from WSL
2. **System processes** PDFs automatically
3. **Students access** via https://ankrlms.ankr.in
4. **Students read & annotate** books
5. **Teacher tracks progress** via analytics dashboard

---

## 🚀 Advanced Features

### Enable AI Features
- 📝 **Auto-summarization** - AI-generated chapter summaries
- ❓ **Q&A Generation** - Automatic quiz questions
- 🗣️ **Text-to-Speech** - Audio narration (Hindi/English)
- 🔤 **Translation** - Real-time translation to regional languages

### Enable Collaboration
- 👥 **Study Groups** - Shared annotations
- 💬 **Discussion Threads** - Comment on chapters
- 🎓 **Peer Learning** - Share notes

---

## 📞 Support

If you encounter issues:
1. Check logs: `tail -f /root/ankr-viewer.log`
2. Verify services: `netstat -tlnp | grep 5173`
3. Test locally: `curl http://localhost:5173`

---

## 🎯 Next Steps

1. ✅ Upload your first PDF using scp command above
2. ✅ Run `bash /root/setup-pratham-pdfs.sh`
3. ✅ Access https://ankrlms.ankr.in
4. ✅ Browse your books in the Library section

---

**Status:** ✅ System Ready
**Date:** 2026-01-24
**Server:** 216.48.185.29
**Created by:** ANKR Labs
