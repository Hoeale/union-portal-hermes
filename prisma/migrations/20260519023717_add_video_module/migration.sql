-- CreateTable
CREATE TABLE `videos` (
    `_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `source_type` VARCHAR(20) NOT NULL,
    `video_url` TEXT NOT NULL,
    `thumbnail_url` TEXT NULL,
    `duration` INTEGER NULL,
    `file_size` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `videos_category_idx`(`category`),
    INDEX `videos_is_active_idx`(`is_active`),
    INDEX `videos_created_at_idx`(`created_at` DESC),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
