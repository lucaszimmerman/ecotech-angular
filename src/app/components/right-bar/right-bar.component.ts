import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UserSummary } from '../../data/api-models';
import { UserService } from '../../services/user.service/user.service';
import { AuthService } from '../../services/auth.service/auth.service';
import { Paginated, trackId } from '../../shared/request-state';

@Component({
  selector: 'app-right-bar',
  templateUrl: './right-bar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class RightBarComponent implements OnInit {
  readonly people = new Paginated<UserSummary>((page) =>
    this.users.search('', page),
  );
  readonly trackId = trackId;

  constructor(
    private users: UserService,
    public auth: AuthService,
  ) {}

  get others() {
    return this.people.items.filter(
      (person) => person.id !== this.auth.currentUserValue?.id,
    );
  }

  ngOnInit() {
    this.people.load();
  }
}
