import {
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { CurrentUser } from '../../data/api-models';
import { IMAGE_TYPES, MediaService } from '../../data/media.service';
import { AuthService } from '../../services/auth.service/auth.service';
import { UserService } from '../../services/user.service/user.service';
import { RequestState, uncertain } from '../../shared/request-state';

const STEPS = [
  { key: 'dados', label: 'Dados do perfil', heading: 'Complete seu perfil' },
  {
    key: 'foto',
    label: 'Foto de perfil',
    heading: 'Escolha sua foto de perfil',
  },
  { key: 'capa', label: 'Foto de capa', heading: 'Escolha sua foto de capa' },
] as const;

interface PendingSave {
  confirmed: boolean;
  matches: (user: CurrentUser) => boolean;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class WelcomeComponent implements OnInit, OnDestroy {
  @ViewChild('stepHeading', { static: true })
  private heading!: ElementRef<HTMLElement>;
  readonly steps = STEPS;
  readonly request = new RequestState();
  readonly imageTypes = IMAGE_TYPES;
  readonly details = { city: '', website: '', bio: '' };
  profile?: CurrentUser;
  stepIndex = 0;
  pendingSave?: PendingSave;
  preview = '';
  file: File | null = null;
  private readonly destroy = inject(DestroyRef);
  private focusFrame = 0;

  constructor(
    private auth: AuthService,
    private users: UserService,
    private media: MediaService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  get step(): (typeof STEPS)[number] | undefined {
    return this.steps[this.stepIndex];
  }

  get websiteInvalid() {
    const website = this.details.website.trim();
    if (!website) return false;
    try {
      const url = new URL(website);
      return url.protocol !== 'https:' && url.protocol !== 'http:';
    } catch {
      return true;
    }
  }

  ngOnInit() {
    this.profile = this.auth.currentUserValue ?? undefined;
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('etapa')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((key) => {
        this.stepIndex =
          key === 'pronto'
            ? STEPS.length
            : Math.max(
                0,
                STEPS.findIndex((step) => step.key === key),
              );
        this.request.reset();
        this.pendingSave = undefined;
        this.clearImage();
        this.details.city = this.profile?.city ?? '';
        this.details.website = this.profile?.website ?? '';
        this.details.bio = this.profile?.bio ?? '';
        cancelAnimationFrame(this.focusFrame);
        this.focusFrame = requestAnimationFrame(() =>
          this.heading.nativeElement.focus({ preventScroll: true }),
        );
      });
  }

  saveDetails() {
    const viewer = this.profile;
    if (!viewer || this.websiteInvalid || this.request.busy || this.pendingSave)
      return;

    const city = this.details.city.trim() || null;
    const website = this.details.website.trim() || null;
    const bio = this.details.bio.trim() || null;
    const matches = (user: CurrentUser) =>
      (user.city || null) === city &&
      (user.website || null) === website &&
      (user.bio || null) === bio;

    if (matches(viewer)) {
      this.go(1);
      return;
    }

    this.save(
      this.users.update(viewer.id, {
        username: viewer.username,
        name: viewer.name,
        city,
        website,
        bio,
      }),
      matches,
    );
  }

  selectImage(input: HTMLInputElement) {
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) return;

    this.clearImage();
    this.request.error = this.media.validate(file);
    if (this.request.error) return;

    this.file = file;
    this.preview = URL.createObjectURL(file);
  }

  removeSelection() {
    this.clearImage();
    this.request.error = '';
  }

  saveImage() {
    if (!this.profile || !this.file || this.request.busy || this.pendingSave)
      return;
    const kind =
      this.step?.key === 'foto'
        ? 'profile'
        : this.step?.key === 'capa'
          ? 'cover'
          : null;
    if (!kind) return;

    const asset = (user: CurrentUser) =>
      (kind === 'profile' ? user.profileImageUrl : user.coverImageUrl)?.split(
        '?',
      )[0];
    const previous = asset(this.profile);
    this.save(
      this.users.upload(kind, this.file),
      (user) => !!asset(user) && asset(user) !== previous,
    );
  }

  checkSave() {
    const pending = this.pendingSave;
    if (!pending) return;

    this.request.run(this.auth.refresh(), (user) => {
      this.profile = user;
      this.pendingSave = undefined;
      if (pending.confirmed || pending.matches(user))
        this.go(this.stepIndex + 1);
      else
        this.request.error =
          'A alteração ainda não aparece no perfil. Tente salvar novamente.';
    });
  }

  move(offset: -1 | 1) {
    if (!this.request.busy) this.go(this.stepIndex + offset);
  }

  finish() {
    if (!this.request.busy)
      void this.router.navigateByUrl('/home', { replaceUrl: true });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.focusFrame);
    this.clearImage();
  }

  private save(source: Observable<void>, matches: PendingSave['matches']) {
    const pending = { confirmed: false, matches };
    this.request.run(
      source.pipe(
        tap(() => {
          pending.confirmed = true;
        }),
        switchMap(() => this.auth.refresh()),
      ),
      (user) => {
        this.profile = user;
        this.go(this.stepIndex + 1);
      },
      (error) => {
        if (!pending.confirmed && !uncertain(error)) return;
        this.pendingSave = pending;
        this.request.error = pending.confirmed
          ? 'Alteração salva. Atualize o perfil para continuar.'
          : 'Não foi possível confirmar o salvamento. Confira o perfil antes de tentar novamente.';
      },
    );
  }

  private go(index: number) {
    const key = index === STEPS.length ? 'pronto' : STEPS[index]?.key;
    if (key)
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { etapa: key },
        replaceUrl: true,
      });
  }

  private clearImage() {
    if (this.preview) URL.revokeObjectURL(this.preview);
    this.preview = '';
    this.file = null;
  }
}
