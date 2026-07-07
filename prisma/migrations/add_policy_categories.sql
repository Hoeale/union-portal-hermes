-- CreateTable
CREATE TABLE `policy_categories` (
    `_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `policy_categories_name_key`(`name`),
    INDEX `policy_categories_is_active_idx`(`is_active`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 初始化政策分类数据
INSERT INTO `policy_categories` (`_id`, `name`, `order_index`, `is_active`) VALUES
  (UUID(), '权益保障', 0, true),
  (UUID(), '劳动法规', 1, true),
  (UUID(), '社会保障', 2, true),
  (UUID(), '安全生产', 3, true),
  (UUID(), '福利待遇', 4, true),
  (UUID(), '奖励待遇', 5, true),
  (UUID(), '其他', 6, true);
