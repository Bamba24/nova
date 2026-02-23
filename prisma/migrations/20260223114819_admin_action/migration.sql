/*
  Warnings:

  - The values [SLOT_MODIFY] on the enum `AdminAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AdminAction_new" AS ENUM ('USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'ROLE_CHANGE', 'PLANNING_DELETE', 'PLANNING_CREATE', 'SLOT_CREATE', 'SLOT_DELETE');
ALTER TABLE "admin_log" ALTER COLUMN "action" TYPE "AdminAction_new" USING ("action"::text::"AdminAction_new");
ALTER TYPE "AdminAction" RENAME TO "AdminAction_old";
ALTER TYPE "AdminAction_new" RENAME TO "AdminAction";
DROP TYPE "AdminAction_old";
COMMIT;
