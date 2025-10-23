import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact-page',
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss']
})
export class ContactPageComponent {
  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public router: Router
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      alert('Thank you! We will contact you shortly.');
      this.contactForm.reset();
    }
  }
}