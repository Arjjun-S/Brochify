-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL,
    `password` VARCHAR(255) NULL,
    `password_hash` VARCHAR(255) NULL,
    `role` ENUM('admin', 'faculty') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brochures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `content` JSON NOT NULL,
    `created_by` INTEGER NOT NULL,
    `assigned_admin` INTEGER NOT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `brochures_status_idx`(`status`),
    INDEX `brochures_created_by_idx`(`created_by`),
    INDEX `brochures_assigned_admin_idx`(`assigned_admin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `content` JSON NOT NULL,
    `created_by` INTEGER NOT NULL,
    `assigned_admin` INTEGER NOT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    `rejection_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `certificates_status_idx`(`status`),
    INDEX `certificates_created_by_idx`(`created_by`),
    INDEX `certificates_assigned_admin_idx`(`assigned_admin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `brochures` ADD CONSTRAINT `brochures_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brochures` ADD CONSTRAINT `brochures_assigned_admin_fkey` FOREIGN KEY (`assigned_admin`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_assigned_admin_fkey` FOREIGN KEY (`assigned_admin`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

