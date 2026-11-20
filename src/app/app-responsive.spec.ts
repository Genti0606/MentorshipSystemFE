import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { App } from './app';
import { AuthService } from './shared/auth.service';

describe('Responsive sidenav', () => {
  it('overlays mobile pages, closes after selection, and restores side mode on laptops', async () => {
    const breakpoint = new BehaviorSubject({ matches: false, breakpoints: {} });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: BreakpointObserver,
          useValue: { observe: () => breakpoint, isMatched: () => false },
        },
      ],
    }).compileComponents();
    TestBed.inject(AuthService).user.set({
      id: 'responsive-test',
      name: 'Test',
      surname: 'Student',
      role: 'student',
      email: 'test@epoka.edu.al',
      subject: '',
      bio: '',
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const sidenav = fixture.debugElement.query(By.directive(MatSidenav))
      .componentInstance as MatSidenav;
    expect(sidenav.mode).toBe('side');
    expect(sidenav.opened).toBe(true);

    breakpoint.next({ matches: true, breakpoints: {} });
    await fixture.whenStable();
    expect(sidenav.mode).toBe('over');
    expect(sidenav.opened).toBe(false);
    fixture.componentInstance.toggleSidenav();
    await fixture.whenStable();
    expect(sidenav.opened).toBe(true);
    fixture.componentInstance.closeMobileSidenav();
    await fixture.whenStable();
    expect(sidenav.opened).toBe(false);

    breakpoint.next({ matches: false, breakpoints: {} });
    await fixture.whenStable();
    expect(sidenav.mode).toBe('side');
    expect(sidenav.opened).toBe(true);
    fixture.componentInstance.closeMobileSidenav();
    await fixture.whenStable();
    expect(sidenav.opened).toBe(true);
    fixture.destroy();
  });
});
