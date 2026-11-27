import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

function savedTheme() {
  try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
}

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  private readonly state = new BehaviorSubject(savedTheme());
  readonly darkMode = this.state.asObservable();

  toggleDarkMode() {
    const enabled = !this.state.value;
    this.state.next(enabled);
    try { localStorage.setItem('darkMode', String(enabled)); } catch { /* Keep the active preference. */ }
  }
}
