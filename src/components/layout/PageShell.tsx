import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import AppHeader from './AppHeader';

interface PageShellProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

const maxWidthMap = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: '',
};

export default function PageShell({ 
  children, 
  maxWidth = 'full', 
  showHeader = true,
  showFooter = true,
  className = ''
}: PageShellProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden flex flex-col font-sans">
      
      {showHeader && <AppHeader />}

      <main className={`container ${maxWidthMap[maxWidth]} py-12 px-4 sm:px-6 lg:px-8 flex-1 w-full mx-auto animate-fade-in ${className}`}>
        {children}
      </main>

      {showFooter && (
        <footer className="glass-panel mt-auto rounded-t-3xl border-b-0 border-x-0">
          <div className="container py-10 px-6 sm:px-8 lg:px-12 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-display font-semibold text-lg text-foreground tracking-tight">MindMate</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  Supporting student mental wellness through intelligent self-assessments, journaling, and guided resources.
                </p>
              </div>

              {/* Platform */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">Platform</h4>
                <nav className="flex flex-col gap-2.5">
                  <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
                  <Link to="/assessments" className="text-sm text-muted-foreground hover:text-primary transition-colors">Assessments</Link>
                  <Link to="/journal" className="text-sm text-muted-foreground hover:text-primary transition-colors">Journal</Link>
                  <Link to="/chat" className="text-sm text-muted-foreground hover:text-primary transition-colors">Chat Support</Link>
                  <Link to="/resources" className="text-sm text-muted-foreground hover:text-primary transition-colors">Resources</Link>
                </nav>
              </div>

              {/* Insights */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">Insights</h4>
                <nav className="flex flex-col gap-2.5">
                  <Link to="/progress" className="text-sm text-muted-foreground hover:text-primary transition-colors">Wellness Progress</Link>
                  <Link to="/trends" className="text-sm text-muted-foreground hover:text-primary transition-colors">Wellness Trends</Link>
                </nav>
              </div>

              {/* Account */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">Account</h4>
                <nav className="flex flex-col gap-2.5">
                  <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">Profile</Link>
                  <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors">Settings</Link>
                  <Link to="/notifications" className="text-sm text-muted-foreground hover:text-primary transition-colors">Notifications</Link>
                </nav>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground font-medium">
                © {currentYear} MindMate. Not a substitute for professional care.
              </p>
              <p className="text-xs text-muted-foreground font-medium bg-secondary/5 px-4 py-2 rounded-full border border-border/50">
                If in crisis, call <span className="font-bold text-destructive">988</span> or your campus counseling center.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
