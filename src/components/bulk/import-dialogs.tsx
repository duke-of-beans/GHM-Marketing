"use client";
import { BulkImportDialog } from "./bulk-import-dialog";

// ── Client Import ────────────────────────────────────────────────────────────
export function ClientImportDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  return (
    <BulkImportDialog
      open={open} onClose={onClose} onSuccess={onSuccess}
      endpoint="/api/clients/import"
      title="Import Existing Clients"
      description="Upload a CSV or Excel file to bulk-import an existing client list. Each row creates a Lead + Client record. Duplicate phones are skipped."
      templateColumns={["business_name*","email","phone","website","address","city","state","zip","retainer_amount","status","sales_rep_email","manager_email","onboarded_at","report_day"]}
      templateFilename="client-import-template.csv"
      maxRows={500}
    />
  );
}

// ── User / Contractor Import ─────────────────────────────────────────────────
export function UserImportDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  return (
    <BulkImportDialog
      open={open} onClose={onClose} onSuccess={onSuccess}
      endpoint="/api/users/import"
      title="Import Team Members"
      description="Upload a CSV or Excel file to create multiple user accounts at once. Temp passwords are shown after import — copy them before closing."
      templateColumns={["name*","email*","role*","position_name","territory_id","contractor_entity","contractor_email","temp_password"]}
      templateFilename="user-import-template.csv"
      maxRows={100}
    />
  );
}
