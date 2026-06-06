ALTER TABLE course ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(10) NOT NULL DEFAULT 'RELATIVE';

-- 체육, 음악, 미술, 한국사 → 절대평가
UPDATE course SET evaluation_type = 'ABSOLUTE'
WHERE course_name IN ('체육', '음악', '미술', '한국사');
