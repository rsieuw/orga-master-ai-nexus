
import { Navigate } from "react-router-dom";

// Redirect to dashboard from index page
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
