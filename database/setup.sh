#!/bin/bash

# ============================================================================
# FinGuard Database Setup Script
# Automatizează procesul de setup pentru baza de date Supabase
# ============================================================================

set -e  # Exit on error

echo "🚀 FinGuard Database Setup"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI nu este instalat!${NC}"
    echo ""
    echo "Instalează Supabase CLI:"
    echo "  Windows: scoop install supabase"
    echo "  Mac: brew install supabase/tap/supabase"
    echo "  Linux: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI găsit${NC}"

# Check environment
echo ""
echo "Selectează mediul:"
echo "1) Local Development"
echo "2) Supabase Cloud (Production/Staging)"
read -p "Alege opțiunea (1 sau 2): " env_choice

if [ "$env_choice" = "1" ]; then
    echo ""
    echo "📦 Setup LOCAL Development"
    echo "=========================="
    
    # Check if Supabase is already running
    if supabase status &> /dev/null; then
        echo -e "${YELLOW}⚠ Supabase local rulează deja${NC}"
        read -p "Vrei să resetezi baza de date? (y/n): " reset_choice
        
        if [ "$reset_choice" = "y" ]; then
            echo "🔄 Resetare bază de date..."
            supabase db reset
        fi
    else
        echo "🔧 Pornire Supabase local..."
        supabase start
    fi
    
    echo ""
    echo -e "${GREEN}✓ Supabase local pornit${NC}"
    echo ""
    echo "📋 Detalii conexiune:"
    supabase status
    
elif [ "$env_choice" = "2" ]; then
    echo ""
    echo "☁️  Setup CLOUD (Production/Staging)"
    echo "===================================="
    
    # Check if project is linked
    if [ ! -f ".supabase/config.toml" ]; then
        echo ""
        echo "🔗 Linkare proiect Supabase..."
        read -p "Introdu Project ID (din Supabase Dashboard): " project_id
        supabase link --project-ref "$project_id"
    else
        echo -e "${GREEN}✓ Proiect deja linkat${NC}"
    fi
    
    echo ""
    echo "⚠️  ATENȚIE: Ești pe cale să aplici migrations pe CLOUD!"
    read -p "Ești sigur? Scrie 'yes' pentru a continua: " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Anulat."
        exit 0
    fi
    
    echo "🚀 Aplicare migrations pe cloud..."
    supabase db push
    
else
    echo -e "${RED}Opțiune invalidă${NC}"
    exit 1
fi

echo ""
echo "=========================="
echo -e "${GREEN}✅ Setup completat cu succes!${NC}"
echo ""
echo "📚 Pași următori:"
echo "1. Verifică conexiunea în .env.local"
echo "2. Generează TypeScript types: npm run db:generate-types"
echo "3. Pornește aplicația: npm run dev"
echo ""
echo "📖 Documentație completă: database/README.md"
