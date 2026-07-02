import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Brain, ArrowRight, TrendingUp, Library, MessageCircle, Sparkles, BookOpen, Shield, Sun, Moon } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const featureCards = [
    {
      icon: TrendingUp,
      title: 'Personalized Insights',
      description: 'Unique insights into your mental health trends, risk levels, and wellness patterns over time.',
      link: '/insights',
      accent: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      icon: Library,
      title: 'Supportive Resources',
      description: 'Access articles, videos, and campus services tailored to your needs.',
      link: '/resources',
      accent: 'bg-secondary/10 text-secondary border-secondary/20',
    },
    {
      icon: MessageCircle,
      title: 'Chatbot Support',
      description: 'Speak with an AI-powered support bot anytime for guidance and coping strategies.',
      link: '/chat',
      accent: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  ];

  const exploreLinks = [
    { title: 'Community Support', href: '/community' },
    { title: 'Habit Tracking', href: '/habits' },
    { title: 'Smart Journaling', href: '/journal' },
  ];

  return (
    <div className="min-h-screen bg-mesh font-sans relative overflow-hidden flex flex-col">
      {/* Ambient background is handled by bg-mesh */}
      
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 rounded-b-3xl border-t-0 border-x-0 transition-all duration-300">
        <nav className="container px-4 sm:px-6 lg:px-8 mx-auto flex h-20 items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 border border-primary/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="text-2xl font-semibold font-display tracking-tight text-foreground">MindMate</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-10 w-10 rounded-full hover:bg-secondary/10"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link to="/auth" className="hidden sm:inline-block">
              <Button variant="ghost" className="rounded-full font-medium hover:bg-primary/10 text-muted-foreground hover:text-foreground">Log in</Button>
            </Link>
            <Link to="/auth">
              <Button className="rounded-full px-6 bg-primary text-primary-foreground shadow-sm hover-lift font-medium">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 w-full mx-auto">
        {/* Hero Section */}
        <section className="container px-4 sm:px-6 lg:px-8 mx-auto py-20 md:py-32 relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-8 animate-fade-in-up border border-primary/20">
              <Sparkles className="h-4 w-4" />
              Your Mental Wellness Companion
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl animate-fade-in-up opacity-0 stagger-2 text-foreground mb-6 leading-[1.1]">
              Find your balance with <span className="text-primary italic pr-2">MindMate</span>
            </h1>
            <p className="mt-8 text-xl text-muted-foreground md:text-2xl animate-fade-in-up opacity-0 stagger-3 max-w-2xl mx-auto leading-relaxed">
              Enhance your mental well-being with personalized insights, AI-powered support, and evidence-based tools designed specifically for students.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0 stagger-4">
              <Link to="/auth">
                <Button size="lg" className="px-8 rounded-full h-14 text-base font-bold bg-primary text-primary-foreground hover-lift transition-all">
                  Start Self-Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="px-8 rounded-full h-14 text-base font-bold border-border/50 hover:bg-secondary/10 transition-all bg-background/50 backdrop-blur-md">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="container px-4 sm:px-6 lg:px-8 mx-auto py-16">
          <div className="grid gap-8 md:grid-cols-3">
            {featureCards.map((card, index) => (
              <div 
                key={card.title} 
                className="premium-card p-10 group cursor-pointer animate-fade-in-up opacity-0"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                onClick={() => navigate('/auth')}
              >
                <div className={`mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${card.accent} border transition-transform duration-500 group-hover:scale-110`}>
                  <card.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4 text-foreground">{card.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Explore More Section */}
        <section className="container px-4 sm:px-6 lg:px-8 mx-auto py-16">
          <div className="text-center mb-10">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Discover Capabilities</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {exploreLinks.map((link, index) => (
              <Link key={link.title} to="/auth">
                <Button 
                  variant="outline" 
                  className="gap-3 rounded-full h-12 px-6 border-border/50 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">{link.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* Additional Features */}
        <section className="container px-4 sm:px-6 lg:px-8 mx-auto py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-bold text-foreground mb-4 tracking-tight">Everything you need for wellness</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive tools designed with students in mind to foster long-term mental clarity and emotional intelligence.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="premium-card p-8 group flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">Personal Journal</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reflect on your day with AI-assisted mood tagging and insights. Securely document your emotional journey.
                  </p>
                </div>
              </div>
              
              <div className="premium-card p-8 group flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold mb-2 text-foreground group-hover:text-secondary transition-colors">Wellness Tracking</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Monitor your mental health journey with visual dashboards and actionable trend analysis.
                  </p>
                </div>
              </div>
              
              <div className="premium-card p-8 group flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <Brain className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold mb-2 text-foreground group-hover:text-destructive transition-colors">Validated Assessments</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    PHQ-9 and GAD-7 questionnaires with research-backed scoring to gauge your current state.
                  </p>
                </div>
              </div>
              
              <div className="premium-card p-8 group flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <Shield className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold mb-2 text-foreground transition-colors">Private & Secure</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your data is encrypted and confidential. You maintain full control over your personal information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 sm:px-6 lg:px-8 mx-auto py-20 mb-20">
          <div className="rounded-[2.5rem] bg-foreground text-background p-10 md:p-16 text-center shadow-elevated relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="font-display text-4xl font-bold md:text-5xl tracking-tight mb-6">
                Ready to prioritize your mental wellness?
              </h2>
              <p className="text-lg text-background/80 max-w-2xl mx-auto leading-relaxed mb-10">
                Join thousands of students who are taking control of their mental health journey. 
                It's free, confidential, and designed precisely for you.
              </p>
              <Link to="/auth">
                <Button size="lg" className="h-14 px-10 rounded-full font-bold bg-primary text-primary-foreground hover-lift border-0 shadow-lg text-lg">
                  Create Free Account
                </Button>
              </Link>
            </div>
            
            {/* Decorative background blur */}
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-b-0 border-x-0 mt-auto rounded-t-3xl">
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">© 2025 MindMate. All rights reserved.</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-md text-center md:text-right font-medium leading-relaxed bg-secondary/5 px-4 py-2 rounded-full border border-border/50">
              MindMate is not an emergency service. If in crisis, call <span className="font-bold text-destructive">988</span> or campus resources.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
