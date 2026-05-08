import { Client, Lead, Target } from './types';
import { db } from './firebase';
import {
  collection,
  deleteDoc,
  getDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

const CLIENTS_COLLECTION = 'clients';
const LEADS_COLLECTION = 'leads';
const TARGETS_COLLECTION = 'targets';

export async function getClients(): Promise<Client[]> {
  const snapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
  const clients = snapshot.docs.map((docItem) => {
    const data = docItem.data() as Client;
    console.log("Loaded client from Firestore:", data);
    return data;
  });
  return clients;
}

export async function getClientById(id: string): Promise<Client | null> {
  const snapshot = await getDoc(doc(db, CLIENTS_COLLECTION, id));

  if (!snapshot.exists()) {
    return null;
  }

  const client = snapshot.data() as Client;
  console.log("Loaded client by id from Firestore:", client);
  return client;
}

export async function saveClient(client: Client) {
  console.log("Saving client to Firestore:", client);
  await setDoc(doc(db, CLIENTS_COLLECTION, client.id), client);
  console.log("Client saved successfully");
}

export async function deleteClient(id: string) {
  await deleteDoc(doc(db, CLIENTS_COLLECTION, id));
}

export async function getLeads(): Promise<Lead[]> {
  const snapshot = await getDocs(collection(db, LEADS_COLLECTION));
  return snapshot.docs.map((docItem) => docItem.data() as Lead);
}

export async function saveLead(lead: Lead) {
  await setDoc(doc(db, LEADS_COLLECTION, lead.id), lead);
}

export async function deleteLead(id: string) {
  await deleteDoc(doc(db, LEADS_COLLECTION, id));
}

export async function getTargets(): Promise<Target[]> {
  const snapshot = await getDocs(collection(db, TARGETS_COLLECTION));
  return snapshot.docs.map((docItem) => docItem.data() as Target);
}

export async function saveTarget(target: Target) {
  await setDoc(doc(db, TARGETS_COLLECTION, target.id), target);
}

export async function getRenewalsByMonth(month: number, year: number): Promise<Client[]> {
  const clients = await getClients();
  return clients.filter(c => {
    const end = new Date(c.endDate);
    return end.getMonth() === month && end.getFullYear() === year;
  });
}
