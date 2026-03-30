import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { Document } from "../backend";
import { useListDocuments } from "../hooks/useDocuments";
import { DocumentCard } from "./DocumentCard";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

interface DocumentLibraryProps {
  folderFilter?: string;
}

export function DocumentLibrary({ folderFilter }: DocumentLibraryProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const { data: docs = [], isLoading } = useListDocuments();

  const filtered = useMemo(() => {
    let result: Document[] = docs;
    if (folderFilter)
      result = result.filter((d) => d.folderName === folderFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }
    if (sortBy === "date") {
      result = [...result].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt),
      );
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [docs, folderFilter, search, sortBy]);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">
          PDF Document Library
        </h2>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="library.search_input"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "date" | "name")}
        >
          <SelectTrigger
            data-ocid="library.sort.select"
            className="w-40 rounded-full bg-card border-border"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by: Date</SelectItem>
            <SelectItem value="name">Sort by: Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="library.empty_state"
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <Search className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">
            {search
              ? "No documents match your search"
              : "No documents yet. Scan your first document!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc, i) => (
            <DocumentCard key={doc.id} doc={doc} index={i + 1} />
          ))}
        </div>
      )}
    </section>
  );
}
