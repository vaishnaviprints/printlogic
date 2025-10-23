# Quick Start Guide - Angular Frontend

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend-angular directory:
```bash
cd frontend-angular
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

## Configuration

### Environment Variables

Update the backend URL in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  backendUrl: 'http://localhost:5000'  // Change this to your backend URL
};
```

## Project Structure

```
src/
├── app/
│   ├── guards/          # Route guards
│   ├── pages/           # Page components
│   ├── services/        # Services (API, Auth)
│   └── app.module.ts    # Main module
├── assets/              # Static assets
├── environments/        # Environment configs
└── styles.scss          # Global styles
```

## Key Features

- **Angular 17** with TypeScript
- **Tailwind CSS** for styling
- **Angular Router** for navigation
- **RxJS** for reactive programming
- **HTTP Client** for API calls

## Available Pages

### Public Pages
- `/` - Home Page ✅ (fully implemented)
- `/about` - About Page
- `/pricing` - Pricing Page
- `/contact` - Contact Page
- `/track` - Order Tracking

### Customer Pages
- `/login` - Customer Login ✅ (fully implemented)
- `/register` - Customer Registration
- `/print` - Print Portal
- `/my-orders` - My Orders

### Vendor Pages
- `/vendor/login` - Vendor Login
- `/vendor/dashboard` - Vendor Dashboard

### Admin Pages
- `/system-admin-portal-2025/login` - Admin Login
- `/system-admin-portal-2025` - Admin Dashboard

## Building for Production

```bash
npm run build
```

Output will be in `dist/frontend-angular/`

## Development Tips

### Adding a New Component

1. Create component files:
```bash
# Create component directory
mkdir src/app/pages/my-new-page

# Create component files
touch src/app/pages/my-new-page/my-new-page.component.ts
touch src/app/pages/my-new-page/my-new-page.component.html
touch src/app/pages/my-new-page/my-new-page.component.scss
```

2. Register in `app.module.ts`:
```typescript
import { MyNewPageComponent } from './pages/my-new-page/my-new-page.component';

@NgModule({
  declarations: [
    // ... other components
    MyNewPageComponent
  ],
  // ...
})
```

3. Add route in `app-routing.module.ts`:
```typescript
{ path: 'my-new-page', component: MyNewPageComponent }
```

### Converting from React

**React JSX:**
```jsx
const [count, setCount] = useState(0);
return <button onClick={() => setCount(count + 1)}>{count}</button>;
```

**Angular:**
```typescript
count = 0;
increment() { this.count++; }
```

```html
<button (click)="increment()">{{ count }}</button>
```

## Common Commands

```bash
# Development
npm start

# Build
npm run build

# Watch mode
npm run watch
```

## Support

For more details, see:
- `README.md` - Full documentation
- `CONVERSION_SUMMARY.md` - Conversion details
- Original React code in `../frontend/` for reference
