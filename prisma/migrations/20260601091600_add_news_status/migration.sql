-- AlterTable
ALTER TABLE `news` ADD COLUMN `status` ENUM('pending', 'published') NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX `news_status_idx` ON `news`(`status`);
