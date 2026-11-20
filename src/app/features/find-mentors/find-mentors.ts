import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CourseService, Course, Note, Session } from '../../shared/course.service';

@Component({
  selector: 'app-find-mentors',
  imports: [FormsModule, RouterLink],
  templateUrl: './find-mentors.html',
  styleUrl: './find-mentors.scss',
})
export class FindMentors {
  readonly auth = inject(AuthService);
  readonly classroom = inject(CourseService);
  message = '';

  search = '';
  get mentors() {
    const query = this.search.toLowerCase();
    return this.auth
      .mentors()
      .filter((m) => (m.name + ' ' + m.surname + ' ' + m.subject).toLowerCase().includes(query));
  }
  courseCount(id: string): number {
    return this.classroom.data().courses.filter((c) => c.mentorId === id).length;
  }
}
