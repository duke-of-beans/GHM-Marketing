-- AlterTable
ALTER TABLE "task_checklist_templates" ADD COLUMN     "description" TEXT,
ALTER COLUMN "category" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "recurring_task_rules" ADD CONSTRAINT "recurring_task_rules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_task_rules" ADD CONSTRAINT "recurring_task_rules_checklist_template_id_fkey" FOREIGN KEY ("checklist_template_id") REFERENCES "task_checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
