import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pricing-page',
  templateUrl: './pricing-page.component.html',
  styleUrls: ['./pricing-page.component.scss']
})
export class PricingPageComponent implements OnInit {
  priceRule: any = null;
  loading = true;

  constructor(
    public router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.fetchPricing();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  fetchPricing(): void {
    this.apiService.get('/price-rules/active').subscribe({
      next: (data) => {
        this.priceRule = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to fetch pricing:', error);
        this.loading = false;
      }
    });
  }
}