export type InsuranceType = 'mediclaim' | 'life' | 'vehicle';

export type MediclaimCompany = 'Aditya Birla Health Insurance' | 'Niva Bupa' | 'HDFC Ergo' | 'National Insurance' | 'Oriental Insurance';
export type LifeInsuranceCompany = 'LIC' | 'TATA AIA';
export type VehicleInsuranceCompany = 'Bajaj Allianz' | 'National Insurance';
export type VehicleInsuranceType = '3rd Party' | 'Bumper to Bumper';

export interface BaseClient {
  id: string;
  type: InsuranceType;
  name: string;
  policyNumber: string;
  mobile: string;
  email: string;
  premium: number;
  startDate: string;
  endDate: string;
  documents: DocumentFile[];
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  sumAssured: number;
}

export interface MediclaimClient extends BaseClient {
  type: 'mediclaim';
  company: MediclaimCompany;
  age: number;
  dob: string;
  sumAssured: number;
  policyType: 'single' | 'family';
  familyMembers?: FamilyMember[];
}

export interface LifeInsuranceClient extends BaseClient {
  type: 'life';
  company: LifeInsuranceCompany;
  age: number;
  dob: string;
  sumAssured: number;
}

export interface VehicleInsuranceClient extends BaseClient {
  type: 'vehicle';
  company: VehicleInsuranceCompany;
  vehicleNumber: string;
  chassisNumber: string;
  vehicleModel: string;
  insuranceType: VehicleInsuranceType;
}

export type Client = MediclaimClient | LifeInsuranceClient | VehicleInsuranceClient;

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  url: string;
  label?: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  source: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  notes: string;
  createdAt: string;
}

export interface Target {
  id: string;
  month: string;
  year: number;
  targetPremium: number;
  achievedPremium: number;
  targetPolicies: number;
  achievedPolicies: number;
}
