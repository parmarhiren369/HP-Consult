import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageWrapper } from "@/components/PageWrapper";
import { getClients, getRenewalsByMonth } from "@/lib/store";
import { toast } from "sonner";

export default function WhatsAppPage() {
  const now = useMemo(() => new Date(), []);
  const [renewals, setRenewals] = useState<Awaited<ReturnType<typeof getRenewalsByMonth>>>([]);
  const [allClients, setAllClients] = useState<Awaited<ReturnType<typeof getClients>>>([]);
  const [customMsg, setCustomMsg] = useState("");
  const [selectedPhone, setSelectedPhone] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const [monthlyRenewals, clients] = await Promise.all([
        getRenewalsByMonth(now.getMonth(), now.getFullYear()),
        getClients(),
      ]);

      if (!active) return;
      setRenewals(monthlyRenewals);
      setAllClients(clients);
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [now]);

  const defaultMessage = (name: string, policyNo: string, endDate: string, premium: number) =>
    `Dear ${name},\n\nThis is a reminder from *HP Consult* that your insurance policy (${policyNo}) is due for renewal on ${endDate}.\n\nPremium Amount: ₹${premium.toLocaleString()}\n\nPlease contact us for renewal assistance.\n\nThank you! 🙏`;

  const sendWhatsApp = (phone: string, message: string) => {
    if (!phone) { toast.error("No phone number available"); return; }
    const cleaned = phone.replace(/\D/g, '');
    const intlPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success("Opening WhatsApp...");
  };

  return (
    <PageWrapper title="WhatsApp Reminder" subtitle="Send personalized reminders for premium payments">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-heading font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-accent" /> Renewal Reminders</h3>
          {renewals.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center"><p className="text-muted-foreground">No renewals this month</p></div>
          ) : (
            renewals.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><User className="w-5 h-5 text-accent" /></div>
                    <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.policyNumber} • Expires: {c.endDate}</p></div>
                  </div>
                  <Button size="sm" onClick={() => sendWhatsApp(c.mobile, defaultMessage(c.name, c.policyNumber, c.endDate, c.premium))}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Send className="w-3 h-3 mr-1" /> Send
                  </Button>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-xs whitespace-pre-line">{defaultMessage(c.name, c.policyNumber, c.endDate, c.premium)}</div>
              </motion.div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-heading font-semibold flex items-center gap-2"><Phone className="w-5 h-5 text-secondary" /> Custom Message</h3>
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="Enter phone number" value={selectedPhone} onChange={e => setSelectedPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={6} placeholder="Type your message..." value={customMsg} onChange={e => setCustomMsg(e.target.value)} />
            </div>
            <Button onClick={() => sendWhatsApp(selectedPhone, customMsg)} className="w-full gradient-primary">
              <Send className="w-4 h-4 mr-1" /> Send via WhatsApp
            </Button>
          </div>

          <h3 className="font-heading font-semibold mt-6">Quick Send to Client</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {allClients.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.mobile}</p></div>
                <Button size="sm" variant="outline" onClick={() => { setSelectedPhone(c.mobile); setCustomMsg(defaultMessage(c.name, c.policyNumber, c.endDate, c.premium)); }}>
                  Select
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
