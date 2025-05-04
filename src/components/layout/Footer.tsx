import { Link } from "react-router-dom";
import { HelpCircle, BookOpen, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-6 md:py-0 bg-gradient-to-b from-transparent to-gray-900/50 backdrop-blur-sm">
      <div className="container flex flex-col items-center gap-4 md:h-16 md:flex-row md:justify-between">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} OrgaMaster AI. Alle rechten voorbehouden.
        </p>
        <p className="text-center text-sm text-muted-foreground md:text-right">
          Gebouwd met ❤️ door{" "}
          <a 
            href="https://www.artifexai.nl" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold"
          >
            Artifex AI
          </a>
        </p>
        <nav className="flex items-center gap-4">
          <Link 
            to="/support" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Support</span>
          </Link>
          <Link 
            to="/documentation" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentatie</span>
          </Link>
          <Link 
            to="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>Contact</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
