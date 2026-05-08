import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/PageWrapper";
import { getLeads, saveLead } from "@/lib/store";
import { Lead } from "@/lib/types";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  new: 'bg-info/10 text-info',
  contacted: 'bg-secondary/10 text-secondary',
  interested: 'bg-warning/10 text-warning',
  converted: 'bg-accent/10 text-accent',
  lost: 'bg-destructive/10 text-destructive',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', source: '', status: 'new' as Lead['status'], notes: '' });

  useEffect(() => {
    let active = true;

    const loadLeads = async () => {
      const allLeads = await getLeads();
      if (!active) return;
      setLeads(allLeads);
    };

    void loadLeads();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }
    const lead: Lead = { id: crypto.randomUUID(), ...form, createdAt: new Date().toISOString() };
    try {
      await saveLead(lead);
      setLeads(prev => [...prev, lead]);
      setForm({ name: '', mobile: '', email: '', source: '', status: 'new', notes: '' });
      setShowForm(false);
      toast.success("Lead added!");
    } catch {
      toast.error("Failed to save lead");
    }
  };

  const updateStatus = async (id: string, status: Lead['status']) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const updatedLead = { ...lead, status };

    try {
      await saveLead(updatedLead);
      setLeads(prev => prev.map(item => item.id === id ? updatedLead : item));
      toast.success("Status updated!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <PageWrapper title="Leads" subtitle="Manage potential clients" action={
      <Button onClick={() => setShowForm(!showForm)} className="gradient-primary">
        {showForm ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Plus className="w-4 h-4 mr-1" /> Add Lead</>}
      </Button>
    }>
      {showForm && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Source</Label><Input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Referral, Walk-in..." /></div>
            <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <Button type="submit" className="gradient-primary">Save Lead</Button>
        </motion.form>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 border-b"><th className="text-left p-3">Name</th><th className="text-left p-3">Mobile</th><th className="text-left p-3">Source</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th><th className="text-left p-3">Actions</th></tr></thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No leads yet</td></tr>
              ) : leads.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{l.name}</td>
                  <td className="p-3">{l.mobile}</td>
                  <td className="p-3">{l.source}</td>
                  <td className="p-3"><Badge className={statusColors[l.status]}>{l.status}</Badge></td>
                  <td className="p-3">{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v as Lead['status'])}>
                      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
