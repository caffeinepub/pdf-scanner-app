import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type Document,
  ExternalBlob,
  type FolderName,
  type UserProfile,
  type UserRole,
} from "../backend";
import { useActor } from "./useActor";

export function useListDocuments() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUserDocuments();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListFolders() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Array<{ name: string; documentCount: bigint }>>({
    queryKey: ["folders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFolders();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["currentUserRole"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile saved");
    },
    onError: () => toast.error("Failed to save profile"),
  });
}

export function useCreateDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      folderName,
      bytes,
      onProgress,
    }: {
      name: string;
      folderName: FolderName;
      bytes: Uint8Array<ArrayBufferLike>;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not available");
      let blob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      if (onProgress) blob = blob.withUploadProgress(onProgress);
      return actor.createDocument(name, folderName, blob);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document saved");
    },
    onError: () => toast.error("Failed to save document"),
  });
}

export function useDeleteDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteDocument(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Failed to delete document"),
  });
}

export function useRenameDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.renameDocument(id, name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document renamed");
    },
    onError: () => toast.error("Failed to rename document"),
  });
}

export function useMoveDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      folderName,
    }: { id: string; folderName: FolderName }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.moveDocument(id, folderName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document moved");
    },
    onError: () => toast.error("Failed to move document"),
  });
}

export function useCreateFolder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: FolderName) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createFolder(name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder created");
    },
    onError: () => toast.error("Failed to create folder"),
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: { principal: any; role: UserRole }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.assignCallerUserRole(principal, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserRole"] });
    },
  });
}
