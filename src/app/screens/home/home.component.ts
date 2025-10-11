import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  sidebarOpen: boolean = true;
  username: string = 'João';
  isAnimating: boolean = true;
  showContent: boolean = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.isAnimating = false;
    }, 800);

    setTimeout(() => {
      this.showContent = true;
    }, 400);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
