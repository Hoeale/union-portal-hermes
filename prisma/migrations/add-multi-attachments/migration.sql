-- 添加多附件支持字段到 policies 表和 services 表
-- 执行时间：部署时
-- 兼容 MySQL 5.7+ 和 MySQL 8.0

-- ============================================
-- policies 表
-- ============================================

-- 检查并添加 file_urls 字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'file_urls');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `policies` ADD COLUMN `file_urls` TEXT NULL COMMENT ''JSON array for multiple attachment URLs''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 file_names 字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'policies' AND COLUMN_NAME = 'file_names');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `policies` ADD COLUMN `file_names` TEXT NULL COMMENT ''JSON array for multiple attachment names''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为现有数据初始化：将 file_url 和 file_name 转换为 JSON 数组
UPDATE `policies` 
SET `file_urls` = CONCAT('["', `file_url`, '"]'),
    `file_names` = CONCAT('["', `file_name`, '"]')
WHERE `file_url` IS NOT NULL AND `file_url` != '' AND `file_urls` IS NULL;

-- ============================================
-- services 表
-- ============================================

-- 检查并添加 file_urls 字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'file_urls');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `services` ADD COLUMN `file_urls` TEXT NULL COMMENT ''JSON array for multiple attachment URLs''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 file_names 字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'file_names');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `services` ADD COLUMN `file_names` TEXT NULL COMMENT ''JSON array for multiple attachment names''', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为现有数据初始化：将 file_url 和 file_name 转换为 JSON 数组
UPDATE `services` 
SET `file_urls` = CONCAT('["', `file_url`, '"]'),
    `file_names` = CONCAT('["', `file_name`, '"]')
WHERE `file_url` IS NOT NULL AND `file_url` != '' AND `file_urls` IS NULL;
