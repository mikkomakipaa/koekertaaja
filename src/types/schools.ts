export interface School {
  id: string;
  name: string;
  municipality?: string | null;
  created_at: string;
}

export type SchoolMemberRole = 'admin' | 'teacher';

export interface SchoolMember {
  id: string;
  user_id: string;
  school_id: string;
  role: SchoolMemberRole;
  created_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  grade?: number | null;
  created_at: string;
}
