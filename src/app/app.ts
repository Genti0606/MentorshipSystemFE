import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Component, inject, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './shared/auth.service';
import { PasswordDialog } from './features/auth/password-dialog/password-dialog';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatMenuModule,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  readonly auth = inject(AuthService);
  private readonly breakpoints = inject(BreakpointObserver);
  readonly isMobile = toSignal(
    this.breakpoints.observe('(max-width: 50rem)').pipe(map((result) => result.matches)),
    { initialValue: this.breakpoints.isMatched('(max-width: 50rem)') },
  );
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  @ViewChild(MatSidenav) sidenav?: MatSidenav;
  notice = '';

  toggleSidenav(): void {
    this.sidenav?.toggle();
  }
  closeMobileSidenav(): void {
    if (this.isMobile()) {
      this.sidenav?.close();
    }
  }

  changePassword(): void {
    this.dialog
      .open(PasswordDialog, { width: '440px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((changed) => {
        if (changed) this.notice = 'Password changed successfully.';
      });
  }
  logout(): void {
    this.dialog.closeAll();
    this.auth.logout();
    this.notice = '';
    this.router.navigate(['/login']);
  }
}
