-- AlterTable
ALTER TABLE `news` MODIFY `category` VARCHAR(50) NOT NULL;

-- CreateTable
CREATE TABLE `news_categories` (
    `_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(20) NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `news_categories_name_key`(`name`),
    UNIQUE INDEX `news_categories_slug_key`(`slug`),
    INDEX `news_categories_isActive_idx`(`isActive`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedbacks` (
    `_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `contact` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedbacks_is_read_idx`(`is_read`),
    INDEX `feedbacks_created_at_idx`(`created_at` DESC),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drafts` (
    `_id` VARCHAR(36) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `image_url` TEXT NULL,
    `file_url` TEXT NULL,
    `source` VARCHAR(200) NULL,
    `publish_date` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `drafts_type_idx`(`type`),
    INDEX `drafts_created_at_idx`(`created_at` DESC),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
