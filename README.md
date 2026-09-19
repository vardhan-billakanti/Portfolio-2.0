# Portfolio 2.0 — Billakanti Jaya Vardhan

Portfolio 2.0 is a premium, futuristic personal portfolio showcasing Billakanti Jaya Vardhan's journey across cybersecurity, technology, innovation, entrepreneurship, and digital product building.

## Overview

Portfolio 2.0 presents an immersive, high-performance web experience introducing Billakanti Jaya Vardhan's work and vision across key areas:

- **About**: Personal background, mission, core philosophies, and creative vision
- **Academic Background**: Educational milestones and formal foundational training
- **Toolkit**: Interactive skill matrix spanning cybersecurity, full-stack development, cloud architecture, and systems engineering
- **Projects**: Comprehensive showcase of production-grade applications, tools, and digital platforms
- **Certifications**: Verified technical credentials across industry-recognized cybersecurity and cloud domains
- **Lorven Enterprise**: Enterprise technology ventures and business initiatives
- **Founders**: Leadership background, vision, and strategic partnerships
- **Get In Touch**: Secure contact portal with direct EmailJS transmission and instant confirmation
- **BOB AI Assistant**: Autonomous floating AI companion with portfolio awareness and real-time image search

## Features

- **Premium Futuristic Portfolio Experience**: Custom-crafted dark aesthetics, glassmorphism, restrained warm-orange accents, and sleek typography
- **Responsive Design**: Flawless, adaptive layout engineered for desktop, tablet, and mobile displays
- **Smooth Animations and Transitions**: Hardware-accelerated micro-interactions, cursor trails, and scroll reveals
- **Interactive Toolkit**: Interactive orbital skill visualization categorized by technology domain
- **Project Showcase**: Detailed cards with live project URLs, technology tags, and architectural summaries
- **Certification Showcase**: Verified credentials with issuing authorities and direct credential verification
- **Lorven Enterprise Section**: Dedicated spotlight on enterprise-level operations and ventures
- **Founders Section**: Executive profile highlighting venture leadership and ecosystem impact
- **EmailJS Contact Form**: Client-side contact form with real-time input validation and secure message dispatch
- **Automatic Contact Confirmation Email**: Automated notification and auto-reply sequence delivered to the sender
- **BOB AI Assistant**: Autonomous assistant offering intelligent conversational guidance and smooth section navigation
- **Portfolio-Aware AI Responses**: Semantic knowledge base providing accurate details about projects, skills, and background
- **Real-Time Image Search**: Context-aware Wikimedia/Wikipedia image retrieval with visual cards, previews, and pagination

## Tech Stack

- **Core Frontend**: HTML5, Vanilla JavaScript (ES Modules), Vanilla CSS3 (Custom Design System, CSS Variables, Glassmorphism)
- **Tooling & Build System**: Vite 6 (`vite`, `vite build`, `vite preview`)
- **Integrations**:
  - `@emailjs/browser` — Direct client-side contact delivery and transactional auto-reply workflow
  - `@google/genai` — Google Gemini Developer API integration powering BOB's intelligence
- **Deployment & Security**: Vercel configuration (`vercel.json`) with strict Content Security Policy (CSP), anti-clickjacking, and HTTPS hardening headers

## Project Structure

```
Portfolio 2.0/
├── api/                  # Serverless function endpoints for backend processing
│   └── bob.js            # BOB assistant API endpoint
├── public/               # Static public assets (images, icons, fonts, badges)
├── src/                  # Application source code
│   ├── components/       # Modular section components
│   │   ├── hero-section.js
│   │   ├── about-section.js
│   │   ├── academics-section.js
│   │   ├── toolkit-section.js
│   │   ├── projects-section.js
│   │   ├── certifications-section.js
│   │   ├── lorven-section.js
│   │   ├── founders-section.js
│   │   ├── contact-section.js
│   │   └── bob-assistant.js
│   ├── data/             # Portfolio knowledge, project catalog, and responses
│   │   ├── portfolio-knowledge.js
│   │   ├── projects-data.js
│   │   └── bob-responder.js
│   ├── server/           # Backend services for Gemini and image search
│   │   ├── gemini-service.js
│   │   └── bob-image-service.js
│   └── styles/           # Global styles and responsive layout
├── .env.example          # Environment variable template with placeholders
├── .gitignore            # Git exclusion rules for secrets, builds, and dependencies
├── index.html            # Primary single-page portfolio application
├── projects.html         # Dedicated full-page project gallery
├── package.json          # Project metadata, dependencies, and scripts
├── vercel.json           # Production headers, security rules, and routing
└── vite.config.js        # Vite build tool and development server configuration
```

## Environment Variables

Required environment variables must be configured locally. Real `.env` files are intentionally excluded from Git via `.gitignore` to prevent credential exposure.

Refer to `.env.example` for the required configuration keys:

```bash
# Google Gemini API Key (Server-Side Only for BOB Assistant)
GEMINI_API_KEY=

# EmailJS Configuration (Client-Side Safe Public Keys)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_CONTACT_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

To configure locally, copy `.env.example` to `.env.local` and add your credentials:

```bash
cp .env.example .env.local
```

## Local Development

Install project dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Preview the local production build:

```bash
npm run preview
```

## Build

Compile and bundle the project for production:

```bash
npm run build
```

The optimized production output will be generated in the `dist/` directory.

## Author

**Billakanti Jaya Vardhan**

- **Portfolio**: [https://vardhanbillakanti.in](https://vardhanbillakanti.in)
- **GitHub**: [https://github.com/vardhanbillakanti125-crypto](https://github.com/vardhanbillakanti125-crypto)
- **LinkedIn**: [https://www.linkedin.com/in/jaya-vardhan-billakanti-0053b7382/](https://www.linkedin.com/in/jaya-vardhan-billakanti-0053b7382/)
- **Instagram**: [https://www.instagram.com/vardhan_billakanti/](https://www.instagram.com/vardhan_billakanti/)
- **Threads**: [https://www.threads.com/@vardhan_billakanti](https://www.threads.com/@vardhan_billakanti)
- **X**: [https://x.com/VardhanBil31357](https://x.com/VardhanBil31357)
