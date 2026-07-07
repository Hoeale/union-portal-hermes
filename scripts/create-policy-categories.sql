CREATE TABLE IF NOT EXISTS `policy_categories` (
  `_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`_id`),
  UNIQUE INDEX `policy_categories_name_key`(`name`),
  INDEX `policy_categories_is_active_idx`(`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入从实际政策数据中提取的分类
INSERT INTO `policy_categories` (`_id`, `name`, `order_index`, `is_active`) 
VALUES 
  (UUID(), '公示公告', 0, 1),
  (UUID(), '权益保障', 1, 1),
  (UUID(), '社会保障', 2, 1);
