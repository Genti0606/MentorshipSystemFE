import { RouterLink } from '@angular/router';
import { StorageService } from '../../shared/storage.service';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [MatButtonModule, MatCardModule, MatIconModule, NgOptimizedImage, RouterLink, DatePipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly storage = inject(StorageService);
  readonly name = this.storage.read<{ name: string } | null>('profile', null)?.name || 'Student';
  readonly courseCount = this.storage.read<unknown[]>('courses', []).length;
  readonly resourceCount = this.storage.read<unknown[]>('resources', []).length;
  readonly upcomingSessions = this.storage.read<{ id: string; title: string; date: string; status: string }[]>('sessions', [])
    .filter(session => session.status === 'Scheduled' && new Date(session.date).getTime() >= Date.now())
    .sort((a, b) => a.date.localeCompare(b.date));
}
