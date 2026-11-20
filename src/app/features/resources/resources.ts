import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/auth.service';
import { CourseService, Note } from '../../shared/course.service';

@Component({
  selector: 'app-resources',
  imports: [FormsModule],
  templateUrl: './resources.html',
  styleUrl: './resources.scss',
})
export class Resources {
  readonly auth = inject(AuthService);
  readonly classroom = inject(CourseService);
  draft: Note = this.empty();
  search = '';
  courseFilter = '';
  message = '';
  busy = false;
  private fileInput?: HTMLInputElement;
  get records(): Note[] {
    return this.classroom.notes.filter(
      (n) =>
        (!this.courseFilter || n.courseId === this.courseFilter) &&
        (n.title + n.text + this.classroom.courseTitle(n.courseId))
          .toLowerCase()
          .includes(this.search.toLowerCase()),
    );
  }

  async selectFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.fileInput = input;
    const file = input.files?.[0];
    if (!file) return;
    if (!/\.(pdf|txt|docx)$/i.test(file.name) || file.size > 1024 * 1024) {
      this.message = 'Choose a PDF, TXT, or DOCX file up to 1 MB.';
      input.value = '';
      return;
    }
    this.busy = true;
    this.message = '';
    try {
      this.draft.fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsDataURL(file);
      });
      this.draft.fileName = file.name;
    } catch (e) {
      this.message = (e as Error).message;
    } finally {
      this.busy = false;
    }
  }

  clearFile(): void {
    this.draft.fileName = '';
    this.draft.fileData = '';
    if (this.fileInput) this.fileInput.value = '';
  }

  save(): void {
    if (this.busy) return;
    try {
      this.classroom.saveNote(this.draft);
      this.cancel();
      this.message = 'Note saved.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
  edit(note: Note): void {
    this.draft = { ...note };
    if (this.fileInput) this.fileInput.value = '';
    this.message = '';
  }
  cancel(): void {
    this.draft = this.empty();
    if (this.fileInput) this.fileInput.value = '';
    this.message = '';
  }
  remove(note: Note): void {
    if (!confirm('Delete this course note?')) return;
    try {
      this.classroom.deleteNote(note.id);
      if (this.draft.id === note.id) this.cancel();
      this.message = 'Note deleted.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
  download(note: Note): void {
    if (!this.classroom.canRead(note.courseId) || !note.fileData) return;
    try {
      const encoded = note.fileData.split(',')[1];
      const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = note.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      this.message = 'Could not download this file.';
    }
  }
  private empty(): Note {
    return { id: '', courseId: '', title: '', text: '', fileName: '', fileData: '' };
  }
}
