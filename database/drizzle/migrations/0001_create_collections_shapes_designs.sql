CREATE TABLE IF NOT EXISTS Collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    season TEXT,
    series TEXT,
    edition TEXT,
    release_year INTEGER,
    themes TEXT,
    colours TEXT,
    "name_friendly" TEXT,
    "type" TEXT,
    "image_urls" TEXT,
    releaseDate TEXT,
    exclusive TEXT
);

CREATE TABLE IF NOT EXISTS Shapes (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    measurements TEXT,
    category TEXT,
    name_friendly TEXT,
    size TEXT,
    description TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS Shapes_name_unique
ON Shapes (name);

CREATE TABLE IF NOT EXISTS Designs (
    id INTEGER PRIMARY KEY NOT NULL,
    collection_id INTEGER NOT NULL,
    shape_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    image_urls TEXT,
    price REAL,
    shape_name_overwrite TEXT, 
    shape_measurements_overwrite TEXT,
    shape_size_overwrite TEXT, 
    shape_details_overwrite TEXT, 
    exclusive_design TEXT, 
    main_colour TEXT, 
    product_id TEXT,
    sku TEXT,
    last_updated_at TEXT,
    currency TEXT DEFAULT 'GBP', 
    season TEXT, 
    FOREIGN KEY (collection_id) REFERENCES Collections(id) ON DELETE CASCADE,
    FOREIGN KEY (shape_id) REFERENCES Shapes(id) ON DELETE SET NULL
);

-- Create seasons table to hold seasonal collections with image arrays
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- e.g., "Spring", "Autumn", "Holiday"
  year INTEGER NOT NULL,           -- e.g., 2024, 2025
  images TEXT NOT NULL DEFAULT '[]',  -- JSON array of image URLs/IDs from R2
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add season reference to collections table
ALTER TABLE collections ADD COLUMN season_id INTEGER REFERENCES seasons(id);

-- Create index for faster lookups by season
CREATE INDEX IF NOT EXISTS idx_collections_season ON collections(season_id);

-- Optional: Seed some example seasons (remove if not needed)
-- INSERT INTO seasons (name, year, images) VALUES
--   ('Spring', 2024, '[]'),
--   ('Autumn', 2024, '[]'),
--   ('Holiday', 2024, '[]');