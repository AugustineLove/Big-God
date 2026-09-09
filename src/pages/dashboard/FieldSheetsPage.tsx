import { useSearchParams } from "react-router-dom";
import { userPermissions } from "../../constants/appConstants";
import FieldEntrySheet from "./Components/FieldEntrySheet";
import EntryBatchApprovals from "./EntryBatchApprovals";

const can = (permission: string) => !!userPermissions?.[permission];

export default function FieldSheetsPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  const resolvedTab =
    tab === "approvals" && can("FIELD_SHEET_APPROVE") ? "approvals" :
    tab === "entry" && can("FIELD_SHEET_ENTRY") ? "entry" :
    can("FIELD_SHEET_ENTRY") ? "entry" :
    can("FIELD_SHEET_APPROVE") ? "approvals" :
    null;

  if (!resolvedTab) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center text-[13px] text-[var(--ink-faint)]">
        You don't have access to field sheets.
      </div>
    );
  }

  return resolvedTab === "entry" ? <FieldEntrySheet /> : <EntryBatchApprovals />;
}
