-- Add public sharing capability to deals table
ALTER TABLE deals
ADD COLUMN is_public BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN public_share_token VARCHAR(64) UNIQUE;

-- Create index for public share token lookups
CREATE INDEX idx_deals_public_share_token ON deals(public_share_token);

-- Add comments explaining the purpose
COMMENT ON COLUMN deals.is_public IS 'Indicates whether this deal can be accessed via public share link';
COMMENT ON COLUMN deals.public_share_token IS 'Unique token for accessing deal preview publicly without authentication';
