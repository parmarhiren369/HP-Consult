import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "primary" | "secondary" | "accent" | "warning";
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
};

export function StatCard({ title, value, icon: Icon, trend, color = "primary" }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.15)" }}
      className="glass-card rounded-xl p-5 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-accent mt-1 font-medium">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
