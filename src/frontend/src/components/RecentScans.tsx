import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Download, FileText } from "lucide-react";
import { useMemo } from "react";
import { useListDocuments } from "../hooks/useDocuments";

const SKELETON_KEYS = ["rs-a", "rs-b", "rs-c", "rs-d", "rs-e"];

function formatDate(createdAt: bigint): string {
  const ms = Number(createdAt) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecentScans() {
  const { data: docs = [], isLoading } = useListDocuments();

  const recent = useMemo(
    () =>
      [...docs]
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, 10),
    [docs],
  );

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          Recently Scanned
        </h2>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="w-32 h-24 rounded-xl shrink-0" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div
          data-ocid="recent.empty_state"
          className="text-sm text-muted-foreground py-4"
        >
          No recent scans
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {recent.map((doc, i) => (
            <button
              key={doc.id}
              type="button"
              data-ocid={`recent.item.${i + 1}`}
              className="w-32 shrink-0 bg-card border border-border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer group text-left"
              onClick={() => window.open(doc.blob.getDirectURL(), "_blank")}
            >
              <div className="w-full h-14 bg-muted rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-primary/40" />
              </div>
              <p className="text-xs font-semibold text-card-foreground truncate">
                {doc.name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">
                  {formatDate(doc.createdAt)}
                </p>
                <Download className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
