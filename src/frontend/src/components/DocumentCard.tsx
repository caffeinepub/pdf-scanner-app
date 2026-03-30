import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileText,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Document } from "../backend";
import { useDeleteDocument, useRenameDocument } from "../hooks/useDocuments";

interface DocumentCardProps {
  doc: Document;
  index: number;
}

function formatDate(createdAt: bigint): string {
  const ms = Number(createdAt) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DocumentCard({ doc, index }: DocumentCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(doc.name);
  const deleteMut = useDeleteDocument();
  const renameMut = useRenameDocument();

  const handleDownload = () => {
    const url = doc.blob.getDirectURL();
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
  };

  const handleRename = () => {
    renameMut.mutate(
      { id: doc.id, name: newName },
      { onSuccess: () => setRenameOpen(false) },
    );
  };

  return (
    <>
      <div
        data-ocid={`library.item.${index}`}
        className="bg-card border border-border rounded-xl p-4 shadow-card hover:shadow-md transition-shadow group"
      >
        <div className="w-full aspect-[4/3] bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
          <FileText className="w-10 h-10 text-primary/40" />
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold bg-red-50 text-red-600 border-red-100 dark:bg-red-950 dark:text-red-400"
            >
              PDF
            </Badge>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-card-foreground truncate">
              {doc.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(doc.createdAt)}
            </p>
            {doc.folderName && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <FolderOpen className="w-3 h-3" />
                {doc.folderName}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-ocid={`library.dropdown_menu.${index}`}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setNewName(doc.name);
                  setRenameOpen(true);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                data-ocid={`library.delete_button.${index}`}
                className="text-destructive focus:text-destructive"
                onClick={() => deleteMut.mutate(doc.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-[11px] text-muted-foreground">Synced</span>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent data-ocid="library.rename.dialog">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <Input
            data-ocid="library.rename.input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="library.rename.cancel_button"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="library.rename.save_button"
              onClick={handleRename}
              disabled={renameMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
