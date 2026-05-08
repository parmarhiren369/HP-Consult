import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageWrapper } from "@/components/PageWrapper";
import { getClients } from "@/lib/store";
import { Client } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(224,58%,33%)", "hsl(217,91%,60%)", "hsl(160,60%,40%)", "hsl(38,92%,50%)"];

export default function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    let active = true;

    const loadClients = async () => {
      const allClients = await getClients();
      if (!active) return;
      setClients(allClients);
    };

    void loadClients();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    return clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, clients]);

  const selectedClient = filtered.length === 1 ? filtered[0] : null;

  const allPoliciesByClient = useMemo(() => {
    if (!selectedClient) return [];
    return clients.filter(c => c.name.toLowerCase() === selectedClient.name.toLowerCase());
  }, [selectedClient, clients]);

  const premiumByType = useMemo(() => {
    const map: Record<string, number> = {};
    allPoliciesByClient.forEach(c => {
      map[c.type] = (map[c.type] || 0) + c.premium;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allPoliciesByClient]);

  return (
    <PageWrapper title="Analytics" subtitle="Search clients and view analytics">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search client by name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {search && filtered.length > 1 && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">Found {filtered.length} clients:</p>
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors" onClick={() => setSearch(c.name)}>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.type} • {c.policyNumber}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedClient && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{selectedClient.name}'s Insurance Portfolio</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Total Policies</p><p className="text-xl font-bold">{allPoliciesByClient.length}</p></div>
              <div><p className="text-muted-foreground">Total Premium</p><p className="text-xl font-bold">₹{allPoliciesByClient.reduce((s, c) => s + c.premium, 0).toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Types</p><p className="text-xl font-bold">{new Set(allPoliciesByClient.map(c => c.type)).size}</p></div>
              <div><p className="text-muted-foreground">Contact</p><p className="text-sm font-medium">{selectedClient.mobile}</p></div>
            </div>
          </div>

          {premiumByType.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-6">
                <h4 className="font-heading font-semibold mb-4">Premium by Insurance Type</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={premiumByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="value" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card rounded-xl p-6">
                <h4 className="font-heading font-semibold mb-4">Policy Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={premiumByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}>
                      {premiumByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-6">
            <h4 className="font-heading font-semibold mb-4">All Policies</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 border-b"><th className="text-left p-3">Type</th><th className="text-left p-3">Policy No.</th><th className="text-left p-3">Premium</th><th className="text-left p-3">Start</th><th className="text-left p-3">End</th></tr></thead>
                <tbody>{allPoliciesByClient.map(c => (
                  <tr key={c.id} className="border-b hover:bg-muted/30"><td className="p-3 capitalize">{c.type}</td><td className="p-3">{c.policyNumber}</td><td className="p-3">₹{c.premium.toLocaleString()}</td><td className="p-3">{c.startDate}</td><td className="p-3">{c.endDate}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {!search && (
        <div className="glass-card rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Search for a client to view their analytics</p>
        </div>
      )}
    </PageWrapper>
  );
}
