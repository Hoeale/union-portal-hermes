-- CreateTable
CREATE TABLE `news` (
    `_id` VARCHAR(36) NOT NULL,
    `title` TEXT NOT NULL,
    `category` VARCHAR(20) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `image_url` TEXT NULL,
    `is_carousel` BOOLEAN NOT NULL DEFAULT false,
    `carousel_order` INTEGER NULL,
    `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `news_category_idx`(`category`),
    INDEX `news_published_at_idx`(`published_at` DESC),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carousel_items` (
    `_id` VARCHAR(36) NOT NULL,
    `news_id` VARCHAR(36) NOT NULL,
    `display_order` INTEGER NOT NULL,
    `image_url` TEXT NOT NULL,
    `title` TEXT NOT NULL,

    UNIQUE INDEX `carousel_items_display_order_key`(`display_order`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friendly_links` (
    `_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `order_index` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `_id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admins_username_key`(`username`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
