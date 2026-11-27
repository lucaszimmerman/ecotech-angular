import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PostPageComponent } from './post-page.component';
import { AppModule } from '../../app.module';
import { API_BASE_URL } from '../../services/api.config';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

describe('PostPageComponent', () => {
  it('cancels the previous route request and shows the actual error for the current post', () => {
    const first = 'e98fc2e6-310c-449d-b1b2-3d320ad7e3de';
    const second = 'ebe60f8f-bece-4d46-ab8b-69d8536aed21';
    const params = new BehaviorSubject(convertToParamMap({ id: first }));
    TestBed.configureTestingModule({
      imports: [AppModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(PostPageComponent);
    fixture.detectChanges();
    http
      .expectOne((request) => request.url === API_BASE_URL + '/users/search')
      .flush({
        content: [],
        number: 0,
        totalElements: 0,
        totalPages: 0,
        last: true,
      });
    const previous = http.expectOne(API_BASE_URL + '/posts/' + first);
    params.next(convertToParamMap({ id: second }));
    expect(previous.cancelled).toBeTrue();
    http
      .expectOne(API_BASE_URL + '/posts/' + second)
      .flush(null, { status: 404, statusText: 'Not found' });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent,
    ).toContain('não foi encontrado');
    expect(fixture.nativeElement.querySelector('app-post')).toBeNull();
    http.verify();
  });
});
