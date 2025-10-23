# Vaishnavi Printers - Angular Frontend

This is the Angular version of the Vaishnavi Printers frontend application, converted from the original React codebase.

## Project Structure

```
frontend-angular/
├── src/
│   ├── app/
│   │   ├── guards/           # Route guards for authentication
│   │   ├── pages/            # Page components
│   │   ├── services/         # Services (API, Auth, etc.)
│   │   ├── app.component.ts  # Root component
│   │   ├── app.module.ts     # Root module
│   │   └── app-routing.module.ts  # Routing configuration
│   ├── assets/               # Static assets
│   ├── environments/         # Environment configurations
│   ├── index.html            # Main HTML file
│   ├── main.ts               # Bootstrap file
│   └── styles.scss           # Global styles
├── angular.json              # Angular CLI configuration
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Key Features

- **Angular 17** with TypeScript
- **Tailwind CSS** for styling (matching original design)
- **Angular Router** for navigation
- **RxJS** for reactive programming
- **HTTP Client** for API calls
- **Angular Material** (optional, ready to integrate)

## Installation

1. Navigate to the frontend-angular directory:
```bash
cd frontend-angular
```

2. Install dependencies:
```bash
npm install
```

## Development

Run the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

## Building for Production

Build the application:
```bash
npm run build
```

The output will be in the `dist/frontend-angular` directory.

## Environment Configuration

Set the backend URL in the environment files:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

Default backend URL: `http://localhost:5000`

## Pages Implemented

### Public Pages
- ✅ Home Page (fully implemented)
- ✅ About Page (stub)
- ✅ Pricing Page (stub)
- ✅ Contact Page (stub)
- ✅ Order Tracking Page (stub)
- ✅ Customer Terms Page (stub)
- ✅ In Store Page (stub)

### Authentication Pages
- ✅ Customer Login Page (stub)
- ✅ Customer Register Page (stub)
- ✅ Forgot Password Page (stub)
- ✅ Vendor Login Page (stub)
- ✅ Vendor Forgot Password Page (stub)
- ✅ Admin Login Page (stub)

### Customer Pages
- ✅ Customer Print Portal (stub)
- ✅ My Orders Page (stub)
- ✅ Customer Profile Page (stub)
- ✅ Customer Settings Page (stub)

### Vendor Pages
- ✅ Vendor Dashboard (stub)
- ✅ Vendor Pricing Page (stub)
- ✅ Vendor Bank Details Page (stub)
- ✅ Vendor Business Profile Page (stub)

### Admin Pages
- ✅ Admin Dashboard (stub)
- ✅ Order Success Page (stub)

## Services

### AuthService
- `login(email, password)` - Admin login
- `logout()` - Logout user
- `isAuthenticated()` - Check authentication status
- `getCurrentUser()` - Get current user

### ApiService
- `get(endpoint)` - GET request
- `post(endpoint, data)` - POST request
- `put(endpoint, data)` - PUT request
- `delete(endpoint)` - DELETE request
- `postFormData(endpoint, formData)` - POST with FormData

## Guards

### AuthGuard
Protects admin routes and redirects to login if not authenticated.

## Converting from React

### Key Differences

1. **Components**: React uses functional components with hooks, Angular uses classes or standalone components
2. **State Management**: React uses useState/useEffect, Angular uses RxJS Observables
3. **Routing**: React Router vs Angular Router
4. **Forms**: React Hook Form vs Angular Reactive Forms
5. **Lifecycle**: React useEffect vs Angular lifecycle hooks

### Common Conversions

**React (useState):**
```javascript
const [count, setCount] = useState(0);
setCount(count + 1);
```

**Angular:**
```typescript
count = 0;
increment() {
  this.count++;
}
```

**React (useEffect):**
```javascript
useEffect(() => {
  fetchData();
}, []);
```

**Angular:**
```typescript
ngOnInit() {
  this.fetchData();
}
```

**React (useNavigate):**
```javascript
const navigate = useNavigate();
navigate('/home');
```

**Angular:**
```typescript
constructor(private router: Router) {}
navigateToHome() {
  this.router.navigate(['/home']);
}
```

## Next Steps

1. **Implement Page Components**: Convert the React components to Angular components
   - Extract HTML templates from React JSX
   - Convert hooks to Angular lifecycle hooks
   - Replace axios calls with HttpClient
   - Convert form handling to Angular Reactive Forms

2. **UI Components**: Create shared UI components
   - Buttons, Cards, Inputs, etc.
   - Consider using Angular Material or custom components

3. **State Management**: Add NgRx or RxJS for complex state management if needed

4. **Testing**: Add unit tests with Jasmine/Karma

5. **Socket.io**: Implement real-time features with Socket.io

## API Integration

The application is configured to work with the existing backend API. Update the environment files to point to your backend URL.

## Notes

- This is a conversion from React to Angular
- Not all pages are fully implemented yet (most are stubs)
- The Home Page is fully implemented as an example
- The styling uses Tailwind CSS to match the original design
- Authentication flow is implemented via services and guards

## Support

For issues or questions, please refer to the original React implementation in the `frontend` directory.
