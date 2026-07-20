/** Badge d'état de modération (pending / approved / rejected). */
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-green-100 text-green-800",
    pending: "bg-soul-sand text-soul-brown",
    rejected: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    approved: "En ligne",
    pending: "En relecture",
    rejected: "Refusée",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] ?? styles.pending}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
