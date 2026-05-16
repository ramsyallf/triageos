# TriageOS — AI-Powered Emergency Triage System

<div align="center">

![TriageOS Logo](https://img.shields.io/badge/TriageOS-v0.1.0-0066FF?style=for-the-badge&labelColor=0a0a2e)
[![License: MIT](https://img.shields.io/badge/License-MIT-00D4AA?style=for-the-badge&labelColor=0a0a2e)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&labelColor=0a0a2e)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&labelColor=0a0a2e)](https://www.typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Multimodal-E4295E?style=for-the-badge&logo=google&labelColor=0a0a2e)](https://ai.google.dev)
[![ESI v4](https://img.shields.io/badge/ESI-v4-00C48C?style=for-the-badge&labelColor=0a0a2e)](https://www.ena.org/esi)

**Voice-first AI triage system for Indonesian emergency departments.**  
Transformasi triase IGD dengan kecerdasan buatan — lebih cepat, lebih konsisten, lebih efisien.

**[Live Demo](https://app.triageos.web.id)**

</div>

---

## 🎯 Why TriageOS?

Emergency departments in Indonesia face a critical challenge: **150 million ED visits annually**, yet nurse-to-patient ratios remain critically low. Manual triage takes 5–15 minutes per patient — time that could mean the difference between life and death.

**TriageOS addresses this by:**

| Problem | Impact | TriageOS Solution |
|---|---|---|
| Manual triage takes 5–15 min/patient | Long wait times, overcrowding | AI generates triage note in **< 1 minutes** |
| Inconsistent ESI level assignment | Patient safety risk, liability | **ESI v4 compliant** algorithm with confidence scoring |
| Language barrier in clinical AI | Poor adoption, inaccurate triage | **Bahasa Indonesia first** — built for Indonesian healthcare |
| Fragmented documentation | Data silos, missed critical info | **Multimodal input** — voice, text, image, vital signs unified |
| High nurse administrative burden | Burnout, turnover | **Ambient listening** + auto-documentation |

---

## ✨ Key Features

### 🤖 AI-Powered Triage Engine
- **Multimodal AI** powered by Google Gemini — processes text, voice, and images simultaneously
- **ESI Level Prediction** (1–5) with confidence score (e.g., *"87% confident: ESI Level 2"*)
- **Automatic function calling** — AI extracts patient data, lab results, and vital signs dynamically
- **Clinical guardrails** — negation detection, comorbidity awareness, SOPQRST structured questioning

### 🎤 Voice-First Interface
- **Ambient listening** — real-time transcription of nurse-patient dialogue using Web Speech API
- **Silence timeout** (30s) with auto-restart guard for unreliable network conditions
- **Fallback to text input** — manual entry when voice is not feasible in noisy ED environments

### 📸 Multimodal Input
- **Image upload** — capture wounds, EKG prints, monitor screens, X-rays
- **Vital Signs Form** — structured entry: BP, HR, SpO2, Temperature, Respiratory Rate, GCS, Pain Score
- **Anamnesis Assistant** — structured tips based on SOPQRST framework

### 📄 Clinical Documentation
- **Auto-generated Triage Note** — structured clinical summary ready for SIMRS integration
- **Nurse Edit Mode** — full edit capability before final save
- **Print / PDF Export** — professional layout with hospital header and ESI color banner

### 🏥 ESI v4 Compliance
- All 5 ESI levels fully implemented with evidence-based decision trees
- Comorbidity-adjusted risk scoring
- Override capability for experienced triage nurses

---

## ⚙️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                   TRIAGE WORKFLOW                           │
└─────────────────────────────────────────────────────────────┘

  [1] PATIENT ENTRY          [2] ANAMNESIS           [3] MULTIMODAL INPUT
  ┌──────────────┐           ┌──────────────┐        ┌──────────────────────┐
  │ Patient ID / │           │ Voice Record  │        │  📸 Image Upload     │
  │ BPJS Number  │─────────▶│ or Text Input │───────▶│  💓 Vital Signs      │
  └──────────────┘           └──────────────┘        └──────────────────────┘
                                                             │
                                                             ▼
  [6] SAVE + EXPORT     [5] NURSE REVIEW      [4] AI ANALYSIS
  ┌──────────────┐       ┌──────────────┐        ┌──────────────────────┐
  │ Print / PDF  │◀──────│ Edit Results │◀───────│ Gemini AI Processing │
  │ Save to DB   │       │ Confirm ESI  │        │ ESI Level + Note     │
  └──────────────┘       └──────────────┘        └──────────────────────┘
```

---

## 🏗️ Architecture

```
                         ┌──────────────────────────────────┐
                         │         CLIENT LAYER             │
                         │  React 18 + TypeScript + Vite   │
                         │  TailwindCSS · Lucide Icons     │
                         └──────────────┬───────────────────┘
                                        │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
┌──────────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│  Voice Input     │       │  Multimodal Input  │       │  Vital Signs     │
│  Web Speech API  │       │  Image + Text      │       │  Structured Form │
│  (Ambient List.) │       │  (Gemini Vision)   │       │  (ESI v4 Fields) │
└────────┬─────────┘       └──────────┬──────────┘       └────────┬─────────┘
         │                              │                              │
         └──────────────────────────────┼──────────────────────────────┘
                                        │
                         ┌──────────────▼───────────────────┐
                         │        AI ENGINE                 │
                         │   Google Gemini API (Multimodal)│
                         │   ├── Function Calling           │
                         │   │   └── get_patient_data()     │
                         │   │   └── get_lab_results()      │
                         │   ├── ESI v4 Classifier          │
                         │   └── Clinical Note Generator    │
                         └──────────────┬───────────────────┘
                                        │
                         ┌──────────────▼───────────────────┐
                         │       BACKEND LAYER               │
                         │   Convex (Real-time Database)    │
                         │   ├── Triage Sessions            │
                         │   ├── Patient Records (mock)     │
                         │   └── Session History            │
                         └──────────────────────────────────┘

                         ┌──────────────────────────────────┐
                         │       OUTPUT LAYER                │
                         │  ├── ESI Level + Confidence %    │
                         │  ├── Clinical Triage Note        │
                         │  ├── Editable by Nurse           │
                         │  └── Print / PDF Export          │
                         └──────────────────────────────────┘
```

### Data Flow
```
Nurse Input → Web Speech API / Manual Text → Gemini API
    │
    ├── [Function Call] get_patient_data() ──▶ Patient Demographics
    ├── [Function Call] get_lab_results()  ──▶ Lab History
    └── [Vision API]     Image Analysis      ──▶ Wound/Monitor Data
                                                          │
                                                    ESI Classification
                                                    Clinical Note Generation
                                                          │
                                                    Nurse Review → Save / Print
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Fast, modern SPA development |
| **Language** | TypeScript 5.5 | Type safety, maintainability |
| **Styling** | Tailwind CSS 3.4 | Utility-first, responsive design |
| **Icons** | Lucide React | Consistent, clinical-grade iconography |
| **AI Engine** | Google Gemini API | Multimodal (text, voice, image) |
| **Function Calling** | Gemini Function Declarations | Structured data extraction |
| **Backend / Database** | Convex | Real-time reactive database |
| **Speech-to-Text** | Web Speech API | Browser-native voice input |
| **PDF Export** | Browser Print API | Zero-dependency printing |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** 1.x
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)
- Modern browser (Chrome 110+, Edge 110+, Safari 16.4+)

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/ramsyallf/triageos.git
cd triageos

# Install dependencies (using Bun — recommended)
bun install

# OR using npm
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```bash
# .env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_CONVEX_URL=your_convex_deployment_url_here
```

> ⚠️ **Security Note:** Never commit your `.env` file. The `VITE_GEMINI_API_KEY` is exposed to the client (prefixed with `VITE_`), which is acceptable for MVP/demo use with restricted API keys. For production, route all AI calls through a secure backend proxy.

### Run Development Server

```bash
# Using Bun (recommended)
bun run dev

# Using npm
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build optimized bundle
bun run build

# Preview production build
bun run preview
```

### Docker Build (Optional)

```bash
# Build image
docker build -t triageos \
  --build-arg VITE_GEMINI_API_KEY=your_key \
  --build-arg VITE_CONVEX_URL=your_convex_url \
  .

# Run container
docker run -p 8080:80 triageos
```

---

### Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time-to-Triage | < 1 minutes |
| Bundle Size (gzipped) | < 200KB |

---

## 🗺️ Roadmap

```
IMMEDIATE (MVP+)          NEAR-TERM (Q3 2026)           LONG-TERM (Q4 2026+)
─────────────────────     ──────────────────────         ──────────────────────────
🔸 Firebase + Auth        🔸 SIMRS Integration           🔸 IoT Vital Signs sync
🔸 Offline mode (PWA)     🔸 HL7/FHIR compatibility     🔸 Multi-hospital network
🔸 Mobile-responsive UI   🔸 Medical STT (specialized)  🔸 ML model fine-tuning
                          🔸 Analytics dashboard         🔸 Regional language pack
```

---