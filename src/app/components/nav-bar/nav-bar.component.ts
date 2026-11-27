import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import {
  EMPTY,
  Subject,
  distinctUntilChanged,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSummary } from '../../data/api-models';
import { AuthService } from '../../services/auth.service/auth.service';
import { DarkModeService } from '../../services/dark-mode/dark-mode.service';
import { UserService } from '../../services/user.service/user.service';
import { Paginated, trackId } from '../../shared/request-state';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class NavBarComponent {
  query = '';
  open = false;
  waiting = false;
  private readonly queryChanges = new Subject<string>();
  private activeQuery = '';
  readonly results = new Paginated<UserSummary>((page) =>
    this.users.search(this.activeQuery, page),
  );
  readonly trackId = trackId;

  constructor(
    public auth: AuthService,
    public theme: DarkModeService,
    private users: UserService,
    private router: Router,
  ) {
    this.queryChanges
      .pipe(
        distinctUntilChanged(),
        tap((query) => {
          this.results.request.reset();
          this.activeQuery = query;
          this.waiting = !!query;
        }),
        switchMap((query) => (query ? timer(280) : EMPTY)),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.waiting = false;
        this.results.reset();
      });
  }

  search(value: string) {
    this.query = value;
    this.open = !!value.trim();
    if (value.trim() !== this.activeQuery) this.queryChanges.next(value.trim());
  }

  logout() {
    this.auth.logout();
    void this.router.navigate(['/login'], { replaceUrl: true });
  }

  closeSearch(event: FocusEvent) {
    if (
      !(event.currentTarget as HTMLElement).contains(
        event.relatedTarget as Node | null,
      )
    ) {
      this.open = false;
    }
  }
}
