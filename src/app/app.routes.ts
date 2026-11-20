import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { FindMentors } from './features/find-mentors/find-mentors';
import { MyCourses } from './features/my-courses/my-courses';
import { Sessions } from './features/sessions/sessions';
import { Resources } from './features/resources/resources';
import { Profile } from './features/profile/profile';
import { Auth } from './features/auth/authentication/auth';
import { authGuard, guestGuard } from './shared/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Auth, canActivate: [guestGuard] },
  { path: 'register', component: Auth, canActivate: [guestGuard], data: { register: true } },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', component: Dashboard, pathMatch: 'full' },
      { path: 'find-mentors', component: FindMentors, data: { roles: ['student'] } },
      { path: 'my-courses', component: MyCourses },
      { path: 'sessions', component: Sessions },
      { path: 'resources', component: Resources },
      { path: 'profile', component: Profile },
    ],
  },
  { path: '**', redirectTo: '' },
];
