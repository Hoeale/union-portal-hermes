-- AlterTable
ALTER TABLE `policies` ADD COLUMN `status` ENUM('pending', 'published') NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX `policies_status_idx` ON `policies`(`status`);
