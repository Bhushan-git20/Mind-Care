import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { JournalList } from "@/components/journal/JournalList";
import PageShell from "@/components/layout/PageShell";
import { Loader2, Sparkles, Save, Wand2, Lightbulb, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  mood_tags: string[] | null;
  risk_level: "low" | "medium" | "high" | null;
  risk_analysis: { summary?: string } | null;
}

export default function Journal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
      } else {
        setEntries((data || []).map(entry => ({
          ...entry,
          risk_analysis: entry.risk_analysis as { summary?: string } | null
        })));
      }
      setIsLoading(false);
    };

    if (user) fetchEntries();
  }, [user]);

  const fetchEntriesForRefresh = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) {
      setEntries((data || []).map(entry => ({
        ...entry,
        risk_analysis: entry.risk_analysis as { summary?: string } | null
      })));
    }
  };

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    setIsSaving(true);
    
    try {
      const tags = selectedMood ? [selectedMood] : [];
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        content: content.trim(),
        mood_tags: tags,
      });

      if (error) throw error;
      
      toast.success("Entry saved successfully");
      setContent("");
      setSelectedMood(null);
      fetchEntriesForRefresh();
      
      // Background risk analysis
      supabase.functions.invoke("analyze-journal", {
        body: { content: content.trim() }
      });
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const moods = [
    { emoji: "😔", label: "sad" },
    { emoji: "😐", label: "neutral" },
    { emoji: "😊", label: "happy" },
    { emoji: "🤩", label: "excited" },
    { emoji: "😌", label: "calm" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> 
          <span className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Loading Journal...</span>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <PageShell maxWidth="full" showHeader={false}>
      
      <main className="min-h-screen px-4 sm:px-6 lg:px-12 py-10 pb-32 animate-fade-in-up">
        <header className="max-w-4xl mx-auto flex justify-between items-start mb-16">
          <div>
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium text-sm hover:-translate-x-1 duration-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <p className="text-[11px] font-bold tracking-[0.2em] mb-3 uppercase text-primary border border-primary/20 bg-primary/10 px-3 py-1 rounded-full inline-block">
              {today}
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">Daily Journal</h2>
          </div>
          <div className="flex -space-x-2">
            <div className="w-12 h-12 rounded-full border-2 border-background shadow-elevated bg-primary flex items-center justify-center overflow-hidden">
               <span className="text-xl font-bold text-primary-foreground">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Mood Selector Section */}
          <section className="premium-card p-8 bg-card/40 border-dashed border-border/60">
            <h3 className="text-lg font-display font-semibold mb-6 text-foreground flex items-center gap-3">
              <span className="text-xl">✨</span>
              How are you feeling right now?
            </h3>
            <div className="flex items-center justify-between px-2 md:px-8">
              {moods.map((mood) => (
                <button 
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                  className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl transition-all duration-300 ${selectedMood === mood.label ? 'ring-2 ring-primary bg-primary/10 transform -translate-y-2 scale-110 shadow-elevated' : 'hover:bg-secondary/10 hover:scale-105 opacity-60 hover:opacity-100'}`}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
          </section>

          {/* Main Writing Area */}
          <section className="relative group">
            <div className="premium-card p-8 md:p-12 min-h-[500px] flex flex-col gap-8 bg-card shadow-elevated border-border/50">
              <div className="flex items-start gap-5 border-b border-border/40 pb-8">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
                  <Lightbulb className="text-secondary w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-display font-semibold text-foreground mb-2">Morning Reflection</h4>
                  <p className="text-lg text-muted-foreground italic">"What is one small thing that brought you peace today?"</p>
                </div>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-grow w-full rounded-2xl p-6 text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background/50 border border-border/40 transition-all resize-none shadow-inner" 
                placeholder="Start typing your thoughts here..."
              />
              <div className="flex flex-wrap gap-3">
                {selectedMood && (
                  <span className="px-4 py-2 bg-primary/10 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20 text-primary">
                    #{selectedMood}
                  </span>
                )}
                <span className="px-4 py-2 bg-secondary/5 rounded-full text-xs font-bold uppercase tracking-widest border border-border/50 text-muted-foreground">
                  #Mindfulness
                </span>
              </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute -right-4 md:-right-8 bottom-12 flex flex-col gap-4 z-10">
              <button 
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group/btn active:scale-95 transition-transform disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {isSaving ? <Loader2 className="animate-spin text-primary-foreground" /> : (
                  <Save className="text-primary-foreground w-7 h-7 transition-transform group-hover/btn:rotate-12" />
                )}
                <span className="absolute -left-20 bg-foreground px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none text-background font-bold shadow-md">Save</span>
              </button>
              <button className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center group/btn active:scale-95 transition-transform shadow-md hover:shadow-lg hover:-translate-y-1">
                <Wand2 className="text-secondary w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -left-24 bg-foreground px-3 py-1.5 rounded-lg text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none text-background font-bold shadow-md">New Prompt</span>
              </button>
            </div>
          </section>

          {/* Past Entries */}
          <section className="mt-16">
            <h3 className="text-2xl font-display font-semibold text-foreground mb-6">Past Entries</h3>
            <div className="premium-card p-8">
              <JournalList entries={entries} isLoading={isLoading} />
            </div>
          </section>

        </div>
      </main>
    </PageShell>
  );
}
