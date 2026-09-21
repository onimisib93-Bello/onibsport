const styles: Record<string, string> = {
  DRAFT: "bg-line text-ink/70",
  PENDING_REVIEW: "bg-orange/15 text-orange",
  PUBLISHED: "bg-sky/15 text-sky-dark",
};

const labels: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  PUBLISHED: "Published",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? "bg-line text-ink/70"}`}>
      {labels[status] ?? status}
    </span>
  );
}
