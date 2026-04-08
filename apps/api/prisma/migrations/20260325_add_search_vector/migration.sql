-- Add full-text search vector column to member_profiles
ALTER TABLE "member_profiles" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Populate the search vector from existing data
UPDATE "member_profiles" SET "search_vector" =
  setweight(to_tsvector('english', coalesce("first_name", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("last_name", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("display_name", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("religion", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("profession", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("education_level", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("current_city", '')), 'C') ||
  setweight(to_tsvector('english', coalesce("home_district", '')), 'C') ||
  setweight(to_tsvector('english', coalesce("about_me", '')), 'D');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "idx_member_profiles_search_vector" ON "member_profiles" USING GIN ("search_vector");

-- Create trigram index on display_name for fuzzy name search
CREATE INDEX IF NOT EXISTS "idx_member_profiles_display_name_trgm" ON "member_profiles" USING GIN ("display_name" gin_trgm_ops);

-- Create a trigger to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_member_profile_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.religion, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.profession, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.education_level, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.current_city, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.home_district, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.about_me, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_member_profile_search_vector ON "member_profiles";
CREATE TRIGGER trg_member_profile_search_vector
  BEFORE INSERT OR UPDATE OF "first_name", "last_name", "display_name", "religion", "profession", "education_level", "current_city", "home_district", "about_me"
  ON "member_profiles"
  FOR EACH ROW
  EXECUTE FUNCTION update_member_profile_search_vector();
