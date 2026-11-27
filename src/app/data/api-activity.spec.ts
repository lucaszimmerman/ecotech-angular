import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiActivity } from './api-activity';
import { ApiInterceptor } from './session';
import { API_BASE_URL, API_SLOW_NOTICE_MS } from '../services/api.config';
import { AuthRepository } from './repositories/auth.repository';

describe('API activity and Google exchange', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reports slow API requests only while they are pending', fakeAsync(() => {
    const states: boolean[] = [];
    TestBed.inject(ApiActivity).slow.subscribe(value => states.push(value));
    TestBed.inject(HttpClient).get(API_BASE_URL + '/actuator/health').subscribe();
    tick(API_SLOW_NOTICE_MS - 1);
    expect(states).toEqual([false]);
    tick(1);
    expect(states).toEqual([false, true]);
    http.expectOne(API_BASE_URL + '/actuator/health').flush({ status: 'UP' });
    expect(states).toEqual([false, true, false]);
  }));

  it('exchanges the one-time Google code without sending a JWT', () => {
    TestBed.inject(AuthRepository).exchangeGoogleCode('abc').subscribe();
    const request = http.expectOne(API_BASE_URL + '/auth/google/exchange');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ code: 'abc' });
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });
});
