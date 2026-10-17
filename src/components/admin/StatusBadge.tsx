const styles: Record<string, string> = {
  DRAFT: "bg-line text-ink/75",
  PENDING_REVIEW: "bg-orange/20 text-orange-deep",
  PUBLISHED: "bg-[#1f9d5c]/15 text-[#1f7a4a]",
};

const labels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  PUBLISHED: "Published",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status] ?? "bg-line text-ink/70"}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] ?? status}
    </span>
  );
}
