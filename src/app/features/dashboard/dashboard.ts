import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { NgOptimizedImage} from '@angular/common';

@Component({
  imports: [
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatButtonModule,
    NgOptimizedImage
  ],
  standalone: true,
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {}


