-- Add partner_id column to journal_entries table for counterparty tracking
ALTER TABLE journal_entries 
ADD COLUMN partner_id UUID REFERENCES partners(id);

-- Create index for better performance when querying by partner
CREATE INDEX idx_journal_entries_partner_id ON journal_entries(partner_id);

-- Create index for compound queries with legal entity and partner
CREATE INDEX idx_journal_entries_legal_entity_partner ON journal_entries(legal_entity_id, partner_id);

-- Add comment explaining the purpose
COMMENT ON COLUMN journal_entries.partner_id IS 'Reference to counterparty partner for subledger tracking'; 