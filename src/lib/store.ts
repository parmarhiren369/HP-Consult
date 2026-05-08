import { Client, Lead, Target } from './types';
// Firebase connection disabled
// import { db } from './firebase';
// import {
//   collection,
//   deleteDoc,
//   getDoc,
//   doc,
//   getDocs,
//   setDoc,
// } from 'firebase/firestore';

// const CLIENTS_COLLECTION = 'clients';
// const LEADS_COLLECTION = 'leads';
// const TARGETS_COLLECTION = 'targets';

// Firebase connection disabled - functions return empty data
// Uncomment when Firebase is reconnected

export async function getClients(): Promise<Client[]> {
  console.warn("Firebase disabled: getClients() returning empty array");
  return [];
}

export async function getClientById(id: string): Promise<Client | null> {
  console.warn("Firebase disabled: getClientById() returning null");
  return null;
}

export async function saveClient(client: Client) {
  console.warn("Firebase disabled: saveClient() - data not persisted", client);
  // Mock implementation - data not saved
}

export async function deleteClient(id: string) {
  console.warn("Firebase disabled: deleteClient() called", id);
  // Mock implementation - nothing deleted
}

export async function getLeads(): Promise<Lead[]> {
  console.warn("Firebase disabled: getLeads() returning empty array");
  return [];
}

export async function saveLead(lead: Lead) {
  console.warn("Firebase disabled: saveLead() - data not persisted", lead);
  // Mock implementation - data not saved
}

export async function deleteLead(id: string) {
  console.warn("Firebase disabled: deleteLead() called", id);
  // Mock implementation - nothing deleted
}

export async function getTargets(): Promise<Target[]> {
  console.warn("Firebase disabled: getTargets() returning empty array");
  return [];
}

export async function saveTarget(target: Target) {
  console.warn("Firebase disabled: saveTarget() - data not persisted", target);
  // Mock implementation - data not saved
}

export async function getRenewalsByMonth(month: number, year: number): Promise<Client[]> {
  console.warn("Firebase disabled: getRenewalsByMonth() returning empty array");
  return [];
}
