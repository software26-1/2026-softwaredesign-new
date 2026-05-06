export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: number;
  loginId: string;
  name: string;
  role: UserRole;
}

export interface Teacher extends User {
  schoolId: number;
  schoolName?: string;
  classGroupId?: number;
  classGroupName?: string;
  subject?: string;
}

export interface LoginRequest {
  userType: string;
  loginId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
