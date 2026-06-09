-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL,
    `password` VARCHAR(255) NULL,
    `password_hash` VARCHAR(255) NULL,
    `role` ENUM('admin', 'faculty') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `cloudinary_url` VARCHAR(512) NOT NULL,
    `cloudinary_public_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `design_projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `json` LONGTEXT NOT NULL,
    `width` INTEGER NOT NULL DEFAULT 900,
    `height` INTEGER NOT NULL DEFAULT 1200,
    `thumbnail_url` VARCHAR(512) NULL,
    `is_template` BOOLEAN NOT NULL DEFAULT false,
    `is_pro` BOOLEAN NOT NULL DEFAULT false,
    `brochure_id` INTEGER NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_username_key` ON `users`(`username`);

-- CreateIndex
CREATE INDEX `brochures_status_idx` ON `brochures`(`status`);

-- CreateIndex
CREATE INDEX `brochures_created_by_idx` ON `brochures`(`created_by`);

-- CreateIndex
CREATE INDEX `brochures_assigned_admin_idx` ON `brochures`(`assigned_admin`);

-- CreateIndex
CREATE INDEX `certificates_status_idx` ON `certificates`(`status`);

-- CreateIndex
CREATE INDEX `certificates_created_by_idx` ON `certificates`(`created_by`);

-- CreateIndex
CREATE INDEX `certificates_assigned_admin_idx` ON `certificates`(`assigned_admin`);

-- CreateIndex
CREATE INDEX `assets_type_idx` ON `assets`(`type`);

-- CreateIndex
CREATE UNIQUE INDEX `design_projects_brochure_id_key` ON `design_projects`(`brochure_id`);

-- CreateIndex
CREATE INDEX `design_projects_created_by_idx` ON `design_projects`(`created_by`);

-- CreateIndex
CREATE INDEX `design_projects_is_template_idx` ON `design_projects`(`is_template`);

-- AddForeignKey
ALTER TABLE `brochures` ADD CONSTRAINT `brochures_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brochures` ADD CONSTRAINT `brochures_assigned_admin_fkey` FOREIGN KEY (`assigned_admin`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_assigned_admin_fkey` FOREIGN KEY (`assigned_admin`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `design_projects` ADD CONSTRAINT `design_projects_brochure_id_fkey` FOREIGN KEY (`brochure_id`) REFERENCES `brochures`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `design_projects` ADD CONSTRAINT `design_projects_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;