import type { Id } from '../../convex/_generated/dataModel'
import type {
  ConvexVitalSignsInput,
  PatientRecord,
  SessionListItem,
  TriageSession,
  VitalSignsInput,
} from '~/types'

type RecentTriageSession = {
  _id: Id<'triageSessions'>
  patientId: Id<'patients'>
  anamnesisText: string
  uploadedPhotoStorageIds: Id<'_storage'>[]
  vitalSigns: ConvexVitalSignsInput
  generatedTriageNote?: TriageSession['triageNote']
  status?: TriageSession['status']
  createdAt: number
  updatedAt: number
  patient: PatientRecord | null
}

export function toConvexVitals(vitals: VitalSignsInput): ConvexVitalSignsInput {
  return {
    systolicBloodPressure: vitals.systolicBP,
    diastolicBloodPressure: vitals.diastolicBP,
    heartRate: vitals.heartRate,
    spo2: vitals.spO2,
    temperature: vitals.temperature,
    respiratoryRate: vitals.respiratoryRate,
    gcs: vitals.gcs,
    painScore: vitals.painScore,
  }
}

export function fromConvexVitals(vitals: ConvexVitalSignsInput): VitalSignsInput {
  return {
    systolicBP: vitals.systolicBloodPressure,
    diastolicBP: vitals.diastolicBloodPressure,
    heartRate: vitals.heartRate,
    spO2: vitals.spo2,
    temperature: vitals.temperature,
    respiratoryRate: vitals.respiratoryRate,
    gcs: vitals.gcs,
    painScore: vitals.painScore,
  }
}

export function toSessionListItem(session: RecentTriageSession): SessionListItem {
  return {
    id: session._id,
    patientId: session.patient?.bpjsId ?? session.patientId,
    patientName: session.patient?.name,
    timestamp: new Date(session.createdAt).toISOString(),
    esiLevel: session.generatedTriageNote?.esiLevel ?? null,
    transcript: session.anamnesisText,
  }
}

export function toTriageSession(session: RecentTriageSession): TriageSession {
  return {
    id: session._id,
    patientId: session.patient?.bpjsId ?? session.patientId,
    convexPatientId: session.patientId,
    selectedPatient: session.patient,
    patientName: session.patient?.name,
    patientBpjsId: session.patient?.bpjsId,
    transcript: session.anamnesisText,
    images: [],
    uploadedPhotoStorageIds: session.uploadedPhotoStorageIds,
    triageNote: session.generatedTriageNote ?? null,
    timestamp: new Date(session.updatedAt).toISOString(),
    esiLevel: session.generatedTriageNote?.esiLevel ?? null,
    vitals: fromConvexVitals(session.vitalSigns),
    status: session.status,
  }
}
