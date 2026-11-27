import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ApiInterceptor, Session } from '../session';
import { API_BASE_URL } from '../../services/api.config';
import { AuthRepository } from './auth.repository';
import { CommentRepository } from './comment.repository';
import { PostRepository } from './post.repository';
import { UserRepository } from './user.repository';

const id = '33ce71db-7436-4cc9-b284-35a08120b351';

describe('EcoTech API client', () => {
  let http: HttpTestingController;
  let session: Session;

  beforeEach(() => {
    sessionStorage.removeItem('ecotech.session');
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(Session);
  });

  afterEach(() => {
    session.clear();
    http.verify();
  });

  function start() {
    session.start({
      id,
      username: 'test',
      name: 'Test',
      role: 'USER',
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresIn: 60,
    });
  }

  it('sends the JWT only to protected API routes', () => {
    start();
    TestBed.inject(UserRepository).profile(id).subscribe();
    const profile = http.expectOne(API_BASE_URL + '/users/' + id + '/profile');
    expect(profile.request.headers.get('Authorization')).toBe(
      'Bearer test-token',
    );
    profile.flush({});
    TestBed.inject(AuthRepository).verifyEmail('email-token').subscribe();
    const verify = http.expectOne(
      (request) => request.url === API_BASE_URL + '/auth/verify-email',
    );
    expect(verify.request.headers.has('Authorization')).toBeFalse();
    expect(verify.request.params.get('token')).toBe('email-token');
    expect(verify.request.responseType).toBe('text');
    verify.flush('OK');
    TestBed.inject(HttpClient).get('https://example.test/media').subscribe();
    const external = http.expectOne('https://example.test/media');
    expect(external.request.headers.has('Authorization')).toBeFalse();
    external.flush({});
  });

  it('expires a session and clears rejected JWTs', fakeAsync(() => {
    start();
    tick(60000);
    expect(session.token).toBeNull();
    start();
    TestBed.inject(UserRepository)
      .me()
      .subscribe({ error: () => {} });
    http
      .expectOne(API_BASE_URL + '/users/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(session.token).toBeNull();
  }));

  it('sends multipart files without fixing the boundary and accepts empty success responses', () => {
    const posts = TestBed.inject(PostRepository);
    const file = new File(['image'], 'test.png', { type: 'image/png' });
    let status = 0;
    posts.create('EcoTech test', file).subscribe((response) => {
      status = response.status;
    });
    const create = http.expectOne(API_BASE_URL + '/posts');
    expect(create.request.method).toBe('POST');
    expect(create.request.body.get('content')).toBe('EcoTech test');
    expect(create.request.body.get('file')).toEqual(file);
    expect(create.request.headers.has('Content-Type')).toBeFalse();
    create.flush(null, { status: 201, statusText: 'Created' });
    expect(status).toBe(201);
    posts.update(id, 'Updated content', null, true).subscribe();
    const update = http.expectOne(API_BASE_URL + '/posts/' + id);
    expect(update.request.body.get('removeImage')).toBe('true');
    update.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('preserves UUID and sends pagination and comment content using the documented contract', () => {
    const comments = TestBed.inject(CommentRepository);
    const base = API_BASE_URL + '/posts/' + id + '/comments';
    comments.list(id, 2).subscribe();
    const page = http.expectOne(base + '?page=2&size=20');
    page.flush({
      content: [],
      number: 2,
      last: true,
      totalPages: 3,
      totalElements: 40,
    });
    comments.create(id, 'Um comentário').subscribe();
    const create = http.expectOne(base);
    expect(create.request.body).toEqual({ content: 'Um comentário' });
    create.flush(null, { status: 201, statusText: 'Created' });
  });
});
