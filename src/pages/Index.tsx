import { Navigate } from "react-router-dom";

/**
 * `Index` component serves as the entry point for the root path (`/`).
 * It immediately redirects the user to the main dashboard page (`/`).
 * This component is typically used to define a default landing page for the application root.
 * Note: The `replace` prop in `Navigate` ensures that this redirect replaces
 * the current entry in the history stack, so the user doesn't navigate back to it.
 */
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
