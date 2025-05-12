import { Link } from "react-router-dom";
import { HelpCircle, Mail } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const appVersion = "v1.0.0";

  return (
    <footer className="hidden md:block border-t border-white/10 py-[18px] bg-gradient-to-b from-transparent to-gray-900/50 backdrop-blur-sm z-30">
      <div className="container flex flex-col items-center gap-2 md:flex-row md:justify-between">
        <p className="hidden md:block text-sm leading-loose text-muted-foreground">
          &copy; {new Date().getFullYear()} OrgaMaster AI. {appVersion}
        </p>
        <p className="block text-center text-sm text-muted-foreground">
          {t('footer.builtWith')} <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">❤️</span> {t('footer.by')}{" "}
          <a 
            href="https://www.artifexai.nl" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold hover:underline bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
          >
            Artifex AI
          </a>
        </p>
        <nav className="hidden md:flex md:items-center md:gap-4">
          <Link 
            to="/support" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span>{t('footer.links.support')}</span>
          </Link>
          <Link 
            to="/contact"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>{t('footer.links.contact')}</span>
          </Link>
        </nav>
      </div>
    </footer>
  );
}
