import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageWrapper } from "@/components/PageWrapper";
import { getTargets, saveTarget } from "@/lib/store";
import { Target as TargetType } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function TargetsPage() {
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ month: '', year: new Date().getFullYear().toString(), targetPremium: '', achievedPremium: '', targetPolicies: '', achievedPolicies: '' });

  useEffect(() => {
    let active = true;

    const loadTargets = async () => {
      const allTargets = await getTargets();
      if (!active) return;
      setTargets(allTargets);
    };

    void loadTargets();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target: TargetType = {
      id: crypto.randomUUID(), month: form.month, year: Number(form.year),
      targetPremium: Number(form.targetPremium), achievedPremium: Number(form.achievedPremium),
      targetPolicies: Number(form.targetPolicies), achievedPolicies: Number(form.achievedPolicies),
    };

    try {
      await saveTarget(target);
      setTargets(prev => [...prev, target]);
      setForm({ month: '', year: new Date().getFullYear().toString(), targetPremium: '', achievedPremium: '', targetPolicies: '', achievedPolicies: '' });
      setShowForm(false);
      toast.success("Target added!");
    } catch {
      toast.error("Failed to save target");
    }
  };

  return (
    <PageWrapper title="Targets" subtitle="Set and track your monthly goals" action={
      <Button onClick={() => setShowForm(!showForm)} className="gradient-primary"><Plus className="w-4 h-4 mr-1" /> Add Target</Button>
    }>
      {showForm && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Month</Label><Input value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} placeholder="e.g. April" /></div>
            <div className="space-y-2"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Target Premium (₹)</Label><Input type="number" value={form.targetPremium} onChange={e => setForm(f => ({ ...f, targetPremium: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Achieved Premium (₹)</Label><Input type="number" value={form.achievedPremium} onChange={e => setForm(f => ({ ...f, achievedPremium: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Target Policies</Label><Input type="number" value={form.targetPolicies} onChange={e => setForm(f => ({ ...f, targetPolicies: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Achieved Policies</Label><Input type="number" value={form.achievedPolicies} onChange={e => setForm(f => ({ ...f, achievedPolicies: e.target.value }))} /></div>
          </div>
          <Button type="submit" className="gradient-primary">Save Target</Button>
        </motion.form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targets.length === 0 ? (
          <div className="col-span-2 glass-card rounded-xl p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No targets set yet</p>
          </div>
        ) : (() => {
          // Render targets sorted by month name alphabetically (UI only). Do not modify stored data.
          const sortedTargets = [...targets].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
          return sortedTargets.map((t, i) => {
          const premiumPct = t.targetPremium > 0 ? Math.round((t.achievedPremium / t.targetPremium) * 100) : 0;
          const policyPct = t.targetPolicies > 0 ? Math.round((t.achievedPolicies / t.targetPolicies) * 100) : 0;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold">{t.month} {t.year}</h4>
                <TrendingUp className={`w-5 h-5 ${premiumPct >= 100 ? 'text-accent' : 'text-secondary'}`} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Premium</span><span>₹{t.achievedPremium.toLocaleString()} / ₹{t.targetPremium.toLocaleString()}</span></div>
                <Progress value={Math.min(premiumPct, 100)} className="h-2" />
                <p className="text-xs text-right text-muted-foreground">{premiumPct}%</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Policies</span><span>{t.achievedPolicies} / {t.targetPolicies}</span></div>
                <Progress value={Math.min(policyPct, 100)} className="h-2" />
                <p className="text-xs text-right text-muted-foreground">{policyPct}%</p>
              </div>
            </motion.div>
          );
          });
        })()}
      </div>
    </PageWrapper>
  );
}
