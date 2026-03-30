import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Folder, FolderPlus } from "lucide-react";
import { useState } from "react";
import { useCreateFolder, useListFolders } from "../hooks/useDocuments";

const SKELETON_KEYS = ["fsk-a", "fsk-b", "fsk-c", "fsk-d"];

interface FoldersViewProps {
  onFolderSelect: (folder: string) => void;
}

export function FoldersView({ onFolderSelect }: FoldersViewProps) {
  const { data: folders = [], isLoading } = useListFolders();
  const createFolder = useCreateFolder();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const handleCreate = () => {
    if (!folderName.trim()) return;
    createFolder.mutate(folderName.trim(), {
      onSuccess: () => {
        setDialogOpen(false);
        setFolderName("");
      },
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">Folders</h2>
        <Button
          data-ocid="folders.create.open_modal_button"
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div
          data-ocid="folders.empty_state"
          className="text-center py-20 text-muted-foreground"
        >
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No folders yet. Create your first folder!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {folders.map((folder, i) => (
            <button
              key={folder.name}
              type="button"
              data-ocid={`folders.item.${i + 1}`}
              onClick={() => onFolderSelect(folder.name)}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground">
                  {folder.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {String(folder.documentCount)} document
                  {folder.documentCount !== 1n ? "s" : ""}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="folders.create.dialog">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            data-ocid="folders.create.input"
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="folders.create.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="folders.create.submit_button"
              onClick={handleCreate}
              disabled={createFolder.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
