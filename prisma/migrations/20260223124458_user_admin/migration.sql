-- AddForeignKey
ALTER TABLE "admin_log" ADD CONSTRAINT "admin_log_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
