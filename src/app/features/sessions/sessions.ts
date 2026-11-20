import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CourseService, Course, Note, Session } from '../../shared/course.service';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-sessions',
  imports: [FormsModule, DatePipe],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss',
})
export class Sessions {
  readonly auth = inject(AuthService);
  readonly classroom = inject(CourseService);
  message = '';

  draft: Session = this.empty();
  get records() {
    return [...this.classroom.sessions].sort((a, b) => a.date.localeCompare(b.date));
  }
  save(): void {
    try {
      this.classroom.saveSession(this.draft);
      this.draft = this.empty();
      this.message = 'Session saved.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
  edit(session: Session): void {
    this.draft = { ...session };
    this.message = '';
  }
  cancel(): void {
    this.draft = this.empty();
    this.message = '';
  }
  remove(session: Session): void {
    if (!confirm('Delete this session?')) return;
    try {
      this.classroom.deleteSession(session.id);
      if (this.draft.id === session.id) this.cancel();
      this.message = 'Session deleted.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
  private empty(): Session {
    return { id: '', courseId: '', creatorId: '', title: '', date: '', status: 'Scheduled' };
  }
}
