-- Add new fields to deals table
ALTER TABLE deals 
ADD COLUMN deal_type VARCHAR(20) NOT NULL DEFAULT 'service',
ADD COLUMN total_amount BIGINT NOT NULL DEFAULT 0,
ADD COLUMN paid_amount BIGINT NOT NULL DEFAULT 0,
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft';

-- Change description column to TEXT
ALTER TABLE deals ALTER COLUMN description TYPE TEXT;

-- Create deal_journal_entries junction table
CREATE TABLE deal_journal_entries (
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (deal_id, journal_entry_id)
);

-- Add indexes for better performance
CREATE INDEX idx_deals_deal_type ON deals(deal_type);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_legal_entity_id ON deals(legal_entity_id);
CREATE INDEX idx_deal_journal_entries_deal_id ON deal_journal_entries(deal_id);
CREATE INDEX idx_deal_journal_entries_journal_entry_id ON deal_journal_entries(journal_entry_id);
CREATE INDEX idx_deal_journal_entries_entry_type ON deal_journal_entries(entry_type); 