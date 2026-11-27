import { Injectable } from '@angular/core';
import { ChangePassword, Id, ProfileInput } from '../../data/api-models';
import { UserRepository } from '../../data/repositories/user.repository';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private users: UserRepository) {}

  profile(id: Id) { return this.users.profile(id); }
  search(query: string, page = 0) { return this.users.search(query, page); }
  update(id: Id, input: ProfileInput) { return this.users.update(id, input); }
  delete(id: Id) { return this.users.delete(id); }
  changePassword(input: ChangePassword) { return this.users.changePassword(input); }
  upload(kind: 'profile' | 'cover', file: File) { return this.users.upload(kind, file); }
}
