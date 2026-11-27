import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { API_SLOW_NOTICE_MS } from '../services/api.config';

/** Indica quando alguma requisição à API está demorando, por exemplo enquanto o Render acorda o servidor. */
@Injectable({ providedIn: 'root' })
export class ApiActivity {
  private slowRequests = 0;
  private readonly state = new BehaviorSubject(false);
  readonly slow = this.state.pipe(distinctUntilChanged());

  /** Registra uma requisição e devolve a função que a encerra. */
  start(): () => void {
    let slow = false;
    let finished = false;
    const timer = setTimeout(() => {
      slow = true;
      this.slowRequests++;
      this.state.next(true);
    }, API_SLOW_NOTICE_MS);
    return () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (slow) {
        this.slowRequests--;
        this.state.next(this.slowRequests > 0);
      }
    };
  }
}
