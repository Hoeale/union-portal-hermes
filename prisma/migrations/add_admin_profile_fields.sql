-- 添加管理员个人资料字段
-- 执行时间: 2026-06-18

-- 添加 nickname 字段
ALTER TABLE `admins` ADD COLUMN `nickname` VARCHAR(100) NULL COMMENT '昵称' AFTER `permissions`;

-- 添加 avatar 字段
ALTER TABLE `admins` ADD COLUMN `avatar` TEXT NULL COMMENT '头像URL' AFTER `nickname`;

-- 添加 bio 字段
ALTER TABLE `admins` ADD COLUMN `bio` TEXT NULL COMMENT '简介' AFTER `avatar`;

-- 添加 updatedAt 字段
ALTER TABLE `admins` ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- 添加 updatedAt 自动更新触发器
DELIMITER //
CREATE TRIGGER `admins_before_update` BEFORE UPDATE ON `admins`
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END//
DELIMITER ;

-- 修改 role 默认值
ALTER TABLE `admins` ALTER COLUMN `role` SET DEFAULT 'admin';

-- 验证更改
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'union_portal' 
  AND TABLE_NAME = 'admins'
ORDER BY ORDINAL_POSITION;
