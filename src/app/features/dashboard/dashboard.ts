import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CourseService } from '../../shared/course.service';

@Component({
  imports: [MatButtonModule, MatCardModule, MatIconModule, NgOptimizedImage, RouterLink, DatePipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly auth = inject(AuthService);
  readonly classroom = inject(CourseService);
  get name(): string {
    return this.auth.user()?.name || 'Student';
  }
  get courseCount(): number {
    return this.classroom.myCourses.length;
  }
  get resourceCount(): number {
    return this.classroom.notes.length;
  }
  get upcomingSessions() {
    return this.classroom.sessions
      .filter((s) => s.status === 'Scheduled' && new Date(s.date).getTime() >= Date.now())
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
