import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SuggestionsService } from '../../../core/services/suggestions.service';
import { AppLogoComponent } from '../app-logo/app-logo.component';
import { SuggestionModalComponent } from '../suggestion-modal/suggestion-modal.component';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AppLogoComponent, SuggestionModalComponent],
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.css'
})
export class PageShellComponent {
  readonly compact = input(false);
  readonly immersive = input(false);
  mobileMenuOpen = false;

  constructor(
    public readonly authService: AuthService,
    public readonly suggestionsService: SuggestionsService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen = false;
    void this.router.navigate(['/login']);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  openSuggestions(): void {
    this.mobileMenuOpen = false;
    this.suggestionsService.openModal();
  }
}
