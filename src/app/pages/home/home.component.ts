import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class HomeComponent {
  readonly mode = this.route.queryParamMap.pipe(
    map((query) =>
      query.get('vista') === 'todos' ? ('all' as const) : ('feed' as const),
    ),
    distinctUntilChanged(),
  );

  constructor(private route: ActivatedRoute) {}
}
