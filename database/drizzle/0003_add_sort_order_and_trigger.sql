-- 0003_add_sort_order_and_trigger.sql
-- Adds sort_order column and auto-update trigger (fixed for SQLite)

-- 1. Add sort_order column
ALTER TABLE Collections ADD COLUMN sort_order INTEGER;

-- 2. Populate sort_order for existing rows
UPDATE Collections
SET sort_order = (
  CASE
    WHEN releaseDate IS NOT NULL AND releaseDate != '' THEN
      CAST(REPLACE(releaseDate, '-', '') AS INTEGER)
    
    WHEN season IS NOT NULL AND season != '' THEN
      (CASE 
        WHEN season LIKE 'SS%' THEN CAST('20' || SUBSTR(season, 3) AS INTEGER)
        WHEN season LIKE 'AW%' THEN CAST('20' || SUBSTR(season, 3) AS INTEGER)
        ELSE 2000
      END) * 10000
      +
      (CASE 
        WHEN season LIKE 'SS%' THEN 100
        WHEN season LIKE 'AW%' THEN 200
        ELSE 300
      END)
    
    ELSE 0
  END
);

-- 3. Create index
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON Collections(sort_order);

-- 4. Create trigger for INSERT
CREATE TRIGGER IF NOT EXISTS update_collections_sort_order_insert
AFTER INSERT ON Collections
FOR EACH ROW
BEGIN
  UPDATE Collections
  SET sort_order = (
    CASE
      WHEN NEW.releaseDate IS NOT NULL AND NEW.releaseDate != '' THEN
        CAST(REPLACE(NEW.releaseDate, '-', '') AS INTEGER)
      
      WHEN NEW.season IS NOT NULL AND NEW.season != '' THEN
        (CASE 
          WHEN NEW.season LIKE 'SS%' THEN CAST('20' || SUBSTR(NEW.season, 3) AS INTEGER)
          WHEN NEW.season LIKE 'AW%' THEN CAST('20' || SUBSTR(NEW.season, 3) AS INTEGER)
          ELSE 2000
        END) * 10000
        +
        (CASE 
          WHEN NEW.season LIKE 'SS%' THEN 100
          WHEN NEW.season LIKE 'AW%' THEN 200
          ELSE 300
        END)
      
      ELSE 0
    END
  )
  WHERE id = NEW.id;
END;

-- 5. Create trigger for UPDATE
CREATE TRIGGER IF NOT EXISTS update_collections_sort_order_update
AFTER UPDATE OF releaseDate, season ON Collections
FOR EACH ROW
BEGIN
  UPDATE Collections
  SET sort_order = (
    CASE
      WHEN NEW.releaseDate IS NOT NULL AND NEW.releaseDate != '' THEN
        CAST(REPLACE(NEW.releaseDate, '-', '') AS INTEGER)
      
      WHEN NEW.season IS NOT NULL AND NEW.season != '' THEN
        (CASE 
          WHEN NEW.season LIKE 'SS%' THEN CAST('20' || SUBSTR(NEW.season, 3) AS INTEGER)
          WHEN NEW.season LIKE 'AW%' THEN CAST('20' || SUBSTR(NEW.season, 3) AS INTEGER)
          ELSE 2000
        END) * 10000
        +
        (CASE 
          WHEN NEW.season LIKE 'SS%' THEN 100
          WHEN NEW.season LIKE 'AW%' THEN 200
          ELSE 300
        END)
      
      ELSE 0
    END
  )
  WHERE id = NEW.id;
END;