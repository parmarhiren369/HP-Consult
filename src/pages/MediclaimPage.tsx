import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, X, Plus, Trash2, Upload, FileText, Eye, Download, Loader2, Pencil, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageWrapper } from "@/components/PageWrapper";
import { getClientById, getClients, saveClient } from "@/lib/store";
import { MediclaimClient, MediclaimCompany, FamilyMember } from "@/lib/types";
import { toast } from "sonner";
import { formatDateDisplay } from "@/lib/utils";
import { uploadDocument, downloadDocument } from "@/lib/storage";
import type { DocumentFile } from "@/lib/types";
import * as XLSX from "xlsx";

const companies: MediclaimCompany[] = ['Aditya Birla Health Insurance', 'Niva Bupa', 'HDFC Ergo', 'National Insurance', 'Oriental Insurance'];
const relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];

type MediclaimDraft = {
  company: MediclaimCompany | "";
  name: string;
  policyNumber: string;
  age: string;
  sumAssured: string;
  premium: string;
  mobile: string;
  email: string;
  dob: string;
  startDate: string;
  endDate: string;
  policyType: MediclaimClient["policyType"];
  familyMembers: FamilyMember[];
};

type ImportedRow = {
  id: string;
  sheetName: string;
  rowNumber: number;
  draft: MediclaimDraft;
  warnings: string[];
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function getCellValue(row: Record<string, unknown>, aliases: string[]) {
  const normalizedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));

  for (const alias of aliases) {
    const value = normalizedRow[normalizeHeader(alias)];
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      return value;
    }
  }

  return "";
}

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value).trim();
}

function parseDateValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  if (typeof value === "number") {
    const formatted = XLSX.SSF.format("yyyy-mm-dd", value);
    return typeof formatted === "string" ? formatted : "";
  }

  const text = String(value).trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{2}[\/.-]\d{2}[\/.-]\d{4}$/.test(text)) {
    const [day, month, year] = text.split(/[\/.-]/);
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function parseNumberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? String(numeric) : "";
}

function inferPolicyType(value: unknown): MediclaimClient["policyType"] {
  const text = toText(value).toLowerCase();
  return text.includes("family") ? "family" : "single";
}

function matchCompany(value: unknown): MediclaimCompany | "" {
  const text = toText(value).toLowerCase();
  if (!text) return "";

  const match = companies.find((company) => company.toLowerCase() === text || text.includes(company.toLowerCase()));
  return match ?? "";
}

function buildDraft(row: Record<string, unknown>, sheetName: string, rowNumber: number): ImportedRow {
  const company = matchCompany(getCellValue(row, ["company", "insurer", "insurance company", "policy company"]));
  const name = toText(getCellValue(row, ["name", "client name", "policy holder", "policyholder", "insured name"]));
  const policyNumber = toText(getCellValue(row, ["policy number", "policy no", "policy no.", "policy no "]));
  const age = parseNumberValue(getCellValue(row, ["age"]));
  const sumAssured = parseNumberValue(getCellValue(row, ["sum assured", "sum insured", "coverage", "insured amount"]));
  const premium = parseNumberValue(getCellValue(row, ["premium", "annual premium", "renewal premium"]));
  const mobile = toText(getCellValue(row, ["mobile", "phone", "contact", "contact no", "contact number"]));
  const email = toText(getCellValue(row, ["email", "e-mail"]));
  const dob = parseDateValue(getCellValue(row, ["dob", "date of birth", "birth date"]));
  const startDate = parseDateValue(getCellValue(row, ["start date", "policy start", "inception date", "from date"]));
  const endDate = parseDateValue(getCellValue(row, ["end date", "expiry date", "renewal date", "to date"]));
  const policyType = inferPolicyType(getCellValue(row, ["policy type", "type", "floater"]));

  const warnings: string[] = [];
  if (!company) warnings.push("Company not detected");
  if (!name) warnings.push("Name missing");
  if (!policyNumber) warnings.push("Policy number missing");
  if (!age) warnings.push("Age missing");
  if (!sumAssured) warnings.push("Sum assured missing");
  if (!premium) warnings.push("Premium missing");

  return {
    id: crypto.randomUUID(),
    sheetName,
    rowNumber,
    draft: {
      company,
      name,
      policyNumber,
      age,
      sumAssured,
      premium,
      mobile,
      email,
      dob,
      startDate,
      endDate,
      policyType,
      familyMembers: [],
    },
    warnings,
  };
}

function draftToClient(draft: MediclaimDraft, existingClient?: MediclaimClient): MediclaimClient | null {
  if (!draft.company || !draft.name || !draft.policyNumber || !draft.age || !draft.sumAssured || !draft.premium) {
    return null;
  }

  const familyMembers = draft.familyMembers.length > 0 ? draft.familyMembers : existingClient?.familyMembers;

  return {
    id: existingClient?.id ?? crypto.randomUUID(),
    type: "mediclaim",
    company: draft.company,
    name: draft.name,
    policyNumber: draft.policyNumber,
    age: Number(draft.age),
    sumAssured: Number(draft.sumAssured),
    premium: Number(draft.premium),
    mobile: draft.mobile || existingClient?.mobile || "",
    email: draft.email || existingClient?.email || "",
    dob: draft.dob || existingClient?.dob || "",
    startDate: draft.startDate || existingClient?.startDate || "",
    endDate: draft.endDate || existingClient?.endDate || "",
    policyType: draft.policyType,
    ...(familyMembers ? { familyMembers } : {}),
    documents: existingClient?.documents ?? [],
    createdAt: existingClient?.createdAt ?? new Date().toISOString(),
  };
}

export default function MediclaimPage() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<MediclaimClient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [documentLabel, setDocumentLabel] = useState("Policy");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMemberForm, setFamilyMemberForm] = useState({ name: '', relation: '', age: '', sumAssured: '' });
  const [selectedClient, setSelectedClient] = useState<MediclaimClient | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [importingExcel, setImportingExcel] = useState(false);
  const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
  const [form, setForm] = useState({
    company: '' as MediclaimCompany,
    name: '', policyNumber: '', age: '', sumAssured: '', premium: '',
    mobile: '', email: '', dob: '', startDate: '', endDate: '',
    policyType: 'single' as 'single' | 'family',
  });

  useEffect(() => {
    let active = true;

    const loadClients = async () => {
      const allClients = await getClients();
      if (!active) return;
      setClients(allClients.filter((c) => c.type === 'mediclaim') as MediclaimClient[]);
    };

    void loadClients();

    return () => {
      active = false;
    };
  }, []);

  const handleAddFamilyMember = () => {
    if (!familyMemberForm.name || !familyMemberForm.relation || !familyMemberForm.age || !familyMemberForm.sumAssured) {
      toast.error("Please fill all family member fields");
      return;
    }

    const newMember: FamilyMember = {
      id: crypto.randomUUID(),
      name: familyMemberForm.name,
      relation: familyMemberForm.relation,
      age: Number(familyMemberForm.age),
      sumAssured: Number(familyMemberForm.sumAssured),
    };

    setFamilyMembers((prev) => [...prev, newMember]);
    setFamilyMemberForm({ name: '', relation: '', age: '', sumAssured: '' });
    toast.success("Family member added");
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleEditClient = (client: MediclaimClient) => {
    setEditingClientId(client.id);
    setSelectedClient(null);
    setShowForm(true);
    setForm({
      company: client.company,
      name: client.name,
      policyNumber: client.policyNumber,
      age: String(client.age),
      sumAssured: String(client.sumAssured),
      premium: String(client.premium),
      mobile: client.mobile,
      email: client.email,
      dob: client.dob,
      startDate: client.startDate,
      endDate: client.endDate,
      policyType: client.policyType,
    });
    setDocuments(client.documents ?? []);
    setDocumentLabel("Policy");
    setFamilyMembers(client.familyMembers ?? []);
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setShowForm(false);
    setForm({
      company: '' as MediclaimCompany,
      name: '',
      policyNumber: '',
      age: '',
      sumAssured: '',
      premium: '',
      mobile: '',
      email: '',
      dob: '',
      startDate: '',
      endDate: '',
      policyType: 'single',
    });
    setDocuments([]);
    setDocumentLabel("Policy");
    setFamilyMembers([]);
    setFamilyMemberForm({ name: '', relation: '', age: '', sumAssured: '' });
  };

  const openClientSummary = async (client: MediclaimClient) => {
    setSelectedClient(client);
    setSummaryLoading(true);

    try {
      const latestClient = await getClientById(client.id);
      if (latestClient) {
        setSelectedClient({
          ...(latestClient as MediclaimClient),
          documents: latestClient.documents ?? [],
          familyMembers: (latestClient as MediclaimClient).familyMembers ?? [],
        });
      }
    } catch (error) {
      console.error("Failed to reload client for summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) => uploadDocument(file, "mediclaim-documents", documentLabel)),
      );
      setDocuments((prev) => [...prev, ...uploaded]);
      toast.success("Documents uploaded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload documents";
      toast.error(message);
    }

    e.target.value = "";
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setImportingExcel(true);

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const rows: ImportedRow[] = [];

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: "",
          raw: false,
        });

        sheetRows.forEach((row, index) => {
          rows.push(buildDraft(row, sheetName, index + 2));
        });
      });

      if (rows.length === 0) {
        toast.error("No rows found in the Excel file");
        return;
      }

      setImportedRows(rows);
      toast.success(`Imported ${rows.length} rows. Review and save each client individually.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read Excel file";
      toast.error(message);
    } finally {
      setImportingExcel(false);
    }
  };

  const loadDraftIntoForm = (importedRow: ImportedRow) => {
    const existingClient = clients.find(
      (client) => client.type === "mediclaim" && client.company === importedRow.draft.company && client.policyNumber === importedRow.draft.policyNumber,
    ) as MediclaimClient | undefined;

    setEditingClientId(existingClient?.id ?? null);
    setSelectedClient(null);
    setShowForm(true);
    setForm({
      company: importedRow.draft.company as MediclaimCompany,
      name: importedRow.draft.name,
      policyNumber: importedRow.draft.policyNumber,
      age: importedRow.draft.age,
      sumAssured: importedRow.draft.sumAssured,
      premium: importedRow.draft.premium,
      mobile: importedRow.draft.mobile,
      email: importedRow.draft.email,
      dob: importedRow.draft.dob,
      startDate: importedRow.draft.startDate,
      endDate: importedRow.draft.endDate,
      policyType: importedRow.draft.policyType,
    });
    setDocuments(existingClient?.documents ?? []);
    setDocumentLabel("Policy");
    setFamilyMembers(importedRow.draft.familyMembers.length > 0 ? importedRow.draft.familyMembers : existingClient?.familyMembers ?? []);
  };

  const saveImportedRow = async (importedRow: ImportedRow) => {
    const matchingClient = clients.find(
      (client) => client.type === "mediclaim" && client.company === importedRow.draft.company && client.policyNumber === importedRow.draft.policyNumber,
    ) as MediclaimClient | undefined;

    const client = draftToClient(importedRow.draft, matchingClient);
    if (!client) {
      toast.error(`Row ${importedRow.rowNumber} in ${importedRow.sheetName} is missing required fields`);
      return;
    }

    try {
      await saveClient(client);
      setClients((prev) => matchingClient ? prev.map((item) => item.id === client.id ? client : item) : [...prev, client]);
      setImportedRows((prev) => prev.map((row) => row.id === importedRow.id ? { ...row, warnings: [] } : row));
      toast.success(matchingClient ? `Updated ${client.name}` : `Imported ${client.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save imported client";
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.policyNumber) {
      toast.error("Please fill required fields");
      return;
    }
    if (form.policyType === 'family' && familyMembers.length === 0) {
      toast.error("Please add at least one family member for family floater policy");
      return;
    }

    const existingClient = editingClientId ? clients.find((client) => client.id === editingClientId) : undefined;
    const client: MediclaimClient = {
      id: editingClientId ?? crypto.randomUUID(),
      type: 'mediclaim',
      company: form.company,
      name: form.name,
      policyNumber: form.policyNumber,
      age: Number(form.age),
      sumAssured: Number(form.sumAssured),
      premium: Number(form.premium),
      mobile: form.mobile,
      email: form.email,
      dob: form.dob,
      startDate: form.startDate,
      endDate: form.endDate,
      policyType: form.policyType,
      ...(form.policyType === 'family' ? { familyMembers } : {}),
      documents,
      createdAt: existingClient?.createdAt ?? new Date().toISOString(),
    };

    console.log("About to save client with documents:", { clientName: client.name, documentCount: documents.length, documents });

    try {
      await saveClient(client);
      setClients((prev) => editingClientId ? prev.map((item) => item.id === client.id ? client : item) : [...prev, client]);
      handleCancelEdit();
      toast.success(editingClientId ? "Client updated successfully!" : "Client added successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save client";
      toast.error(message);
    }
  };

  return (
    <PageWrapper
      title="Mediclaim Insurance"
      subtitle="Manage health insurance policies"
      action={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} disabled={importingExcel}>
            {importingExcel ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-1" />}
            Import Excel
          </Button>
          <input ref={importInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
          <Button onClick={() => setShowForm(!showForm)} className="gradient-primary">
            {showForm ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Save className="w-4 h-4 mr-1" /> Add Client</>}
          </Button>
        </div>
      }
    >
      {importedRows.length > 0 && (
        <div className="glass-card rounded-xl p-4 space-y-4 border border-secondary/20">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-secondary" /> Imported Excel Rows
              </h2>
              <p className="text-sm text-muted-foreground">Review each row, then save it individually to keep the data flow controlled.</p>
            </div>
            <Button type="button" variant="ghost" onClick={() => setImportedRows([])}>
              Clear Import
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium">Row</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Company</th>
                  <th className="text-left p-3 font-medium">Policy No.</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {importedRows.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="p-3 whitespace-nowrap">{row.sheetName} / {row.rowNumber}</td>
                    <td className="p-3">{row.draft.name || <span className="text-muted-foreground">Missing</span>}</td>
                    <td className="p-3">{row.draft.company || <span className="text-muted-foreground">Missing</span>}</td>
                    <td className="p-3">{row.draft.policyNumber || <span className="text-muted-foreground">Missing</span>}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {row.warnings.length > 0 ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                              <X className="w-3 h-3" /> Review needed
                            </span>
                            <p className="text-xs text-muted-foreground">{row.warnings.join(" • ")}</p>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> Ready
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => loadDraftIntoForm(row)}>
                          Review
                        </Button>
                        <Button type="button" size="sm" onClick={() => void saveImportedRow(row)}>
                          Save Row
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSubmit}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Select value={form.company} onValueChange={(v) => setForm((f) => ({ ...f, company: v as MediclaimCompany }))}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Policy Type *</Label>
              <Select value={form.policyType} onValueChange={(v) => setForm((f) => ({ ...f, policyType: v as 'single' | 'family' }))}>
                <SelectTrigger><SelectValue placeholder="Select policy type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="family">Family Floater</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Client name" /></div>
            <div className="space-y-2"><Label>Policy Number *</Label><Input value={form.policyNumber} onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))} placeholder="Policy number" /></div>
            <div className="space-y-2"><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Sum Assured (₹)</Label><Input type="number" value={form.sumAssured} onChange={(e) => setForm((f) => ({ ...f, sumAssured: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Premium (₹)</Label><Input type="number" value={form.premium} onChange={(e) => setForm((f) => ({ ...f, premium: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} placeholder="Mobile number" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" /></div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label>Documents</Label>
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="space-y-2 w-full md:max-w-xs">
                  <Label className="text-xs text-muted-foreground">Document Type</Label>
                  <Select value={documentLabel} onValueChange={setDocumentLabel}>
                    <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Policy">Policy PDF</SelectItem>
                      <SelectItem value="Aadhaar">Aadhaar PDF</SelectItem>
                      <SelectItem value="PAN">PAN PDF</SelectItem>
                      <SelectItem value="Other">Other PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-secondary text-secondary hover:bg-secondary/10 transition-colors">
                  <Upload className="w-4 h-4" /> Upload PDF
                  <input type="file" multiple className="hidden" onChange={handleDocumentUpload} accept="application/pdf,.pdf" />
                </label>
              </div>

              {documents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {documents.map((doc) => (
                    <span key={doc.id} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                      <FileText className="w-3 h-3" />
                      {doc.label ? `${doc.label}: ` : ''}{doc.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {form.policyType === 'family' && (
            <div className="border-t pt-6 space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Family Members
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Name *</Label>
                    <Input value={familyMemberForm.name} onChange={(e) => setFamilyMemberForm((f) => ({ ...f, name: e.target.value }))} placeholder="Family member name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Relation *</Label>
                    <Select value={familyMemberForm.relation} onValueChange={(v) => setFamilyMemberForm((f) => ({ ...f, relation: v }))}>
                      <SelectTrigger><SelectValue placeholder="Relation" /></SelectTrigger>
                      <SelectContent>{relations.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Age *</Label>
                    <Input type="number" value={familyMemberForm.age} onChange={(e) => setFamilyMemberForm((f) => ({ ...f, age: e.target.value }))} placeholder="Age" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sum Assured (₹) *</Label>
                    <Input type="number" value={familyMemberForm.sumAssured} onChange={(e) => setFamilyMemberForm((f) => ({ ...f, sumAssured: e.target.value }))} placeholder="Sum assured" />
                  </div>
                </div>
                <Button type="button" onClick={handleAddFamilyMember} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" /> Add Family Member
                </Button>
              </div>

              {familyMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Added Family Members ({familyMembers.length})</h4>
                  <div className="space-y-2">
                    {familyMembers.map((member) => (
                      <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.relation} | Age: {member.age} | Sum Assured: ₹{member.sumAssured.toLocaleString()}
                          </p>
                        </div>
                        <Button type="button" onClick={() => handleRemoveFamilyMember(member.id)} variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex gap-3">
              <Button type="submit" className="gradient-primary"><Save className="w-4 h-4 mr-1" /> {editingClientId ? "Update Client" : "Save Client"}</Button>
              {editingClientId && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel Edit</Button>}
            </div>
          </div>
        </motion.form>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Company</th>
                <th className="text-left p-3 font-medium">Policy No.</th>
                <th className="text-left p-3 font-medium">Policy Type</th>
                <th className="text-left p-3 font-medium">Premium</th>
                <th className="text-left p-3 font-medium">Sum Assured</th>
                <th className="text-left p-3 font-medium">End Date</th>
                <th className="text-left p-3 font-medium">Mobile</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-8 text-muted-foreground">No clients yet. Add your first mediclaim client!</td></tr>
              ) : clients.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} onClick={() => void openClientSummary(c)} className="border-b hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.company}</td>
                  <td className="p-3">{c.policyNumber}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-medium ${c.policyType === 'family' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{c.policyType === 'family' ? 'Family Floater' : 'Single'}</span></td>
                  <td className="p-3">₹{c.premium.toLocaleString()}</td>
                  <td className="p-3">₹{c.sumAssured.toLocaleString()}</td>
                  <td className="p-3">{formatDateDisplay(c.endDate)}</td>
                  <td className="p-3">{c.mobile}</td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClient(c);
                      }}
                    >
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

            {summaryLoading && (
              <div className="px-6 pt-4 text-sm text-muted-foreground">
                Reloading latest summary...
              </div>
            )}

            <div className="p-6 space-y-6">
              {selectedClient.documents && selectedClient.documents.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">📄 Uploaded Documents ({selectedClient.documents.length})</h3>
                  <div className="space-y-2">
                    {selectedClient.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{doc.label ? `${doc.label}: ` : ''}{doc.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{doc.type || 'application/pdf'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button type="button" variant="ghost" size="sm" title="Open in new tab" onClick={() => window.open(doc.url, '_blank')}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            title="Download file"
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
                <div><Label className="text-xs text-muted-foreground">Company</Label><p className="font-medium">{selectedClient.company}</p></div>
                <div><Label className="text-xs text-muted-foreground">Policy Number</Label><p className="font-medium">{selectedClient.policyNumber}</p></div>
                <div><Label className="text-xs text-muted-foreground">Policy Type</Label><p className="font-medium">{selectedClient.policyType === 'family' ? 'Family Floater' : 'Single'}</p></div>
                <div><Label className="text-xs text-muted-foreground">Age</Label><p className="font-medium">{selectedClient.age}</p></div>
                <div><Label className="text-xs text-muted-foreground">Date of Birth</Label><p className="font-medium">{formatDateDisplay(selectedClient.dob)}</p></div>
                <div><Label className="text-xs text-muted-foreground">Sum Assured (₹)</Label><p className="font-medium">₹{selectedClient.sumAssured.toLocaleString()}</p></div>
                <div><Label className="text-xs text-muted-foreground">Premium (₹)</Label><p className="font-medium">₹{selectedClient.premium.toLocaleString()}</p></div>
                <div><Label className="text-xs text-muted-foreground">Mobile</Label><p className="font-medium">{selectedClient.mobile}</p></div>
                <div><Label className="text-xs text-muted-foreground">Email</Label><p className="font-medium">{selectedClient.email}</p></div>
                <div><Label className="text-xs text-muted-foreground">Start Date</Label><p className="font-medium">{formatDateDisplay(selectedClient.startDate)}</p></div>
                <div><Label className="text-xs text-muted-foreground">End Date</Label><p className="font-medium">{formatDateDisplay(selectedClient.endDate)}</p></div>
              </div>

              {selectedClient.policyType === 'family' && selectedClient.familyMembers && selectedClient.familyMembers.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Family Members</h3>
                  <div className="space-y-2">
                    {selectedClient.familyMembers.map((member) => (
                      <div key={member.id} className="p-3 bg-muted rounded">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.relation} | Age: {member.age} | Sum Assured: ₹{member.sumAssured.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </PageWrapper>
  );
}
