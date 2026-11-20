import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  mentorId: string;
  students: string[];
}
export interface Note {
  id: string;
  courseId: string;
  title: string;
  text: string;
  fileName: string;
  fileData: string;
}
export interface Session {
  id: string;
  courseId: string;
  creatorId: string;
  title: string;
  date: string;
  status: string;
}
interface Database {
  courses: Course[];
  notes: Note[];
  sessions: Session[];
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  readonly auth = inject(AuthService);
  readonly data = signal<Database>(this.load());

  private load(): Database {
    try {
      const data = JSON.parse(localStorage.getItem('mentorship-classroom-v1') || 'null');
      if (
        data &&
        Array.isArray(data.courses) &&
        Array.isArray(data.notes) &&
        Array.isArray(data.sessions)
      )
        return data;
    } catch {
      /* Start with an empty classroom if storage is unavailable. */
    }
    return { courses: [], notes: [], sessions: [] };
  }

  private save(data: Database): void {
    try {
      localStorage.setItem('mentorship-classroom-v1', JSON.stringify(data));
    } catch {
      throw new Error('Could not save. Browser storage is full or disabled. Try a smaller file.');
    }
    this.data.set(data);
  }

  get myCourses(): Course[] {
    const user = this.auth.user();
    return this.data().courses.filter((c) =>
      user?.role === 'mentor' ? c.mentorId === user.id : !!user && c.students.includes(user.id),
    );
  }

  get availableCourses(): Course[] {
    return this.auth.user()?.role === 'student'
      ? this.data().courses.filter((c) => !c.students.includes(this.auth.user()!.id))
      : [];
  }

  owns(courseId: string): boolean {
    const user = this.auth.user();
    return (
      user?.role === 'mentor' &&
      this.data().courses.some((c) => c.id === courseId && c.mentorId === user.id)
    );
  }

  canRead(courseId: string): boolean {
    return this.myCourses.some((c) => c.id === courseId);
  }
  courseTitle(id: string): string {
    return this.data().courses.find((c) => c.id === id)?.title || 'Deleted course';
  }

  saveCourse(draft: Pick<Course, 'id' | 'title' | 'code' | 'description'>): void {
    const user = this.auth.user();
    if (user?.role !== 'mentor') throw new Error('Only mentors can manage courses.');
    if (draft.id && !this.owns(draft.id)) throw new Error('You can only edit your own courses.');
    if (!draft.title.trim() || !draft.code.trim())
      throw new Error('Course title and code are required.');
    const existing = this.data().courses.find((c) => c.id === draft.id);
    const course: Course = {
      ...draft,
      title: draft.title.trim(),
      code: draft.code.trim(),
      id: draft.id || crypto.randomUUID(),
      mentorId: user.id,
      students: existing?.students || [],
    };
    this.save({
      ...this.data(),
      courses: existing
        ? this.data().courses.map((c) => (c.id === course.id ? course : c))
        : [...this.data().courses, course],
    });
  }

  deleteCourse(id: string): void {
    if (!this.owns(id)) throw new Error('You can only delete your own courses.');
    this.save({
      courses: this.data().courses.filter((c) => c.id !== id),
      notes: this.data().notes.filter((n) => n.courseId !== id),
      sessions: this.data().sessions.filter((s) => s.courseId !== id),
    });
  }

  enroll(id: string, join: boolean): void {
    const user = this.auth.user();
    if (user?.role !== 'student') throw new Error('Only students can enroll.');
    const course = this.data().courses.find((c) => c.id === id);
    if (!course) throw new Error('Course not found.');
    this.save({
      ...this.data(),
      courses: this.data().courses.map((c) =>
        c.id !== id
          ? c
          : {
              ...c,
              students: join
                ? [...new Set([...c.students, user.id])]
                : c.students.filter((s) => s !== user.id),
            },
      ),
      sessions: join
        ? this.data().sessions
        : this.data().sessions.filter((s) => !(s.courseId === id && s.creatorId === user.id)),
    });
  }

  get notes(): Note[] {
    return this.data().notes.filter((n) => this.canRead(n.courseId));
  }
  saveNote(draft: Note): void {
    if (!this.owns(draft.courseId)) throw new Error('Upload notes only to courses you teach.');
    if (draft.id && !this.data().notes.some((n) => n.id === draft.id && this.owns(n.courseId)))
      throw new Error('You cannot edit this note.');
    if (!draft.title.trim() || (!draft.text.trim() && !draft.fileData))
      throw new Error('Add a title and note text or a file.');
    const note = { ...draft, id: draft.id || crypto.randomUUID() };
    this.save({
      ...this.data(),
      notes: draft.id
        ? this.data().notes.map((n) => (n.id === note.id ? note : n))
        : [...this.data().notes, note],
    });
  }
  deleteNote(id: string): void {
    const note = this.data().notes.find((n) => n.id === id);
    if (!note || !this.owns(note.courseId))
      throw new Error('Only the course mentor can delete this note.');
    this.save({ ...this.data(), notes: this.data().notes.filter((n) => n.id !== id) });
  }

  get sessions(): Session[] {
    return this.data().sessions.filter(
      (s) =>
        this.canRead(s.courseId) && (this.owns(s.courseId) || s.creatorId === this.auth.user()?.id),
    );
  }
  saveSession(draft: Session): void {
    const user = this.auth.user();
    if (!user || !this.canRead(draft.courseId)) throw new Error('Choose one of your courses.');
    const previous = this.data().sessions.find((s) => s.id === draft.id);
    if (draft.id && (!previous || !this.sessions.some((s) => s.id === draft.id)))
      throw new Error('You cannot edit this session.');
    if (!draft.title.trim() || !draft.date || !Number.isFinite(new Date(draft.date).getTime()))
      throw new Error('Enter a title and valid date.');
    if (!previous && new Date(draft.date).getTime() < Date.now())
      throw new Error('Choose a future date.');
    const status = user.role === 'student' ? 'Requested' : draft.status;
    if (!['Requested', 'Scheduled', 'Completed', 'Cancelled'].includes(status))
      throw new Error('Choose a valid status.');
    const session = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      creatorId: previous?.creatorId || user.id,
      status,
    };
    this.save({
      ...this.data(),
      sessions: previous
        ? this.data().sessions.map((s) => (s.id === session.id ? session : s))
        : [...this.data().sessions, session],
    });
  }
  deleteSession(id: string): void {
    if (!this.sessions.some((s) => s.id === id)) throw new Error('You cannot delete this session.');
    this.save({ ...this.data(), sessions: this.data().sessions.filter((s) => s.id !== id) });
  }
}
