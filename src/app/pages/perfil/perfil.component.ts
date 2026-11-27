import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { Id, Profile, UserSummary } from '../../data/api-models';
import { IMAGE_TYPES, MediaService } from '../../data/media.service';
import { AuthService } from '../../services/auth.service/auth.service';
import { RelationshipService } from '../../services/relationship.service/relationship.service';
import { UserService } from '../../services/user.service/user.service';
import { IconName } from '../../shared/icons';
import { ImageDraft } from '../../shared/image-draft';
import { Paginated, RequestState, trackId } from '../../shared/request-state';

type ProfileImage = 'profile' | 'cover';
type PeopleKind = 'followers' | 'following';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class PerfilComponent implements OnDestroy {
  id: Id = '';
  profile?: Profile;
  scope = { userId: '' };
  following: boolean | null = null;
  readonly request = new RequestState();
  readonly relationship = new RequestState();
  readonly followChange = new RequestState();
  readonly photo = new RequestState();
  readonly draft = new ImageDraft<ProfileImage>();
  readonly imageTypes = IMAGE_TYPES;
  kind: PeopleKind | null = null;
  readonly peopleTabs = [
    { kind: 'following', label: 'Seguindo' },
    { kind: 'followers', label: 'Seguidores' },
  ] as const;
  /** Abas do perfil. Para criar outra, inclua um item aqui e trate o `kind` no template. */
  readonly tabs: { kind: PeopleKind | null; label: string; icon: IconName }[] = [
    { kind: null, label: 'Publicações', icon: 'comment' },
    { kind: 'followers', label: 'Seguidores', icon: 'users' },
    { kind: 'following', label: 'Seguindo', icon: 'user-plus' },
  ];
  counts: Record<PeopleKind, number> | null = null;
  readonly people = new Paginated<UserSummary>((page) =>
    this.follows.list(this.id, this.kind || 'followers', page),
  );
  readonly trackId = trackId;
  editing = false;
  imageRetried = false;
  avatarFailed = false;
  coverFailed = false;

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService,
    private users: UserService,
    private follows: RelationshipService,
    private media: MediaService,
    private location: Location,
    private router: Router,
  ) {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') || ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        this.id = id;
        this.scope = { userId: id };
        this.profile = undefined;
        this.kind = null;
        this.editing = false;
        this.imageRetried = false;
        this.avatarFailed = this.coverFailed = false;
        this.following = null;
        this.counts = null;
        this.request.reset();
        this.relationship.reset();
        this.followChange.reset();
        this.photo.reset();
        this.draft.clear();
        this.people.request.reset();
        this.load();
        this.loadRelationship();
        this.loadCounts();
      });
  }

  get own() {
    return this.auth.currentUserValue?.id === this.id;
  }

  /** Endereço do site sem protocolo nem barra final, como o Twitter exibe. */
  get websiteLabel() {
    return (this.website || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }

  get website() {
    try {
      const url = new URL(this.profile?.website || '');
      return url.protocol === 'https:' || url.protocol === 'http:'
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  load() {
    const resource = this.own
      ? this.auth.currentUserValue
        ? of(this.auth.currentUserValue)
        : this.auth.refresh()
      : this.users.profile(this.id);
    this.request.run(resource, (profile) => {
      this.profile = profile;
    });
  }

  loadRelationship() {
    const viewer = this.auth.currentUserValue;
    if (!viewer || this.own) return;
    this.relationship.run(
      this.follows.follows(viewer.id, this.id),
      (following) => {
        this.following = following;
      },
    );
  }

  toggleFollow() {
    if (this.following === null || this.own) return;
    const next = !this.following;
    this.followChange.run(
      this.follows.set(this.id, next),
      () => {
        this.following = next;
        this.followChange.success = next
          ? 'Perfil seguido.'
          : 'Você deixou de seguir este perfil.';
        if (this.counts) this.counts = { ...this.counts, followers: this.counts.followers + (next ? 1 : -1) };
        if (this.kind === 'followers') this.people.reset();
      },
      () => {
        this.following = null;
        this.loadRelationship();
      },
    );
  }

  selectTab(kind: PeopleKind | null) {
    if (this.kind === kind) return;
    this.kind = kind;
    if (kind) this.people.reset();
    else this.people.request.reset();
  }

  loadCounts() {
    const id = this.id;
    this.follows.counts(id).subscribe({
      next: (counts) => {
        if (id === this.id) this.counts = counts;
      },
      error: () => (this.counts = null),
    });
  }

  back() {
    if (window.history.length > 1) this.location.back();
    else void this.router.navigateByUrl('/home');
  }

  renewImage(cover = false) {
    if (cover) this.coverFailed = true;
    else this.avatarFailed = true;
    if (this.imageRetried || this.request.busy) return;
    this.imageRetried = true;
    this.request.run(
      this.own ? this.auth.refresh() : this.users.profile(this.id),
      (profile) => {
        this.applyProfile(profile);
      },
    );
  }

  applyProfile(profile: Profile) {
    if (this.profile?.profileImageUrl !== profile.profileImageUrl)
      this.avatarFailed = false;
    if (this.profile?.coverImageUrl !== profile.coverImageUrl)
      this.coverFailed = false;
    this.profile = profile;
  }

  /** Abre a prévia da imagem escolhida; nada é enviado até o usuário confirmar. */
  pickImage(kind: ProfileImage, input: HTMLInputElement) {
    const file = input.files?.item(0);
    input.value = '';
    if (!file) return;
    this.photo.reset();
    this.photo.error = this.media.validate(file);
    if (!this.photo.error) this.draft.set(kind, file);
  }

  cancelImage() {
    this.draft.clear();
    this.photo.reset();
  }

  saveImage() {
    const { kind, file } = this.draft;
    if (!kind || !file) return;
    this.photo.run(
      this.users.upload(kind, file).pipe(switchMap(() => this.auth.refresh())),
      (profile) => {
        this.applyProfile(profile);
        this.draft.clear();
        this.photo.success = kind === 'cover' ? 'Capa atualizada.' : 'Foto de perfil atualizada.';
      },
    );
  }

  ngOnDestroy() {
    this.draft.clear();
  }
}
