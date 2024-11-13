-- AddForeignKey
ALTER TABLE "client_log" ADD CONSTRAINT "client_log_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
