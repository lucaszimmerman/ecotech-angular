import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule, NotFoundComponent } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommentsComponent } from './components/comments/comments.component';
import { LeftBarComponent } from './components/left-bar/left-bar.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { PostComponent } from './components/post/post.component';
import { PostsComponent } from './components/posts/posts.component';
import { RightBarComponent } from './components/right-bar/right-bar.component';
import { ShareComponent } from './components/share/share.component';
import { UpdateComponent } from './components/update/update.component';
import { ApiInterceptor } from './data/session';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { EmailFlowComponent } from './pages/login/email-flow.component';
import { LoginComponent } from './pages/login/login.component';
import { AccountComponent } from './pages/perfil/account.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { PostPageComponent } from './pages/post-page/post-page.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { MediaUrlPipe } from './shared/media-url.pipe';
import { AuthFrameComponent } from './shared/auth-frame.component';
import { StatusComponent } from './shared/status.component';
import { ApiDatePipe } from './shared/api-date.pipe';
import { IconComponent } from './shared/icon.component';
import { MenuComponent } from './shared/menu.component';
import { CharCountComponent } from './shared/char-count.component';
import { PersonLinkComponent } from './shared/person-link.component';
import { GoogleCallbackComponent } from './pages/login/google-callback.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CadastroComponent,
    HomeComponent,
    PerfilComponent,
    PostPageComponent,
    AccountComponent,
    EmailFlowComponent,
    NotFoundComponent,
    NavBarComponent,
    LeftBarComponent,
    RightBarComponent,
    ShareComponent,
    PostsComponent,
    PostComponent,
    CommentsComponent,
    UpdateComponent,
    MediaUrlPipe,
    StatusComponent,
    AuthFrameComponent,
    WelcomeComponent,
    ApiDatePipe,
    GoogleCallbackComponent,
    IconComponent,
    MenuComponent,
    CharCountComponent,
    PersonLinkComponent,
  ],
  bootstrap: [AppComponent],
  imports: [BrowserModule, FormsModule, AppRoutingModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ],
})
export class AppModule {}
