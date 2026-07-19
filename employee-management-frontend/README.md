# Employee Management System (EMS)

A production-ready, enterprise-grade Employee Management System built with React 19, TypeScript, and Tailwind CSS.

## Features

- 👥 **Employee Management**: Add, edit, delete, and view employee information
- 🔍 **Advanced Filtering**: Search by name, email, filter by department and status
- 📊 **Responsive Design**: Mobile, tablet, and desktop layouts
- ♿ **Accessible**: ARIA labels, keyboard navigation, semantic HTML
- 🎨 **Modern UI**: SaaS-style interface with smooth animations
- 🌙 **Dark Mode Ready**: Tailwind CSS with theme configuration
- ⚡ **Performance**: Optimized with React 19 features and Framer Motion
- 📦 **Type Safe**: Full TypeScript support with strict mode

## Tech Stack

- **React 19** - Latest React features and optimizations
- **Vite** - Lightning-fast build tool and dev server
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library
- **Inter Font** - Professional typeface

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Alert.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSkeleton.tsx
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── employees/       # Feature-specific components
│       ├── EmployeeCard.tsx
│       ├── EmployeeList.tsx
│       ├── EmployeeFilters.tsx
│       ├── EmployeeForm.tsx
│       └── DeleteConfirmDialog.tsx
├── pages/
│   └── EmployeesPage.tsx
├── hooks/               # Custom React hooks
├── utils/               # Helper functions and utilities
├── types/               # TypeScript type definitions
├── styles/              # Global styles
├── App.tsx              # Root component
└── main.tsx             # Entry point

```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

## Design System

### Colors
- **Primary**: #4F46E5
- **Background**: #F8FAFC
- **Sidebar**: #0F172A
- **Card**: #FFFFFF
- **Border**: #E2E8F0
- **Text Primary**: #0F172A
- **Text Secondary**: #64748B

### Spacing (8px system)
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 40px
- 3xl: 48px

### Typography
- **Font**: Inter
- **Headings**: Bold (700)
- **Body**: Regular (400)
- **Emphasis**: Medium (500)

### Shadows
- Soft shadows only for subtle depth
- No harsh shadows
- Focus states with outline

### Border Radius
- Default: 12px
- Large: 16px
- Extra Large: 20px

## Accessibility

The application follows WCAG 2.1 AA standards:
- ♿ Keyboard navigation support
- 📝 ARIA labels and descriptions
- 🎯 Semantic HTML structure
- 🔍 Focus indicators
- 📱 Touch-friendly controls

## Performance

- Lazy loading of routes
- Memoized components
- Optimized re-renders
- Debounced search
- Smooth animations with Framer Motion

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for personal or commercial purposes.
