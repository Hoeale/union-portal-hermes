-- 迁移：将 services 表的 process 和 requirements 字段改为可选
-- 兼容 MySQL 5.7+ 和 8.0
-- 执行时间：2026-07-06

-- 修改 process 字段为可选（允许 NULL）
ALTER TABLE services MODIFY COLUMN process TEXT NULL;

-- 修改 requirements 字段为可选（允许 NULL）
ALTER TABLE services MODIFY COLUMN requirements TEXT NULL;
