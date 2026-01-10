-- ============================================================================
-- Migration 001: Initial Setup
-- FinGuard Database - Complete Schema, RLS, and Seed Data
-- ============================================================================

-- This migration includes:
-- 1. Full database schema (all tables)
-- 2. Row Level Security policies
-- 3. KPI definitions seed data
-- 4. Chart of Accounts seed data

-- Execute in order:
-- Step 1: Create schema (tables, indexes, constraints)
-- Step 2: Enable RLS and create policies
-- Step 3: Load seed data

-- ============================================================================
-- IMPORTANT: Run the following files in SQL Editor or via CLI:
-- ============================================================================

-- 1. database/schema.sql           - Creates all tables
-- 2. database/policies/rls_policies.sql - Enables RLS and policies
-- 3. database/seed/kpi_definitions.sql  - Loads KPI definitions
-- 4. database/seed/chart_of_accounts.sql - Loads Romanian chart of accounts

-- ============================================================================
-- OR use Supabase CLI:
-- ============================================================================

-- supabase db push

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check all tables created
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check KPI definitions loaded
SELECT COUNT(*) as kpi_count FROM kpi_definitions;

-- Check chart of accounts loaded
SELECT COUNT(*) as account_count FROM chart_of_accounts WHERE is_system = true;

-- ============================================================================
-- Expected Results:
-- ============================================================================

-- ✓ 18+ tables created
-- ✓ RLS enabled on all tables
-- ✓ 25+ KPI definitions
-- ✓ 200+ chart accounts
-- ✓ All foreign keys and indexes created
-- ✓ All helper functions created

-- ============================================================================
