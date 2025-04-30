
import { Link } from "react-router-dom";
import { HelpCircle, BookOpen, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center gap-4 md:h-16 md:flex-row md:justify-between">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} OrgaMaster AI. Alle rechten voorbehouden.
        </p>
        <nav className="flex items-center gap-4">
          <Link 
            to="/support" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Support</span>
          </Link>
          <Link 
            to="/documentation" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentatie</span>
          </Link>
          <Link 
            to="mailto:support@orgamaster.ai" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Mail className="h-4 w-4" />
            <span>Contact</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
