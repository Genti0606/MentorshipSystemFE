import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CourseService, Course, Note, Session } from '../../shared/course.service';

@Component({
  selector: 'app-my-courses',
  imports: [FormsModule, RouterLink],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.scss',
})
export class MyCourses {
  readonly auth = inject(AuthService);
  readonly classroom = inject(CourseService);
  message = '';

  draft = { id: '', title: '', code: '', description: '' };
  search = '';
  get records(): Course[] {
    return this.classroom.myCourses.filter((c) =>
      (c.title + c.code).toLowerCase().includes(this.search.toLowerCase()),
    );
  }
  get available(): Course[] {
    return this.classroom.availableCourses.filter((c) =>
      (c.title + c.code).toLowerCase().includes(this.search.toLowerCase()),
    );
  }
  save(): void {
    try {
      this.classroom.saveCourse(this.draft);
      this.cancel();
      this.message = 'Course saved.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
  edit(course: Course): void {
    this.draft = {
      id: course.id,
      title: course.title,
      code: course.code,
      description: course.description,
    };
  }
  cancel(): void {
    this.draft = { id: '', title: '', code: '', description: '' };
    this.message = '';
  }
  remove(course: Course): void {
    if (!confirm('Delete this course and all its notes and sessions?')) return;
    try {
      this.classroom.deleteCourse(course.id);
      if (this.draft.id === course.id) this.cancel();
      this.message = 'Course deleted.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
  enroll(course: Course, join: boolean): void {
    try {
      this.classroom.enroll(course.id, join);
      this.message = join ? 'You are enrolled.' : 'You left the course.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
}
