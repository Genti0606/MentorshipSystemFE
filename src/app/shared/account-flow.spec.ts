import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AuthService } from './auth.service';
import { CourseService } from './course.service';
import { Resources } from '../features/resources/resources';

describe('Accounts and course permissions', () => {
  let auth: AuthService;
  let classroom: CourseService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    auth = TestBed.inject(AuthService);
    classroom = TestBed.inject(CourseService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  async function account(email: string, role: 'student' | 'mentor'): Promise<void> {
    await auth.register('Test', 'User', email, 'Password123', role);
    await auth.login('Test', 'User', email, 'Password123');
  }

  it('validates school email, duplicate accounts and passwords without storing plaintext', async () => {
    await expect(
      auth.register('Test', 'User', 'test@gmail.com', 'Password123', 'student'),
    ).rejects.toThrow('epoka.edu.al');
    await account('test@epoka.edu.al', 'student');
    expect(localStorage.getItem('mentorship-accounts-v1')).not.toContain('Password123');
    await expect(
      auth.register('Test', 'User', 'TEST@epoka.edu.al', 'Password123', 'mentor'),
    ).rejects.toThrow('already exists');
    auth.logout();
    await expect(auth.login('Test', 'User', 'test@epoka.edu.al', 'wrong')).rejects.toThrow(
      'incorrect',
    );
    expect(auth.user()).toBeNull();
  });

  it('changes password only with the current password and restores the signed-in profile', async () => {
    await account('test@epoka.edu.al', 'student');
    expect(new AuthService().user()?.email).toBe('test@epoka.edu.al');
    await expect(auth.changePassword('wrong', 'NewPassword123')).rejects.toThrow('incorrect');
    await auth.changePassword('Password123', 'NewPassword123');
    auth.logout();
    expect(new AuthService().user()).toBeNull();
    await expect(auth.login('Test', 'User', 'test@epoka.edu.al', 'Password123')).rejects.toThrow(
      'incorrect',
    );
    await auth.login('Test', 'User', 'test@epoka.edu.al', 'NewPassword123');
    expect(auth.user()?.role).toBe('student');
  });

  it('keeps mentor course mutations private and exposes notes only after student enrollment', async () => {
    await account('mentor@epoka.edu.al', 'mentor');
    classroom.saveCourse({ id: '', title: 'Web', code: 'CEN', description: '' });
    const id = classroom.myCourses[0].id;
    classroom.saveNote({
      id: '',
      courseId: id,
      title: 'Week 1',
      text: 'Notes',
      fileName: '',
      fileData: '',
    });
    await account('other@epoka.edu.al', 'mentor');
    expect(classroom.myCourses).toHaveLength(0);
    expect(() => classroom.deleteCourse(id)).toThrow('own courses');
    expect(() =>
      classroom.saveNote({
        id: '',
        courseId: id,
        title: 'Intruder',
        text: 'x',
        fileName: '',
        fileData: '',
      }),
    ).toThrow('teach');
    await account('student@epoka.edu.al', 'student');
    expect(classroom.notes).toHaveLength(0);
    classroom.enroll(id, true);
    expect(classroom.notes).toHaveLength(1);
    expect(() =>
      classroom.saveCourse({ id, title: 'Changed', code: 'X', description: '' }),
    ).toThrow('Only mentors');
    expect(() => classroom.deleteNote(classroom.notes[0].id)).toThrow('mentor');
    classroom.enroll(id, false);
    expect(classroom.notes).toHaveLength(0);
  });

  it('reads uploaded note files and preserves attachments for enrolled students', async () => {
    await account('mentor@epoka.edu.al', 'mentor');
    classroom.saveCourse({ id: '', title: 'Web', code: 'CEN', description: '' });
    const page = TestBed.runInInjectionContext(() => new Resources());
    page.draft.courseId = classroom.myCourses[0].id;
    page.draft.title = 'Text note';
    const file = new File(['Course content'], 'notes.txt', { type: 'text/plain' });
    await page.selectFile({ target: { files: [file], value: '' } } as unknown as Event);
    expect(page.draft.fileData).toContain('base64,');
    page.save();
    expect(classroom.notes[0].fileName).toBe('notes.txt');
    const rejected = new File(['x'], 'script.html', { type: 'text/html' });
    await page.selectFile({ target: { files: [rejected], value: '' } } as unknown as Event);
    expect(page.message).toContain('PDF');
  });

  it('keeps student requests visible to their course mentor and deletes related content with a course', async () => {
    await account('mentor@epoka.edu.al', 'mentor');
    classroom.saveCourse({ id: '', title: 'Web', code: 'CEN', description: '' });
    const id = classroom.myCourses[0].id;
    await account('student@epoka.edu.al', 'student');
    classroom.enroll(id, true);
    classroom.saveSession({
      id: '',
      courseId: id,
      creatorId: '',
      title: 'Help',
      date: '2099-01-01T10:00',
      status: 'Completed',
    });
    expect(classroom.sessions[0].status).toBe('Requested');
    await auth.login('Test', 'User', 'mentor@epoka.edu.al', 'Password123');
    classroom.saveSession({ ...classroom.sessions[0], status: 'Scheduled' });
    expect(classroom.sessions[0].status).toBe('Scheduled');
    classroom.deleteCourse(id);
    expect(classroom.sessions).toHaveLength(0);
    expect(classroom.notes).toHaveLength(0);
  });

  it('redirects logged-out visitors to login and blocks mentors from the student directory', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/resources');
    expect(TestBed.inject(Router).url).toBe('/login');
    await account('mentor@epoka.edu.al', 'mentor');
    await harness.navigateByUrl('/find-mentors');
    expect(TestBed.inject(Router).url).toBe('/');
    await harness.navigateByUrl('/my-courses');
    expect(harness.routeNativeElement?.textContent).toContain('Courses I Teach');
  });
});
