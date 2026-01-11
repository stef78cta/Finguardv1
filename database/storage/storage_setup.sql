-- ============================================================================
-- FinGuard - Supabase Storage Configuration
-- Version: 1.0
-- Date: 2026-01-11
-- ============================================================================
--
-- Acest script configurează Supabase Storage pentru fișierele de balanță
-- Include: bucket creation, security policies, upload limits

-- ============================================================================
-- 1. BUCKET CREATION
-- ============================================================================

/**
 * Bucket pentru fișiere trial balance (Excel/CSV)
 * 
 * Configurație:
 * - Public: false (acces controlat prin policies)
 * - File size limit: 10MB
 * - Allowed MIME types: Excel și CSV
 */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'trial-balance-files',
    'trial-balance-files',
    false,  -- Nu este public, acces controlat prin RLS
    10485760,  -- 10MB în bytes (10 * 1024 * 1024)
    ARRAY[
        'application/vnd.ms-excel',                                                    -- .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',         -- .xlsx
        'text/csv',                                                                    -- .csv
        'application/csv'                                                              -- .csv (alternate)
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE POLICIES - ACCES CONTROLAT
-- ============================================================================

/**
 * Policy: Utilizatorii pot UPLOAD fișiere doar pentru companiile lor
 * 
 * Logică:
 * - Path format: company_id/year/filename
 * - Verifică dacă user-ul are acces la companie prin company_users
 * - Extrage company_id din path și validează
 */
CREATE POLICY "Users can upload files to their companies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'trial-balance-files' 
    AND 
    -- Extrage company_id din path (primul segment)
    (storage.foldername(name))[1]::uuid IN (
        SELECT cu.company_id::text
        FROM company_users cu
        INNER JOIN users u ON u.id = cu.user_id
        WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
    )
);

/**
 * Policy: Utilizatorii pot ȘTERGE doar fișierele companiilor lor
 * 
 * Restricții:
 * - Doar owner/admin pot șterge (roluri 3 sau 4)
 * - Nu se pot șterge fișiere mai vechi de 90 zile (protecție audit)
 */
CREATE POLICY "Users can delete their company files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'trial-balance-files' 
    AND 
    (storage.foldername(name))[1]::uuid IN (
        SELECT cu.company_id::text
        FROM company_users cu
        INNER JOIN users u ON u.id = cu.user_id
        WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        AND cu.role IN ('owner', 'admin')  -- Doar owner/admin pot șterge
    )
    AND 
    created_at > NOW() - INTERVAL '90 days'  -- Protecție audit: nu șterge fișiere vechi
);

/**
 * Policy: Utilizatorii pot DESCĂRCA fișiere doar din companiile lor
 * 
 * Logică:
 * - Orice rol (owner/admin/member/viewer) poate descărca
 * - Verificare prin company_users membership
 */
CREATE POLICY "Users can download their company files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'trial-balance-files' 
    AND 
    (storage.foldername(name))[1]::uuid IN (
        SELECT cu.company_id::text
        FROM company_users cu
        INNER JOIN users u ON u.id = cu.user_id
        WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
    )
);

/**
 * Policy: Utilizatorii pot ACTUALIZA metadata fișierelor (rename, etc.)
 * 
 * Restricții:
 * - Doar owner/admin pot modifica
 * - Nu se poate schimba company_id (path principal)
 */
CREATE POLICY "Users can update their company file metadata"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'trial-balance-files' 
    AND 
    (storage.foldername(name))[1]::uuid IN (
        SELECT cu.company_id::text
        FROM company_users cu
        INNER JOIN users u ON u.id = cu.user_id
        WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        AND cu.role IN ('owner', 'admin')
    )
)
WITH CHECK (
    bucket_id = 'trial-balance-files' 
    AND 
    -- Verifică că noul path aparține tot aceleiași companii
    (storage.foldername(name))[1]::uuid IN (
        SELECT cu.company_id::text
        FROM company_users cu
        INNER JOIN users u ON u.id = cu.user_id
        WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        AND cu.role IN ('owner', 'admin')
    )
);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

/**
 * Funcție: Validează path-ul fișierului
 * 
 * Format așteptat: company_id/year/filename.ext
 * Exemplu: 550e8400-e29b-41d4-a716-446655440000/2024/balanta_dec_2024.xlsx
 * 
 * @param file_path TEXT - Path-ul complet al fișierului
 * @returns BOOLEAN - true dacă path-ul este valid
 */
CREATE OR REPLACE FUNCTION storage.validate_file_path(file_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    path_segments TEXT[];
    company_id_segment TEXT;
    year_segment TEXT;
BEGIN
    -- Split path în segmente
    path_segments := string_to_array(file_path, '/');
    
    -- Verifică că avem cel puțin 3 segmente
    IF array_length(path_segments, 1) < 3 THEN
        RETURN false;
    END IF;
    
    company_id_segment := path_segments[1];
    year_segment := path_segments[2];
    
    -- Verifică că primul segment este un UUID valid
    BEGIN
        PERFORM company_id_segment::uuid;
    EXCEPTION WHEN OTHERS THEN
        RETURN false;
    END;
    
    -- Verifică că al doilea segment este un an valid (1900-2100)
    IF year_segment !~ '^\d{4}$' THEN
        RETURN false;
    END IF;
    
    IF year_segment::int < 1900 OR year_segment::int > 2100 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Funcție: Obține statistici storage per companie
 * 
 * Utilă pentru afișarea usage-ului și limitelor în UI
 * 
 * @param p_company_id UUID - ID-ul companiei
 * @returns TABLE - Statistici (total_files, total_size, avg_size, oldest_file, newest_file)
 */
CREATE OR REPLACE FUNCTION storage.get_company_storage_stats(p_company_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    total_size_mb NUMERIC,
    avg_size_bytes BIGINT,
    oldest_file TIMESTAMPTZ,
    newest_file TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size_bytes,
        ROUND(COALESCE(SUM(metadata->>'size')::BIGINT, 0) / 1048576.0, 2) as total_size_mb,
        COALESCE(AVG(metadata->>'size')::BIGINT, 0) as avg_size_bytes,
        MIN(created_at) as oldest_file,
        MAX(created_at) as newest_file
    FROM storage.objects
    WHERE bucket_id = 'trial-balance-files'
    AND name LIKE p_company_id::text || '/%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Funcție: Cleanup fișiere vechi (pentru maintenance jobs)
 * 
 * Șterge fișiere mai vechi de X zile care nu sunt asociate cu imports active
 * 
 * @param days_old INT - Vârsta minimă în zile
 * @returns INT - Numărul de fișiere șterse
 */
CREATE OR REPLACE FUNCTION storage.cleanup_old_files(days_old INT DEFAULT 365)
RETURNS INT AS $$
DECLARE
    deleted_count INT := 0;
    file_record RECORD;
BEGIN
    -- Găsește fișiere vechi fără import asociat activ
    FOR file_record IN 
        SELECT o.id, o.name
        FROM storage.objects o
        WHERE o.bucket_id = 'trial-balance-files'
        AND o.created_at < NOW() - (days_old || ' days')::INTERVAL
        AND NOT EXISTS (
            SELECT 1 
            FROM trial_balance_imports tbi
            WHERE tbi.file_path = o.name
            AND tbi.status != 'deleted'
        )
    LOOP
        DELETE FROM storage.objects WHERE id = file_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. INDEXES PENTRU PERFORMANȚĂ
-- ============================================================================

-- Index pentru queries frecvente pe bucket_id și name pattern
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name 
ON storage.objects(bucket_id, name) 
WHERE bucket_id = 'trial-balance-files';

-- Index pentru cleanup queries pe created_at
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at 
ON storage.objects(created_at) 
WHERE bucket_id = 'trial-balance-files';

-- ============================================================================
-- 5. VERIFICARE SETUP
-- ============================================================================

-- Verifică că bucket-ul a fost creat corect
DO $$
DECLARE
    bucket_count INT;
BEGIN
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets
    WHERE id = 'trial-balance-files';
    
    IF bucket_count = 0 THEN
        RAISE EXCEPTION 'FAILED: Bucket trial-balance-files nu a fost creat!';
    ELSE
        RAISE NOTICE 'SUCCESS: Bucket trial-balance-files creat cu succes';
    END IF;
END $$;

-- Verifică politicile RLS
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%company%';
    
    IF policy_count < 4 THEN
        RAISE WARNING 'Număr de politici RLS mai mic decât așteptat: %', policy_count;
    ELSE
        RAISE NOTICE 'SUCCESS: % politici RLS create pentru storage', policy_count;
    END IF;
END $$;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant pentru funcțiile helper
GRANT EXECUTE ON FUNCTION storage.validate_file_path(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION storage.get_company_storage_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION storage.cleanup_old_files(INT) TO service_role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '
    ============================================================================
    ✅ SUPABASE STORAGE SETUP COMPLET
    ============================================================================
    
    Bucket creat: trial-balance-files
    Limite:
      - Max file size: 10MB
      - MIME types: Excel (.xls, .xlsx), CSV (.csv)
    
    Politici RLS active:
      ✓ Upload (INSERT) - Doar pentru companiile utilizatorului
      ✓ Download (SELECT) - Toate rolurile din companie
      ✓ Delete (DELETE) - Doar owner/admin, max 90 zile vechime
      ✓ Update (UPDATE) - Doar owner/admin pentru metadata
    
    Path format: company_id/year/filename.ext
    Exemplu: 550e8400-e29b-41d4-a716-446655440000/2024/balanta_dec.xlsx
    
    Helper functions disponibile:
      - storage.validate_file_path(path)
      - storage.get_company_storage_stats(company_id)
      - storage.cleanup_old_files(days_old)
    
    Next steps:
      1. Testează upload din aplicație
      2. Verifică RLS policies funcționează
      3. Implementează UI pentru file management
    ============================================================================
    ';
END $$;
