CREATE DATABASE IF NOT EXISTS brochify;
USE brochify;

CREATE TABLE IF NOT EXISTS users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(64) NOT NULL UNIQUE,
	password VARCHAR(255) NULL,
	password_hash VARCHAR(255) NULL,
	role ENUM('admin', 'faculty') NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_password := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
);
SET @sql_password := IF(@has_password = 0, 'ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER username', 'SELECT 1');
PREPARE stmt_password FROM @sql_password;
EXECUTE stmt_password;
DEALLOCATE PREPARE stmt_password;

SET @has_password_hash := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'
);
SET @sql_password_hash := IF(@has_password_hash = 0, 'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER password', 'SELECT 1');
PREPARE stmt_password_hash FROM @sql_password_hash;
EXECUTE stmt_password_hash;
DEALLOCATE PREPARE stmt_password_hash;

SET @has_created_at := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at'
);
SET @sql_created_at := IF(@has_created_at = 0, 'ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE stmt_created_at FROM @sql_created_at;
EXECUTE stmt_created_at;
DEALLOCATE PREPARE stmt_created_at;

UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;
UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS brochures (
	id INT AUTO_INCREMENT PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	content JSON NOT NULL,
	created_by INT NOT NULL,
	assigned_admin INT NOT NULL,
	status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
	rejection_reason TEXT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_brochures_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT fk_brochures_assigned_admin FOREIGN KEY (assigned_admin) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_brochures_status (status),
	INDEX idx_brochures_created_by (created_by),
	INDEX idx_brochures_assigned_admin (assigned_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @has_rejection_reason := (
	SELECT COUNT(*)
	FROM information_schema.COLUMNS
	WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brochures' AND COLUMN_NAME = 'rejection_reason'
);
SET @sql_rejection_reason := IF(@has_rejection_reason = 0, 'ALTER TABLE brochures ADD COLUMN rejection_reason TEXT NULL AFTER status', 'SELECT 1');
PREPARE stmt_rejection_reason FROM @sql_rejection_reason;
EXECUTE stmt_rejection_reason;
DEALLOCATE PREPARE stmt_rejection_reason;

INSERT INTO users (username, password, password_hash, role)
VALUES
	('admin', '$2b$10$FMi6KerWONY7CfnPEcY0Lu6dgy8IVBmCKQ9obvT9QN/YBoTzmNZYu', '$2b$10$FMi6KerWONY7CfnPEcY0Lu6dgy8IVBmCKQ9obvT9QN/YBoTzmNZYu', 'admin'),
	('faculty', '$2b$10$xTf/xtgNUJWGy9hnaCP03OVCuh1lLhojpFY4l7b8cb.GrzroNrxIe', '$2b$10$xTf/xtgNUJWGy9hnaCP03OVCuh1lLhojpFY4l7b8cb.GrzroNrxIe', 'faculty')
ON DUPLICATE KEY UPDATE
	password = VALUES(password),
	password_hash = VALUES(password_hash),
	role = VALUES(role);