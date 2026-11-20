import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';

interface Course {
  id: string;
  title: string;
  code: string;
  mentor: string;
  status: string;
}

@Component({
  selector: 'app-my-courses',
  imports: [FormsModule],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.scss',
})
export class MyCourses {
  private readonly storage = inject(StorageService);
  records = this.storage.read<Course[]>('courses', []);
  draft: Course = this.emptyRecord();
  search = '';
  message = '';

  get filteredRecords(): Course[] {
    const query = this.search.toLowerCase().trim();
    return this.records.filter(record => Object.values(record).some(value => value.toLowerCase().includes(query)));
  }

  save(): void {
    if (!this.draft.title.trim()) return;
    if (!this.draft.code.trim()) return;
    if (!this.draft.mentor.trim()) return;
    if (!this.draft.status.trim()) return;
    const record = { ...this.draft, id: this.draft.id || crypto.randomUUID() };
    const next = this.draft.id
      ? this.records.map(item => item.id === record.id ? record : item)
      : [...this.records, record];
    if (!this.storage.write('courses', next)) {
      this.message = 'Could not save. Browser storage may be full or disabled.';
      return;
    }
    this.records = next;
    this.draft = this.emptyRecord();
    this.message = 'Saved successfully.';
  }

  edit(record: Course): void {
    this.draft = { ...record };
    this.message = '';
  }

  remove(record: Course): void {
    if (!window.confirm('Delete this course?')) return;
    const next = this.records.filter(item => item.id !== record.id);
    if (!this.storage.write('courses', next)) {
      this.message = 'Could not delete. Browser storage is unavailable.';
      return;
    }
    this.records = next;
    if (this.draft.id === record.id) this.cancel();
    this.message = 'Deleted successfully.';
  }

  cancel(): void {
    this.draft = this.emptyRecord();
    this.message = '';
  }

  private emptyRecord(): Course {
    return {
      id: '',
      title: '',
      code: '',
      mentor: '',
      status: 'Not started',
    };
  }
}
