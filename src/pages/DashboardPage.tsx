import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Heart, Car, TrendingUp, CalendarClock, IndianRupee, AlertCircle } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { StatCard } from "@/components/StatCard";
import { getClients, getRenewalsByMonth } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Client } from "@/lib/types";

const COLORS = ["hsl(224,58%,33%)", "hsl(217,91%,60%)", "hsl(160,60%,40%)", "hsl(38,92%,50%)"];

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [renewalsThisMonth, setRenewalsThisMonth] = useState<Client[]>([]);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const [allClients, renewals] = await Promise.all([
        getClients(),
        getRenewalsByMonth(now.getMonth(), now.getFullYear()),
      ]);

      if (!active) return;
      setClients(allClients);
      setRenewalsThisMonth(renewals);
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [now]);

  const mediclaim = clients.filter(c => c.type === 'mediclaim');
  const life = clients.filter(c => c.type === 'life');
  const vehicle = clients.filter(c => c.type === 'vehicle');
  const totalPremium = clients.reduce((s, c) => s + c.premium, 0);

  const typeData = [
    { name: "Mediclaim", value: mediclaim.length },
    { name: "Life", value: life.length },
    { name: "Vehicle", value: vehicle.length },
  ].filter(d => d.value > 0);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Keep month indexes for correct counts, but display months alphabetically
    const monthsWithIndex = months.map((name, idx) => ({ name, idx }));
    monthsWithIndex.sort((a, b) => a.name.localeCompare(b.name));
    return monthsWithIndex.map(m => {
      const count = clients.filter(c => {
        const d = new Date(c.createdAt);
        return d.getMonth() === m.idx && d.getFullYear() === now.getFullYear();
      }).length;
      return { name: m.name, policies: count };
    });
  }, [clients]);

  return (
    <PageWrapper title="Dashboard" subtitle="Welcome to Amiya Consultant">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={clients.length} icon={Users} color="primary" />
        <StatCard title="Mediclaim" value={mediclaim.length} icon={Shield} color="secondary" />
        <StatCard title="Life Insurance" value={life.length} icon={Heart} color="accent" />
        <StatCard title="Vehicle Insurance" value={vehicle.length} icon={Car} color="warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Premium" value={`₹${totalPremium.toLocaleString()}`} icon={IndianRupee} color="primary" />
        <StatCard title="Renewals This Month" value={renewalsThisMonth.length} icon={CalendarClock} color="warning" trend={renewalsThisMonth.length > 0 ? "Action needed!" : undefined} />
        <StatCard title="Growth" value={`${clients.length > 0 ? '+' : ''}${clients.length}`} icon={TrendingUp} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Policies by Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="policies" fill="hsl(217,91%,60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <h3 className="font-heading font-semibold mb-4">Policy Distribution</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              <div className="text-center"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Add clients to see distribution</p></div>
            </div>
          )}
        </motion.div>
      </div>

      {renewalsThisMonth.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 border-l-4 border-warning">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-warning" /> Upcoming Renewals</h3>
          <div className="space-y-2">
            {renewalsThisMonth.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{c.type} • {c.policyNumber}</p></div>
                <p className="text-sm font-medium">Expires: {c.endDate}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
}
