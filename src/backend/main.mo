import Time "mo:core/Time";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // Core components
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  type DocumentId = Text;
  type FolderName = Text;

  type Document = {
    id : DocumentId;
    name : Text;
    folderName : FolderName;
    createdAt : Time.Time;
    owner : Principal;
    blob : Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
  };

  module FolderDTO {
    public type Type = {
      name : FolderName;
      documentCount : Nat;
    };

    public func fromFolder(folderName : FolderName, docs : [Document]) : Type {
      {
        name = folderName;
        documentCount = docs.size();
      };
    };
  };

  // Persistent data
  let documents = Map.empty<DocumentId, Document>();
  let folderNames = Set.empty<FolderName>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Create new document
  public shared ({ caller }) func createDocument(name : Text, folderName : FolderName, blob : Storage.ExternalBlob) : async DocumentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create documents");
    };

    let id = name.concat(Time.now().toText());
    let document : Document = {
      id;
      name;
      folderName;
      createdAt = Time.now();
      owner = caller;
      blob;
    };

    documents.add(id, document);
    folderNames.add(folderName);
    id;
  };

  // List all documents for current user
  public query ({ caller }) func listUserDocuments() : async [Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list documents");
    };

    documents.values().toArray().filter(func(doc) { doc.owner == caller });
  };

  // Rename document
  public shared ({ caller }) func renameDocument(id : DocumentId, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can rename documents");
    };

    let document = switch (documents.get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?doc) { doc };
    };

    if (document.owner != caller) {
      Runtime.trap("Unauthorized: You do not own this document");
    };

    let updatedDoc : Document = {
      id = document.id;
      name = newName;
      folderName = document.folderName;
      createdAt = document.createdAt;
      owner = document.owner;
      blob = document.blob;
    };

    documents.add(id, updatedDoc);
  };

  // Delete document
  public shared ({ caller }) func deleteDocument(id : DocumentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete documents");
    };

    let document = switch (documents.get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?doc) { doc };
    };

    if (document.owner != caller) {
      Runtime.trap("Unauthorized: You do not own this document");
    };

    documents.remove(id);
  };

  // List all folders with document counts
  public query ({ caller }) func listFolders() : async [FolderDTO.Type] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list folders");
    };

    folderNames.toArray().map(
      func(folderName) {
        let docs = documents.values().toArray().filter(
          func(doc) { doc.owner == caller and doc.folderName == folderName }
        );
        FolderDTO.fromFolder(folderName, docs);
      }
    );
  };

  // Create new folder
  public shared ({ caller }) func createFolder(name : FolderName) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create folders");
    };

    folderNames.add(name);
  };

  // Move document to different folder
  public shared ({ caller }) func moveDocument(id : DocumentId, newFolder : FolderName) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can move documents");
    };

    let document = switch (documents.get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?doc) { doc };
    };

    if (document.owner != caller) {
      Runtime.trap("Unauthorized: You do not own this document");
    };

    let updatedDoc : Document = {
      id = document.id;
      name = document.name;
      folderName = newFolder;
      createdAt = document.createdAt;
      owner = document.owner;
      blob = document.blob;
    };

    documents.add(id, updatedDoc);
    folderNames.add(newFolder);
  };
};
