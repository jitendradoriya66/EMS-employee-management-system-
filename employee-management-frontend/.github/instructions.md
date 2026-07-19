# GitHub Copilot Instructions

This workspace contains an Employee Management System built with React 19, TypeScript, and Tailwind CSS.

## Development Guidelines

### Code Style
- Use TypeScript with strict mode enabled
- Follow functional component patterns with hooks
- Use proper naming conventions (PascalCase for components, camelCase for functions)
- Keep components small and focused on a single responsibility

### Component Structure
- Place reusable components in `src/components/common/`
- Place layout components in `src/components/layout/`
- Place feature-specific components in `src/components/[feature]/`
- Create custom hooks in `src/hooks/`

### File Organization
- One component per file (except for closely related components)
- Use descriptive file names matching component names
- Group related utilities together
- Keep type definitions in `src/types/`

### Styling
- Use Tailwind CSS utility classes
- Follow the 8px spacing system
- Use custom components defined in `src/styles/globals.css`
- Maintain consistent color usage from the design system

### Performance
- Use React.memo for expensive components
- Implement proper loading and error states
- Debounce search inputs
- Lazy load routes when appropriate

### Accessibility
- Always include ARIA labels
- Use semantic HTML elements
- Ensure keyboard navigation works
- Test with screen readers

### Testing & Quality
- Write clear, maintainable code
- Add error handling to async operations
- Validate form inputs on both client and server
- Include fallback UI for failed operations

### Git Workflow
- Create feature branches for new features
- Write descriptive commit messages
- Keep commits atomic and focused
- Create pull requests for review

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## Project Resources

- Design System: See `tailwind.config.js`
- API Utilities: `src/utils/api.ts`
- Helper Functions: `src/utils/helpers.ts`
- Custom Hooks: `src/hooks/index.ts`
- Type Definitions: `src/types/index.ts`

## Notes

- The project uses mock data for demonstration
- Use the API utilities to integrate with a real backend
- All components are fully typed with TypeScript
- Framer Motion is used for animations and transitions
- Dark mode can be enabled by adding dark class support to Tailwind config
