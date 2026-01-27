# Components Directory

This directory contains reusable React components for the SMP Admin Panel.

## Structure

Components should be:
- **Reusable**: Can be used across multiple pages
- **Self-contained**: Include their own styles and logic
- **Well-documented**: Include comments explaining props and usage
- **TypeScript**: Use proper TypeScript types for props

## Example Components

### Button Component
A reusable button with different variants (primary, secondary, success, danger).

Usage:
```tsx
import Button from '@/components/Button';

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

## Creating New Components

1. Create a new `.tsx` file in this directory
2. Define TypeScript interfaces for props
3. Use Tailwind CSS for styling
4. Export the component as default
5. Add documentation comments

Example:
```tsx
/**
 * MyComponent - Brief description
 * 
 * Usage:
 * import MyComponent from '@/components/MyComponent';
 * <MyComponent prop1="value" />
 */

interface MyComponentProps {
  prop1: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ prop1 }) => {
  return <div>{prop1}</div>;
};

export default MyComponent;
```

## Future Components to Implement

- **LoginForm**: 2FA login form with OTP input
- **ServerConsole**: Terminal-like interface for server console
- **ServerCard**: Display server status and information
- **PlayerList**: Table/list of online players
- **NavigationBar**: Main navigation component
- **LoadingSpinner**: Loading indicator
- **Modal**: Reusable modal dialog
- **Toast**: Notification/toast messages
