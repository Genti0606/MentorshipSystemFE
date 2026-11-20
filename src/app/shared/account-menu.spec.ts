import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { App } from '../app';
import { routes } from '../app.routes';
import { AuthService } from './auth.service';

describe('Account menu', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });
  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('opens the password form from the account menu and logs out to login', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.register('Test', 'User', 'test@epoka.edu.al', 'Password123', 'student');
    await auth.login('Test', 'User', 'test@epoka.edu.al', 'Password123');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Find Mentors');
    (
      fixture.nativeElement.querySelector('button[aria-label="Account menu"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    const menuButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]'));
    menuButtons.find((b) => b.textContent?.includes('Change password'))!.click();
    await fixture.whenStable();
    expect(document.querySelectorAll('#password-form input[type="password"]')).toHaveLength(3);
    TestBed.inject(MatDialog).closeAll();
    fixture.componentInstance.logout();
    await fixture.whenStable();
    expect(auth.user()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(fixture.nativeElement.querySelector('mat-toolbar')).toBeNull();
  });

  it('shows mentors the teaching menu without the student mentor-directory link', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.register('Test', 'Mentor', 'mentor@epoka.edu.al', 'Password123', 'mentor');
    await auth.login('Test', 'Mentor', 'mentor@epoka.edu.al', 'Password123');
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const nav = fixture.nativeElement.querySelector('mat-nav-list').textContent;
    expect(nav).toContain('Courses I Teach');
    expect(nav).toContain('Upload Notes');
    expect(nav).not.toContain('Find Mentors');
  });
});
