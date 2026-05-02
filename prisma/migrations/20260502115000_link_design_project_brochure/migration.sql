ALTER TABLE `design_projects`
  ADD COLUMN `brochure_id` INTEGER NULL;

CREATE UNIQUE INDEX `design_projects_brochure_id_key` ON `design_projects`(`brochure_id`);

ALTER TABLE `design_projects`
  ADD CONSTRAINT `design_projects_brochure_id_fkey`
  FOREIGN KEY (`brochure_id`) REFERENCES `brochures`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
