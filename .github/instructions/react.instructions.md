---
applyTo: "**/*.tsx"
---

## Avoid importing the entire React module when only specific functions or types are needed

When you only need certain functions or types from React, **do not import the entire React module**. Instead, import only what you need. For type-only imports, use `import type` to make it clear that you are only importing types.

Bad:

```tsx
import * as React from "react";

function MyButton() {
  const ref: React.Ref<HTMLDivElement> = React.createRef();
  const [state, setState] = React.useState(0);
  return (
    <button ref={ref} onClick={() => setState(state + 1)}>
      Click me
    </button>
  );
}
```

Good:

```tsx
import { createRef, useState, type Ref } from "react";

function MyButton() {
  const ref: Ref<HTMLDivElement> = createRef();
  const [state, setState] = useState(0);
  return (
    <button ref={ref} onClick={() => setState(state + 1)}>
      Click me
    </button>
  );
}
```

## Export components as named exports

When exporting components, always use named exports instead of default exports.

## Prefer named functions over arrow functions

Always use named functions. Do not use anonymous arrow functions unless it is an inline callback (e.g., `someArray.map(obj => obj.id)`).

Bad:

```tsx
const MyComponent = () => {
  return <div>Hello</div>;
};
```

Good:

```tsx
function MyComponent() {
  return <div>Hello</div>;
}
```

## Export inline instead of general export

Always export components inline. Do not use separate export statements for components.

Bad:

```tsx
function MyComponent() {
  return <div>Hello</div>;
}

export { MyComponent };
```

Good:

```tsx
export function MyComponent() {
  return <div>Hello</div>;
}
```

## Avoid adding comments that restate the code

Never add comments that simply restate what the code does. Only add comments if they provide additional context or explanation.

Bad:

```tsx
// This function returns the sum of two numbers
function add(a: number, b: number): number {
  return a + b;
}
```

Good:

```tsx
function add(a: number, b: number): number {
  return a + b;
}
```

## Use TypeScript interfaces for component props

When defining React component props with more than one prop, always use TypeScript interfaces. Do not use inline types for props. For single prop components, inline types are acceptable.

Bad:

```tsx
function MyComponent(props: { title: string; content: string }) {
  return <div>{props.title}</div>;
}
```

Good:

```tsx
interface MyComponentProps {
  title: string;
  content: string;
}

function MyComponent(props: MyComponentProps) {
  return <div>{props.title}</div>;
}
```

For single props, inline types are acceptable:

```tsx
function MyComponent(props: { title: string }) {
  return <div>{props.title}</div>;
}
```

## Always destructure props in function parameters

Always destructure props directly in the function parameters instead of accessing them from a props object.

Bad:

```tsx
interface MyComponentProps {
  title: string;
  content: string;
}

function MyComponent(props: MyComponentProps) {
  return (
    <div>
      <h1>{props.title}</h1>
      <p>{props.content}</p>
    </div>
  );
}
```

Good:

```tsx
interface MyComponentProps {
  title: string;
  content: string;
}

function MyComponent({ title, content }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>{content}</p>
    </div>
  );
}
```

## Prefer React's built-in types when applicable

Use React's built-in types like `ComponentPropsWithoutRef`, `ComponentPropsWithRef`, `PropsWithChildren`, etc., when they are applicable instead of creating custom types.

Bad:

```tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  className,
  disabled,
}: ButtonProps) {
  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
}
```

Good:

```tsx
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  onClick: () => void;
}

export function Button({
  children,
  onClick,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
}
```

## Never use `forwardRef`, it's deprecated

Pass ref as a prop instead of using `forwardRef`.

Bad:

```tsx
import { forwardRef, type HTMLAttributes } from "react";

export const MyDiv = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function MyDiv({ ...props }, ref) {
    return <div ref={ref} {...props} />;
  }
);
```

Good:

```tsx
import type { ComponentPropsWithRef } from "react";

export function MyDiv({ ref, ...props }: ComponentPropsWithRef<"div">) {
  return <div ref={ref} {...props} />;
}
```
