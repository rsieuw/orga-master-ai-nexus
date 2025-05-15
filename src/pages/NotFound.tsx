import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * `NotFound` component is displayed when a user navigates to a route that does not exist.
 * It shows a 404 error message and provides a link to return to the homepage.
 * It also logs an error to the console with the path that was attempted.
 */
const NotFound = () => {
  const location = useLocation();

  /**
   * useEffect hook to log an error to the console when the component mounts.
   * This helps in debugging by recording the non-existent route that was accessed.
   * It runs only once when the component mounts or if the `location.pathname` changes (though typically it won't for a 404 page).
   */
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
