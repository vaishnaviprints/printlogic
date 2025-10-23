import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-customer-login-page',
  templateUrl: './customer-login-page.component.html',
  styleUrls: ['./customer-login-page.component.scss']
})
export class CustomerLoginPageComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private apiService: ApiService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.checkExistingSession();
  }

  checkExistingSession(): void {
    this.apiService.get('/auth/session/verify').subscribe({
      next: (response: any) => {
        if (response.authenticated) {
          this.router.navigate(['/my-orders']);
        }
      },
      error: () => {
        // Not logged in, show login page
      }
    });
  }

  handleGoogleLogin(): void {
    // Option 1: Use backend's Google OAuth (if configured)
    // This redirects to your backend which handles Google OAuth
    const backendUrl = 'http://localhost:5000';
    const googleAuthUrl = `${backendUrl}/api/auth/google/login`;
    
    // Option 2: For now, show a message that Google login needs backend configuration
    alert('Google login requires backend configuration. Please use email/password login for now.');
    
    // Uncomment the line below when backend is configured:
    // window.location.href = googleAuthUrl;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const formData = new FormData();
      formData.append('email', this.loginForm.value.email);
      formData.append('password', this.loginForm.value.password);

      this.apiService.postFormData('/auth/customer/login', formData).subscribe({
        next: (response: any) => {
          localStorage.setItem('auth_token', response.access_token);
          this.router.navigate(['/my-orders']);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.loading = false;
          alert('Login failed. Please check your credentials.');
        }
      });
    }
  }
}