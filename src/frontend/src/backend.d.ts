import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type FolderName = string;
export interface Type {
    name: FolderName;
    documentCount: bigint;
}
export type Time = bigint;
export type DocumentId = string;
export interface Document {
    id: DocumentId;
    owner: Principal;
    blob: ExternalBlob;
    name: string;
    createdAt: Time;
    folderName: FolderName;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDocument(name: string, folderName: FolderName, blob: ExternalBlob): Promise<DocumentId>;
    createFolder(name: FolderName): Promise<void>;
    deleteDocument(id: DocumentId): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listFolders(): Promise<Array<Type>>;
    listUserDocuments(): Promise<Array<Document>>;
    moveDocument(id: DocumentId, newFolder: FolderName): Promise<void>;
    renameDocument(id: DocumentId, newName: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
