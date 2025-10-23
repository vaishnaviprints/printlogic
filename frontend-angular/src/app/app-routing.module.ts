import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { CustomerLoginPageComponent } from './pages/customer-login-page/customer-login-page.component';
import { CustomerRegisterPageComponent } from './pages/customer-register-page/customer-register-page.component';
import { VendorLoginPageComponent } from './pages/vendor-login-page/vendor-login-page.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { PricingPageComponent } from './pages/pricing-page/pricing-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { OrderTrackingPageComponent } from './pages/order-tracking-page/order-tracking-page.component';
import { CustomerTermsPageComponent } from './pages/customer-terms-page/customer-terms-page.component';
import { InStorePageComponent } from './pages/in-store-page/in-store-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { CustomerPrintPortalComponent } from './pages/customer-print-portal/customer-print-portal.component';
import { MyOrdersPageComponent } from './pages/my-orders-page/my-orders-page.component';
import { CustomerProfilePageComponent } from './pages/customer-profile-page/customer-profile-page.component';
import { CustomerSettingsPageComponent } from './pages/customer-settings-page/customer-settings-page.component';
import { VendorDashboardComponent } from './pages/vendor-dashboard/vendor-dashboard.component';
import { VendorPricingPageComponent } from './pages/vendor-pricing-page/vendor-pricing-page.component';
import { VendorBankDetailsPageComponent } from './pages/vendor-bank-details-page/vendor-bank-details-page.component';
import { VendorBusinessProfilePageComponent } from './pages/vendor-business-profile-page/vendor-business-profile-page.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { OrderSuccessPageComponent } from './pages/order-success-page/order-success-page.component';
import { VendorForgotPasswordPageComponent } from './pages/vendor-forgot-password-page/vendor-forgot-password-page.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  // Public routes
  { path: '', component: HomePageComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'pricing', component: PricingPageComponent },
  { path: 'contact', component: ContactPageComponent },
  { path: 'track', component: OrderTrackingPageComponent },
  { path: 'track/:orderId', component: OrderTrackingPageComponent },
  { path: 'terms/customer', component: CustomerTermsPageComponent },
  { path: 'instore', component: InStorePageComponent },
  
  // Customer routes
  { path: 'login', component: CustomerLoginPageComponent },
  { path: 'register', component: CustomerRegisterPageComponent },
  { path: 'forgot-password', component: ForgotPasswordPageComponent },
  { path: 'print', component: CustomerPrintPortalComponent },
  { path: 'my-orders', component: MyOrdersPageComponent },
  { path: 'customer/profile', component: CustomerProfilePageComponent },
  { path: 'customer/settings', component: CustomerSettingsPageComponent },
  
  // Vendor routes
  { path: 'vendor/login', component: VendorLoginPageComponent },
  { path: 'vendor/forgot-password', component: VendorForgotPasswordPageComponent },
  { path: 'vendor/dashboard', component: VendorDashboardComponent },
  { path: 'vendor/pricing', component: VendorPricingPageComponent },
  { path: 'vendor/bank-details', component: VendorBankDetailsPageComponent },
  { path: 'vendor/profile', component: VendorBusinessProfilePageComponent },
  
  // Admin routes
  { path: 'system-admin-portal-2025/login', component: AdminLoginPageComponent },
  { path: 'system-admin-portal-2025', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'system-admin-portal-2025/:tab', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  
  // Redirects
  { path: 'admin/login', redirectTo: '/system-admin-portal-2025/login', pathMatch: 'full' },
  { path: 'admin', redirectTo: '/system-admin-portal-2025/orders', pathMatch: 'full' },
  
  // Fallback
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
