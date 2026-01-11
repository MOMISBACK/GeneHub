#!/bin/bash
# Setup script for Supabase local development
# Usage: ./scripts/db-setup.sh [reset|migrate|seed]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if Supabase CLI is installed
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not installed"
        echo "Install with: brew install supabase/tap/supabase"
        echo "Or see: https://supabase.com/docs/guides/cli"
        exit 1
    fi
    log_info "Supabase CLI found: $(supabase --version)"
}

# Initialize Supabase if not already done
init_supabase() {
    if [ ! -f "$PROJECT_DIR/supabase/config.toml" ]; then
        log_info "Initializing Supabase project..."
        cd "$PROJECT_DIR"
        supabase init
    fi
}

# Start local Supabase
start_local() {
    log_info "Starting local Supabase..."
    cd "$PROJECT_DIR"
    supabase start
    echo ""
    log_info "Local Supabase is running!"
    log_info "Studio URL: http://localhost:54323"
    log_info "API URL: http://localhost:54321"
}

# Stop local Supabase
stop_local() {
    log_info "Stopping local Supabase..."
    cd "$PROJECT_DIR"
    supabase stop
}

# Apply all migrations
apply_migrations() {
    log_info "Applying migrations..."
    cd "$PROJECT_DIR"
    
    # Get list of migration files
    if [ -d "$MIGRATIONS_DIR" ]; then
        for migration in "$MIGRATIONS_DIR"/*.sql; do
            if [ -f "$migration" ]; then
                log_info "Applying: $(basename "$migration")"
                supabase db push --local
            fi
        done
    else
        log_warn "No migrations directory found at $MIGRATIONS_DIR"
    fi
    
    log_info "Migrations applied!"
}

# Reset database (drop all, recreate, apply migrations)
reset_db() {
    log_warn "This will DROP ALL DATA in local database!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Resetting database..."
        cd "$PROJECT_DIR"
        supabase db reset
        log_info "Database reset complete!"
    else
        log_info "Aborted."
    fi
}

# Seed database with test data
seed_db() {
    log_info "Seeding database with test data..."
    
    SEED_FILE="$PROJECT_DIR/supabase/seed.sql"
    
    if [ -f "$SEED_FILE" ]; then
        cd "$PROJECT_DIR"
        supabase db push --local --include-seed
        log_info "Seed data applied!"
    else
        log_warn "No seed file found at $SEED_FILE"
        log_info "Creating minimal seed file..."
        cat > "$SEED_FILE" << 'EOF'
-- Minimal seed data for development
-- Run: supabase db push --local --include-seed

-- Test user (use Supabase Dashboard or auth to create real users)
-- INSERT INTO auth.users ...

-- Sample tags
INSERT INTO public.tags (name, color) VALUES
  ('review', '#4A90A4'),
  ('important', '#FF6B6B'),
  ('question', '#FFE66D'),
  ('todo', '#95E1D3'),
  ('hypothesis', '#DDA0DD')
ON CONFLICT (name) DO NOTHING;

-- Sample researcher (if you have the knowledge base schema)
-- INSERT INTO public.researchers (name, institution, specialization, email) VALUES
--   ('Test Researcher', 'Test University', 'E. coli genetics', 'test@example.com')
-- ON CONFLICT DO NOTHING;

EOF
        log_info "Created $SEED_FILE - customize as needed"
    fi
}

# Generate TypeScript types from database schema
generate_types() {
    log_info "Generating TypeScript types..."
    cd "$PROJECT_DIR"
    
    # Requires SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN env vars for remote
    # For local, uses local database
    supabase gen types typescript --local > src/types/database.ts
    
    log_info "Types generated at src/types/database.ts"
}

# Link to remote project
link_remote() {
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        log_error "SUPABASE_PROJECT_ID environment variable not set"
        echo "Get it from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general"
        exit 1
    fi
    
    log_info "Linking to remote project: $SUPABASE_PROJECT_ID"
    cd "$PROJECT_DIR"
    supabase link --project-ref "$SUPABASE_PROJECT_ID"
    log_info "Linked!"
}

# Push migrations to remote
push_remote() {
    log_warn "This will apply migrations to REMOTE database!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Pushing to remote..."
        cd "$PROJECT_DIR"
        supabase db push
        log_info "Done!"
    else
        log_info "Aborted."
    fi
}

# Show status
status() {
    cd "$PROJECT_DIR"
    log_info "Supabase Status:"
    supabase status
}

# Show help
show_help() {
    echo "GeneHub Database Setup Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start       Start local Supabase"
    echo "  stop        Stop local Supabase"
    echo "  status      Show Supabase status"
    echo "  migrate     Apply all migrations"
    echo "  reset       Reset database (DROP ALL and recreate)"
    echo "  seed        Seed database with test data"
    echo "  types       Generate TypeScript types"
    echo "  link        Link to remote Supabase project"
    echo "  push        Push migrations to remote"
    echo "  help        Show this help"
    echo ""
    echo "Quick start:"
    echo "  1. $0 start       # Start local Supabase"
    echo "  2. $0 migrate     # Apply migrations"
    echo "  3. $0 seed        # (Optional) Add test data"
    echo ""
}

# Main
check_supabase_cli
init_supabase

case "${1:-help}" in
    start)
        start_local
        ;;
    stop)
        stop_local
        ;;
    status)
        status
        ;;
    migrate)
        apply_migrations
        ;;
    reset)
        reset_db
        ;;
    seed)
        seed_db
        ;;
    types)
        generate_types
        ;;
    link)
        link_remote
        ;;
    push)
        push_remote
        ;;
    help|*)
        show_help
        ;;
esac
