import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-order-tracking-page',
  templateUrl: './order-tracking-page.component.html',
  styleUrls: ['./order-tracking-page.component.scss']
})
export class OrderTrackingPageComponent implements OnInit {
  isLoggedIn = false;
  loading = false;
  trackingForm: FormGroup;
  publicOrders: any[] = [];
  userOrders: any[] = [];

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private apiService: ApiService
  ) {
    this.trackingForm = this.fb.group({
      orderNumber: [''],
      mobile: [''],
      email: ['']
    });
  }

  ngOnInit(): void {
    const token = localStorage.getItem('auth_token');
    this.isLoggedIn = !!token;
    if (token) {
      this.fetchUserOrders();
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  fetchUserOrders(): void {
    this.loading = true;
    this.apiService.get('/orders/my-orders').subscribe({
      next: (data: any) => {
        this.userOrders = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  handlePublicTracking(): void {
    if (!this.trackingForm.value.orderNumber && !this.trackingForm.value.mobile && !this.trackingForm.value.email) {
      alert('Please provide Order Number OR Mobile/Email');
      return;
    }

    this.loading = true;
    const formData = new FormData();
    
    if (this.trackingForm.value.orderNumber) {
      formData.append('order_number', this.trackingForm.value.orderNumber);
    }
    if (this.trackingForm.value.mobile) {
      formData.append('mobile', this.trackingForm.value.mobile);
    }
    if (this.trackingForm.value.email) {
      formData.append('email', this.trackingForm.value.email);
    }

    this.apiService.postFormData('/orders/track', formData).subscribe({
      next: (data: any) => {
        this.publicOrders = data;
        this.loading = false;
        alert(`Found ${data.length} order(s)!`);
      },
      error: () => {
        this.publicOrders = [];
        this.loading = false;
        alert('No orders found');
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'Estimated': 'bg-gray-100 text-gray-800',
      'Paid': 'bg-blue-100 text-blue-800',
      'Assigned': 'bg-purple-100 text-purple-800',
      'InProduction': 'bg-orange-100 text-orange-800',
      'ReadyForPickup': 'bg-green-100 text-green-800',
      'Completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}