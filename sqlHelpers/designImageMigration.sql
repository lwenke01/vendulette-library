-- 1) Create child table
CREATE TABLE DesignImages (
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
    FOREIGN KEY (design_id) REFERENCES Designs(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES Designs(collection_id) ON DELETE CASCADE
);


-- 2) Helpful index
CREATE INDEX idx_design_images_design_id
ON DesignImages(design_id, sort_order);

-- 3) Backfill from image_urls when image_urls is a JSON array of URL strings
INSERT INTO DesignImages (
    season,
    collection_id,
    design_id,
    storage_key,
    public_url,
    alt_text,
    sort_order,
    is_primary
)
SELECT
    d.season,
    d.collection_id AS collection_id,
    d.id AS design_id,
    NULL AS storage_key,
    je.value AS public_url,
    NULL AS alt_text,
    CAST(je.key AS INTEGER) AS sort_order,
    CASE WHEN CAST(je.key AS INTEGER) = 0 THEN 1 ELSE 0 END AS is_primary
FROM Designs d,
     json_each(d.image_urls) AS je
WHERE d.image_urls IS NOT NULL
  AND trim(d.image_urls) <> ''
  AND json_valid(d.image_urls);

-- 4) Optional: keep old column for rollback period, or later remove/ignore it