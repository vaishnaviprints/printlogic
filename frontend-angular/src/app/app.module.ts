import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
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

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    CustomerLoginPageComponent,
    CustomerRegisterPageComponent,
    VendorLoginPageComponent,
    AdminLoginPageComponent,
    AboutPageComponent,
    PricingPageComponent,
    ContactPageComponent,
    OrderTrackingPageComponent,
    CustomerTermsPageComponent,
    InStorePageComponent,
    ForgotPasswordPageComponent,
    CustomerPrintPortalComponent,
    MyOrdersPageComponent,
    CustomerProfilePageComponent,
    CustomerSettingsPageComponent,
    VendorDashboardComponent,
    VendorPricingPageComponent,
    VendorBankDetailsPageComponent,
    VendorBusinessProfilePageComponent,
    AdminDashboardComponent,
    OrderSuccessPageComponent,
    VendorForgotPasswordPageComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    AppRoutingModule
  ],
  providers: [
    AuthService,
    ApiService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
