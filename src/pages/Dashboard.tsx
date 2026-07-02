import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PageShell from '@/components/layout/PageShell';
import { 
  ClipboardList, 
  BookOpen, 
  MessageCircle, 
  TrendingUp, 
  Brain,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  lastPhq9Score: number | null;
  lastPhq9Severity: string | null;
  lastGad7Score: number | null;
  lastGad7Severity: string | null;
  journalCount: number;
  lastRiskLevel: string | null;
  weeklyCheckIns: number;
  averageWellness: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCheckInDays: boolean[];
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    lastPhq9Score: null,
    lastPhq9Severity: null,
    lastGad7Score: null,
    lastGad7Severity: null,
    journalCount: 0,
    lastRiskLevel: null,
    weeklyCheckIns: 0,
    averageWellness: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyCheckInDays: [false, false, false, false, false, false, false]
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const { data: phq9Data } = await supabase
        .from('assessments')
        .select('total_score, severity')
        .eq('user_id', user.id)
        .eq('assessment_type', 'PHQ-9')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: gad7Data } = await supabase
        .from('assessments')
        .select('total_score, severity')
        .eq('user_id', user.id)
        .eq('assessment_type', 'GAD-7')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: journalCount } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const phqScore = phq9Data?.total_score ?? 0;
      const gadScore = gad7Data?.total_score ?? 0;
      const maxScore = 27 + 21; 
      const avgWellness = Math.max(0, 100 - ((phqScore + gadScore) / maxScore) * 100);

      const mockWeeklyCheckInDays = [true, false, true, true, false, false, false];

      setStats({
        lastPhq9Score: phq9Data?.total_score ?? null,
        lastPhq9Severity: phq9Data?.severity ?? null,
        lastGad7Score: gad7Data?.total_score ?? null,
        lastGad7Severity: gad7Data?.severity ?? null,
        journalCount: journalCount ?? 0,
        lastRiskLevel: null,
        weeklyCheckIns: mockWeeklyCheckInDays.filter(Boolean).length,
        averageWellness: Math.round(avgWellness),
        currentStreak: 3,
        longestStreak: 5,
        weeklyCheckInDays: mockWeeklyCheckInDays
      });
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground flex flex-col items-center gap-4">
          <Brain className="h-8 w-8 text-primary animate-bounce" />
          <span className="font-medium text-sm tracking-widest uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Elias';

  return (
    <PageShell maxWidth="xl">
      <div className="max-w-[1280px] mx-auto py-8">
        <section className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
            Welcome back, <span className="text-primary">{userName}</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Your overall wellness score is <strong className="text-foreground">{stats.averageWellness}/100</strong> today. Let's maintain this peaceful momentum through your session.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Mood Equilibrium Graph */}
            <div className="premium-card p-10 relative overflow-hidden flex flex-col justify-between min-h-[400px] bg-gradient-to-br from-card to-card/50">
              <div className="relative z-10">
                <span className="px-4 py-1.5 bg-primary/10 rounded-full text-xs font-bold uppercase tracking-widest text-primary mb-6 inline-block border border-primary/20">
                  DAILY STABILITY
                </span>
                <h3 className="text-3xl font-display font-bold text-foreground mb-4">Mood Equilibrium</h3>
                <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                  You've maintained a calm state for <strong className="text-foreground">{stats.currentStreak}</strong> consecutive check-ins. Your resilience patterns show high stability today.
                </p>
              </div>
              
              <div className="relative h-48 w-full mt-8 z-10">
                <div className="absolute bottom-0 left-0 w-full flex items-end justify-between px-2 gap-4">
                  {stats.weeklyCheckInDays.map((checked, i) => (
                    <div key={i} className={`w-full max-w-[3rem] bg-secondary/5 rounded-t-2xl relative ${checked ? 'h-[140px]' : 'h-[60px]'} border border-border/50 border-b-0`}>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: checked ? '80%' : '30%' }}
                        transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                        className={`absolute bottom-0 w-full rounded-t-2xl ${checked ? 'bg-primary' : 'bg-primary/30'} shadow-[var(--shadow-subtle)]`} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Decorative background elements */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="premium-card p-8 group cursor-pointer"
                onClick={() => navigate('/assessments')}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                    <ClipboardList className="text-primary h-7 w-7" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/5 px-2 py-1 rounded-md">2 MIN</span>
                </div>
                <h4 className="text-2xl font-display font-semibold mb-3 text-foreground">Self Assessment</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">A guided clinical check-in to analyze your current state.</p>
                <button className="mt-8 flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all">
                  Start Now <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              
              <div 
                className="premium-card p-8 group cursor-pointer"
                onClick={() => navigate('/journal')}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="text-primary h-7 w-7" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/5 px-2 py-1 rounded-md">NEW LOG</span>
                </div>
                <h4 className="text-2xl font-display font-semibold mb-3 text-foreground">Daily Journal</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">Record your thoughts and let the AI analyze emotional trends.</p>
                <button className="mt-8 flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all">
                  Write Entry <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Featured Insight */}
            <div className="premium-card p-8 flex flex-col">
              <h4 className="text-xl font-display font-semibold mb-6 flex items-center gap-2 text-foreground">
                <Brain className="text-primary h-5 w-5" />
                Featured Insight
              </h4>
              <div className="rounded-2xl overflow-hidden mb-6 h-48 border border-border">
                <img 
                  alt="Meditation scene" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDdRSZivtdjZlWreEz7YmzExE5a84gj958TRTlY3Wogi1Uiul0Hv9YlI-CMoHYksJzq_XUCDa-EEGgllBlx908Rl0GdUVQsDllPXW-M_-jLSkY3lsTCucTOSE9jXy33v_i1EfXgQDX-x3RzT7Wmj4a_x4VZ2CLzEHY87ZucBvBylKmY4osTN4St4MsSRSbcgk0oWag1u6lqRGUn-l5Q2yZarSXH2BSdmAYzv8ANPVc5EysIDLCAHxElbHhE6rHEopFo85vTO9q2XIe"
                />
              </div>
              <p className="text-base font-medium text-foreground mb-8 leading-relaxed italic">
                "The space between stimulus and response is where our greatest growth resides."
              </p>
              <div className="mt-auto flex items-center gap-4 p-5 bg-secondary/5 rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <TrendingUp className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">TIP OF THE DAY</p>
                  <p className="text-sm text-muted-foreground leading-snug">Try the '4-7-8' breathing method before your next meeting.</p>
                </div>
              </div>
            </div>

            {/* Chatbot CTA */}
            <div 
              className="premium-card p-8 flex items-center justify-between cursor-pointer bg-foreground text-background hover-lift"
              onClick={() => navigate('/chat')}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-background/70 mb-2">AI COMPANION</p>
                <h5 className="text-2xl font-display font-semibold">Chat with MindMate</h5>
              </div>
              <div className="w-14 h-14 rounded-full bg-background/10 flex items-center justify-center backdrop-blur-md">
                <MessageCircle className="text-background h-7 w-7" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageShell>
  );
}
