-- Add AI Knowledge Base to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS ai_knowledge_base text;

COMMENT ON COLUMN tenants.ai_knowledge_base IS 'Document/knowledge base for AI to learn about active projects and general company information';
