import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Section {
  id: bigint;
  title: string;
  order: bigint;
  createdAt: bigint;
}

export interface Page {
  id: bigint;
  sectionId: bigint;
  title: string;
  slug: string;
  content: string;
  order: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface _SERVICE {
  // Authorization
  _initializeAccessControlWithSecret: ActorMethod<[string], void>;
  getCallerUserRole: ActorMethod<[], UserRole>;
  assignCallerUserRole: ActorMethod<[Principal, UserRole], void>;
  isCallerAdmin: ActorMethod<[], boolean>;

  // Public
  getSections: ActorMethod<[], Section[]>;
  getPages: ActorMethod<[], Page[]>;
  getPage: ActorMethod<[bigint], [] | [Page]>;
  getPageBySlug: ActorMethod<[string], [] | [Page]>;
  searchPages: ActorMethod<[string], Page[]>;

  // Admin
  createSection: ActorMethod<[string], Section>;
  updateSection: ActorMethod<[bigint, string], boolean>;
  deleteSection: ActorMethod<[bigint], boolean>;
  createPage: ActorMethod<[bigint, string, string, string], Page>;
  updatePage: ActorMethod<[bigint, string, string, string], boolean>;
  deletePage: ActorMethod<[bigint], boolean>;
}

export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
