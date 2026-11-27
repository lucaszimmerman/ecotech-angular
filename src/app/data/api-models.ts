export type Id = string;
export type Role = 'USER' | 'ADMIN';
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
}
export interface LoginInput { username: string; password: string; }
export interface Registration extends LoginInput { email: string; name: string; }
export interface LoginResponse {
  id: Id;
  username: string;
  name: string;
  role: Role;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
export interface UserSummary {
  id: Id;
  username: string;
  name: string;
  profileImageUrl: string | null;
}
export interface Profile extends UserSummary {
  coverImageUrl: string | null;
  city: string | null;
  website: string | null;
  bio: string | null;
}
export interface CurrentUser extends Profile {
  email: string;
  emailVerified: boolean;
  role: Role;
  active: boolean;
}
export interface ProfileInput {
  username: string;
  name: string;
  city: string | null;
  website: string | null;
  bio: string | null;
}
export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export type ResetPassword = Omit<ChangePassword, 'currentPassword'> & { token: string };
export interface LikeStatus { likeCount: number; likedByCurrentUser: boolean; }
export interface Post extends LikeStatus {
  id: Id;
  content: string;
  imageUrl: string | null;
  user: UserSummary;
  createdAt: string;
  updatedAt: string | null;
  commentCount: number;
}
export interface Comment {
  id: Id;
  content: string;
  user: UserSummary;
  createdAt: string;
  updatedAt: string | null;
}
