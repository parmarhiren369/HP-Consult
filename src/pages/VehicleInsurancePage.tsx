import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Upload, X, FileText, Download, Eye, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageWrapper } from "@/components/PageWrapper";
import { getClients, saveClient } from "@/lib/store";
import { uploadDocument, downloadDocument } from "@/lib/storage";
import { VehicleInsuranceClient, VehicleInsuranceCompany, VehicleInsuranceType, DocumentFile } from "@/lib/types";
import { toast } from "sonner";
import { formatDateDisplay, formatDateInput } from "@/lib/utils";

const companies: VehicleInsuranceCompany[] = ['Bajaj Allianz', 'National Insurance'];
const insuranceTypes: VehicleInsuranceType[] = ['3rd Party', 'Bumper to Bumper'];

export default function VehicleInsurancePage() {
  const [clients, setClients] = useState<VehicleInsuranceClient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [selectedClient, setSelectedClient] = useState<VehicleInsuranceClient | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [form, setForm] = useState({
    company: '' as VehicleInsuranceCompany, name: '', policyNumber: '', premium: '',
    vehicleNumber: '', chassisNumber: '', vehicleModel: '',
    insuranceType: '' as VehicleInsuranceType, startDate: '', endDate: '',
  });

  useEffect(() => {
    let active = true;

    const loadClients = async () => {
      const allClients = await getClients();
      if (!active) return;
      setClients(allClients.filter((c) => c.type === 'vehicle') as VehicleInsuranceClient[]);
    };

    void loadClients();

    return () => {
      active = false;
    };
  }, []);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadedDocs = await Promise.all(
        Array.from(files).map((file) => uploadDocument(file, "vehicle-documents")),
      );
      setDocs((prev) => [...prev, ...uploadedDocs]);
      toast.success("Documents uploaded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload documents";
      toast.error(message);
    }

    e.target.value = "";
  };

  const handleEditClient = (client: VehicleInsuranceClient) => {
    setEditingClientId(client.id);
    setSelectedClient(null);
    setShowForm(true);
    setForm({
      company: client.company,
      name: client.name,
      policyNumber: client.policyNumber,
      premium: String(client.premium),
      vehicleNumber: client.vehicleNumber,
      chassisNumber: client.chassisNumber,
      vehicleModel: client.vehicleModel,
      insuranceType: client.insuranceType,
      startDate: client.startDate,
      endDate: client.endDate,
    });
    setDocs(client.documents ?? []);
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setShowForm(false);
    setForm({
      company: '' as VehicleInsuranceCompany,
      name: '',
      policyNumber: '',
      premium: '',
      vehicleNumber: '',
      chassisNumber: '',
      vehicleModel: '',
      insuranceType: '' as VehicleInsuranceType,
      startDate: '',
      endDate: '',
    });
    setDocs([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.vehicleNumber) {
      toast.error("Please fill required fields");
      return;
    }
    const existingClient = editingClientId ? clients.find((client) => client.id === editingClientId) : undefined;
    const client: VehicleInsuranceClient = {
      id: editingClientId ?? crypto.randomUUID(), type: 'vehicle', company: form.company,
      name: form.name, policyNumber: form.policyNumber, premium: Number(form.premium),
      mobile: '', email: '', vehicleNumber: form.vehicleNumber,
      chassisNumber: form.chassisNumber, vehicleModel: form.vehicleModel,
      insuranceType: form.insuranceType, startDate: form.startDate, endDate: form.endDate,
      documents: docs, createdAt: existingClient?.createdAt ?? new Date().toISOString(),
    };
    try {
      await saveClient(client);
      setClients((prev) => editingClientId ? prev.map((item) => item.id === client.id ? client : item) : [...prev, client]);
      handleCancelEdit();
      toast.success(editingClientId ? "Vehicle insurance client updated!" : "Vehicle insurance client added!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save client";
      toast.error(message);
    }
  };

  return (
    <PageWrapper title="Vehicle Insurance" subtitle="Manage motor insurance policies" action={
      <Button onClick={() => setShowForm(!showForm)} className="gradient-primary">
        {showForm ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Save className="w-4 h-4 mr-1" /> Add Client</>}
      </Button>
    }>
      {showForm && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Select value={form.company} onValueChange={(v) => setForm(f => ({ ...f, company: v as VehicleInsuranceCompany }))}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Policy Holder Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" /></div>
            <div className="space-y-2"><Label>Policy Number</Label><Input value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Vehicle Number *</Label><Input value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} placeholder="MH 01 AB 1234" /></div>
            <div className="space-y-2"><Label>Chassis Number</Label><Input value={form.chassisNumber} onChange={e => setForm(f => ({ ...f, chassisNumber: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Vehicle Model</Label><Input value={form.vehicleModel} onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Premium (₹)</Label><Input type="number" value={form.premium} onChange={e => setForm(f => ({ ...f, premium: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Insurance Type</Label>
              <Select value={form.insuranceType} onValueChange={(v) => setForm(f => ({ ...f, insuranceType: v as VehicleInsuranceType }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{insuranceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Documents</Label>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-secondary text-secondary hover:bg-secondary/10 transition-colors">
                <Upload className="w-4 h-4" /> Upload <input type="file" multiple className="hidden" onChange={handleDocUpload} accept=".pdf,.jpg,.jpeg,.png" />
              </label>
              {docs.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{docs.map(d => (
                <span key={d.id} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"><FileText className="w-3 h-3" />{d.name}</span>
              ))}</div>}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="gradient-primary"><Save className="w-4 h-4 mr-1" /> {editingClientId ? "Update Client" : "Save Client"}</Button>
            {editingClientId && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel Edit</Button>}
          </div>
        </motion.form>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50 border-b"><th className="text-left p-3 font-medium">Name</th><th className="text-left p-3 font-medium">Company</th><th className="text-left p-3 font-medium">Vehicle No.</th><th className="text-left p-3 font-medium">Model</th><th className="text-left p-3 font-medium">Type</th><th className="text-left p-3 font-medium">Premium</th><th className="text-left p-3 font-medium">End Date</th><th className="text-left p-3 font-medium">Actions</th></tr></thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">No vehicle insurance clients yet.</td></tr>
              ) : clients.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedClient(c)} className="border-b hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="p-3 font-medium">{c.name}</td><td className="p-3">{c.company}</td><td className="p-3">{c.vehicleNumber}</td>
                  <td className="p-3">{c.vehicleModel}</td><td className="p-3">{c.insuranceType}</td>
                  <td className="p-3">₹{c.premium.toLocaleString()}</td><td className="p-3">{formatDateDisplay(c.endDate)}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClient(c); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClient && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedClient(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-950 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-950 border-b p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">{selectedClient.name} - Policy Summary</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClient(selectedClient)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedClient.documents && selectedClient.documents.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">📄 Attached Documents ({selectedClient.documents.length})</h3>
                  <div className="space-y-2">
                    {selectedClient.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded border border-blue-100 dark:border-blue-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')} title="Open file">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={downloadingDocId === doc.id}
                            onClick={async () => {
                              try {
                                setDownloadingDocId(doc.id);
                                await downloadDocument(doc.url, doc.name);
                                toast.success(`Downloaded ${doc.name}`);
                              } catch (error) {
                                const message = error instanceof Error ? error.message : "Failed to download document";
                                toast.error(message);
                              } finally {
                                setDownloadingDocId(null);
                              }
                            }}
                            title="Download file"
                          >
                            {downloadingDocId === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Company</Label>
                  <p className="font-medium">{selectedClient.company}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Policy Number</Label>
                  <p className="font-medium">{selectedClient.policyNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle Number</Label>
                  <p className="font-medium">{selectedClient.vehicleNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Chassis Number</Label>
                  <p className="font-medium">{selectedClient.chassisNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle Model</Label>
                  <p className="font-medium">{selectedClient.vehicleModel}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Insurance Type</Label>
                  <p className="font-medium">{selectedClient.insuranceType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Premium (₹)</Label>
                  <p className="font-medium">₹{selectedClient.premium.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{formatDateDisplay(selectedClient.startDate)}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <p className="font-medium">{formatDateDisplay(selectedClient.endDate)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </PageWrapper>
  );
}
