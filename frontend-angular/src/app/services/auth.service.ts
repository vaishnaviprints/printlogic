import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.checkAuth();
  }

  private checkAuth(): void {
    const token = localStorage.getItem('admin_token');
    if (token) {
      this.fetchCurrentUser();
    }
  }

  private fetchCurrentUser(): void {
    this.apiService.get('/auth/me').subscribe({
      next: (user) => this.userSubject.next(user),
      error: () => this.logout()
    });
  }

  login(email: string, password: string): Observable<any> {
    return new Observable(observer => {
      this.apiService.post('/auth/login', { email, password }).subscribe({
        next: (response: any) => {
          const { access_token, user: userData } = response;
          localStorage.setItem('admin_token', access_token);
          this.userSubject.next(userData);
          observer.next(userData);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('auth_token');
    this.userSubject.next(null);
  }

  getCurrentUser(): any {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('admin_token');
  }
}
