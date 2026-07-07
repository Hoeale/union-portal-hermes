-- AlterTable
ALTER TABLE `policies` ADD COLUMN `enable_download` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `file_name` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `services` ADD COLUMN `enable_download` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `file_name` VARCHAR(500) NULL,
    ADD COLUMN `file_url` TEXT NULL;
