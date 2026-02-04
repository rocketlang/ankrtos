#!/bin/bash
# CoralsAstrology - Quick Start Script
# Run this to start development

echo "🔮 CoralsAstrology - Starting Development Environment 🔮"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    cd /root/apps/corals-astrology || exit 1
fi

echo "📍 Current directory: $(pwd)"
echo ""

# Option selection
echo "Choose how to start:"
echo "  1) Start Backend only"
echo "  2) Start Frontend only"
echo "  3) Start Both (separate terminals)"
echo "  4) Start with Docker (all services)"
echo "  5) Setup Database only"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Starting Backend..."
        cd backend
        npm run dev
        ;;
    2)
        echo "🎨 Starting Frontend..."
        cd frontend
        npm run dev
        ;;
    3)
        echo "⚡ Starting both services..."
        echo "Backend: http://localhost:4000"
        echo "Frontend: http://localhost:5173"
        echo ""
        cd backend && npm run dev &
        cd ../frontend && npm run dev
        ;;
    4)
        echo "🐳 Starting Docker services..."
        docker-compose up -d
        echo ""
        echo "✅ Services started:"
        echo "  • PostgreSQL: localhost:5432"
        echo "  • Backend: http://localhost:4000"
        echo "  • Frontend: http://localhost:5173"
        echo ""
        echo "View logs: docker-compose logs -f"
        ;;
    5)
        echo "💾 Setting up database..."
        cd backend
        npx prisma generate
        npx prisma migrate dev --name init
        npm run prisma:seed
        echo "✅ Database ready!"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
