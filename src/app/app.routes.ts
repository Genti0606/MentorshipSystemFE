import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { FindMentors } from './features/find-mentors/find-mentors';
import { MyCourses } from './features/my-courses/my-courses';
import { Sessions } from './features/sessions/sessions';
import { Resources } from './features/resources/resources';
import { Profile } from './features/profile/profile';

export const routes: Routes = [
  { path: '', component: Dashboard, pathMatch: 'full' },
  { path: 'find-mentors', component: FindMentors },
  { path: 'my-courses', component: MyCourses },
  { path: 'sessions', component: Sessions },
  { path: 'resources', component: Resources },
  { path: 'profile', component: Profile },
  { path: '**', redirectTo: '' },
];
