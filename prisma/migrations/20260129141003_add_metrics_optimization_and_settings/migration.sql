-- AlterTable ServerMetrics - Add aggregation fields
ALTER TABLE `ServerMetrics` ADD COLUMN `isAggregated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `aggregationPeriod` VARCHAR(191) NULL;

-- CreateIndex for ServerMetrics optimization
CREATE INDEX `ServerMetrics_timestamp_isAggregated_idx` ON `ServerMetrics`(`timestamp`, `isAggregated`);

-- CreateIndex for ServerMetrics aggregation queries
CREATE INDEX `ServerMetrics_isAggregated_aggregationPeriod_idx` ON `ServerMetrics`(`isAggregated`, `aggregationPeriod`);

-- CreateTable Settings
CREATE TABLE `Settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Settings_key_key`(`key`),
    INDEX `Settings_category_idx`(`category`),
    INDEX `Settings_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
