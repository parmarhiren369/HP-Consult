import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, ChevronLeft, ChevronRight, Download, Phone } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/PageWrapper";
import { getRenewalsByMonth } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function RenewalsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [renewals, setRenewals] = useState<Awaited<ReturnType<typeof getRenewalsByMonth>>>([]);

  useEffect(() => {
    let active = true;

    const loadRenewals = async () => {
      const monthlyRenewals = await getRenewalsByMonth(month, year);
      if (!active) return;
      // UI-only: sort renewals by client name alphabetically to avoid modifying stored data
      const sorted = [...monthlyRenewals].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setRenewals(sorted);
    };

    void loadRenewals();

    return () => {
      active = false;
    };
  }, [month, year]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const typeColor = (type: string) => {
    switch(type) {
      case 'mediclaim': return 'bg-secondary/10 text-secondary';
      case 'life': return 'bg-accent/10 text-accent';
      case 'vehicle': return 'bg-warning/10 text-warning';
      default: return 'bg-muted';
    }
  };

  const downloadExcel = () => {
    const rows = renewals.map((c, idx) => ({
      'S.No': idx + 1,
      'Client Name': c.name,
      'Mobile': c.mobile,
      'Email': c.email,
      'Insurance Type': c.type,
      'Company': (c as any).company ?? '',
      'Policy Number': c.policyNumber,
      'Premium (₹)': c.premium,
      'Start Date': c.startDate,
      'Renewal / End Date': c.endDate,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 }, { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 14 },
      { wch: 26 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${MONTHS[month]} ${year}`);
    XLSX.writeFile(wb, `Renewals_${MONTHS[month]}_${year}.xlsx`);
  };

  return (
    <PageWrapper title="Renewals" subtitle="Track policy renewals month by month">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <CalendarClock className="w-5 h-5 text-secondary" />
            <span className="font-heading font-semibold text-lg">{MONTHS[month]} {year}</span>
          </div>
          <Button variant="outline" size="icon" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <Button onClick={downloadExcel} disabled={renewals.length === 0} className="gap-2">
          <Download className="w-4 h-4" />
          Download Excel
        </Button>
      </div>

      {renewals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-12 text-center">
          <CalendarClock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No renewals for {MONTHS[month]} {year}</p>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {renewals.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeColor(c.type)}`}>
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{c.policyNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Phone className="w-4 h-4 text-secondary" />
                <a href={`tel:${c.mobile}`} className="font-medium hover:text-secondary transition-colors">
                  {c.mobile || '—'}
                </a>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={typeColor(c.type)}>{c.type}</Badge>
                <div className="text-right">
                  <p className="font-medium">₹{c.premium.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Expires: {c.endDate}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
