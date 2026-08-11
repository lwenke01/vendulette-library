-- Migration: 0005_create_design_images
-- Creates DesignImages table for normalized image storage

CREATE TABLE IF NOT EXISTS DesignImages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season TEXT,
    collection_id INTEGER NOT NULL,
    design_id INTEGER NOT NULL,
    storage_key TEXT,
    public_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bytes INTEGER,
    FOREIGN KEY (design_id) REFERENCES Designs(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES Collections(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_design_images_design ON DesignImages(design_id);
CREATE INDEX IF NOT EXISTS idx_design_images_collection ON DesignImages(collection_id);
CREATE INDEX IF NOT EXISTS idx_design_images_primary ON DesignImages(is_primary);
CREATE INDEX IF NOT EXISTS idx_design_images_sort ON DesignImages(sort_order);

-- ─────────────────────────────────────────────────────────────
-- Rollback instructions (manual)
-- ─────────────────────────────────────────────────────────────
-- DROP INDEX IF EXISTS idx_design_images_sort;
-- DROP INDEX IF EXISTS idx_design_images_primary;
-- DROP INDEX IF EXISTS idx_design_images_collection;
-- DROP INDEX IF EXISTS idx_design_images_design;
-- DROP TABLE IF EXISTS DesignImages;