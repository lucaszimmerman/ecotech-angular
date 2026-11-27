import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { switchMap } from 'rxjs';
import { CurrentUser, Profile, ProfileInput } from '../../data/api-models';
import { AuthService } from '../../services/auth.service/auth.service';
import { UserService } from '../../services/user.service/user.service';
import { RequestState, uncertain } from '../../shared/request-state';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class UpdateComponent implements OnInit {
  @Input({ required: true }) profile!: Profile;
  @Output() saved = new EventEmitter<CurrentUser>();
  @Output() closed = new EventEmitter<void>();
  readonly request = new RequestState();
  form: ProfileInput = {
    username: '',
    name: '',
    city: '',
    website: '',
    bio: '',
  };
  refreshNeeded = false;

  constructor(
    private auth: AuthService,
    private users: UserService,
  ) {}

  ngOnInit() {
    const { username, name, city, website, bio } = this.profile;
    this.form = { username, name, city, website, bio };
  }

  save() {
    let written = false;
    this.request.run(
      this.users
        .update(this.profile.id, {
          ...this.form,
          username: this.form.username.trim(),
          name: this.form.name.trim(),
        })
        .pipe(
          switchMap(() => {
            written = true;
            return this.auth.refresh();
          }),
        ),
      (profile) => {
        this.saved.emit(profile);
        this.request.success = 'Dados do perfil salvos.';
      },
      (error) => this.handleWriteError(written, error),
    );
  }

  refresh() {
    this.request.run(this.auth.refresh(), (profile) => {
      this.saved.emit(profile);
      this.refreshNeeded = false;
    });
  }

  private handleWriteError(written: boolean, error: unknown) {
    this.refreshNeeded = written || uncertain(error);
    if (this.refreshNeeded)
      this.request.error += written
        ? ' A alteração foi salva. Atualize o perfil para ver o resultado.'
        : ' Atualize o perfil para conferir se a alteração foi salva.';
  }
}
