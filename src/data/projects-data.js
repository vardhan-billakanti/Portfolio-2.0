/**
 * projects-data.js  — Portfolio 2.0
 * Centralized single source of truth for all project data.
 * Consumed by both ProjectsSectionController (homepage cards)
 * and ProjectDetailRouter (full case study pages).
 */

export const PROJECTS = [
  {
    slug: 'portfolio',
    number: '01',
    title: 'Portfolio',
    category: 'Portfolio & Web',
    year: '2026',
    shortDescription:
      'A modern personal portfolio built with vanilla HTML, CSS, and JavaScript without UI frameworks. It showcases my academic journey, developer projects, and certifications through an interactive dark interface with a radial particle engine and 3D orbital toolkit.',
    mainDescription:
      'Personal portfolio showcasing my journey, skills, projects, and professional work.',
    fullDescription:
      'A fully custom personal portfolio website built from scratch with vanilla HTML, CSS, and JavaScript — no frameworks, no templates. The design centres on a premium dark visual identity with restrained warm-orange accents, sophisticated typography, and a rich set of micro-interactions. Every section — from the hero animation sequence to the academics timeline and 3D orbital toolkit — was engineered individually. The contact system integrates EmailJS for client-side email delivery without a backend server.',
    image: '/images/proj_portfolio.jpg',
    tech: ['HTML5', 'CSS3', 'JavaScript', 'EmailJS', 'Git', 'GitHub', 'Vercel'],
    mainTech: ['HTML5', 'CSS3', 'JavaScript', 'EmailJS'],
    features: [
      'Cinematic hero opening sequence with radial canvas particle engine',
      'Interactive 3D orbital technology showcase built in pure JS',
      'Scroll-triggered reveal animations using IntersectionObserver',
      'Futuristic academic timeline with animated connector nodes',
      'Integrated AI assistant (BOB) powered by Gemini API via SSE streaming',
      'EmailJS contact form with validation and client-side delivery',
      'Custom precision cursor with magnetic hover effects',
      'Fully responsive across desktop, tablet, and mobile',
    ],
    technicalDetails: {
      frontend: 'Vanilla HTML5, CSS3 custom properties, JavaScript ES Modules',
      animation: 'requestAnimationFrame loops, CSS transitions, IntersectionObserver API',
      tooling: 'Vite build system for bundling and dev server',
      deployment: 'Vercel with automatic CI/CD from GitHub',
      integrations: 'EmailJS (contact), Google Gemini API (BOB assistant)',
      performance: 'CSS transforms only, no layout-triggering animations, lazy-loaded images',
    },
    liveUrl: 'https://vardhanbillakanti.in/',
    githubUrl: null,
  },
  {
    slug: 'vaultix',
    number: '02',
    title: 'VAULTIX',
    category: 'Cloud Storage & Privacy',
    year: '2026',
    shortDescription:
      'A privacy-first cloud storage platform that uses each user\'s personal Google Drive as its storage backend for complete data ownership. It provides nested folders, favorites, notes, and trash management, secured with Google OAuth 2.0 and AES-256-GCM metadata encryption.',
    mainDescription:
      'Privacy-focused personal cloud storage using Google Drive for secure and organized file management.',
    fullDescription:
      'VAULTIX is a privacy-first cloud storage solution that uniquely leverages the user\'s personal Google Drive as its file storage backend — meaning files are stored in the user\'s own account, not on a third-party server. The platform provides Google OAuth 2.0 authentication, organized file management with folders, favourites, notes, and a dedicated trash system. All file metadata and access tokens are stored in a Turso (libSQL) edge database. File names and sensitive metadata are encrypted at rest with AES-256-GCM on the server before being written to the database.',
    image: '/images/proj_vaultix.jpg',
    tech: ['React', 'TypeScript', 'Vite', 'Node.js', 'Express', 'Google Drive API', 'Google Drive', 'Turso / libSQL', 'Google OAuth 2.0', 'bcrypt', 'AES-256-GCM', 'Vercel'],
    mainTech: ['React', 'TypeScript', 'Google Drive API', 'Express'],
    features: [
      'Google OAuth 2.0 authentication — zero password storage',
      'Stores files in user\'s own Google Drive — true data ownership',
      'Folder hierarchy with nested organization support',
      'Favourites system for quick access to important files',
      'Notes attached to individual files for context',
      'Dedicated trash system with restore and permanent delete',
      'AES-256-GCM server-side encryption for all stored metadata',
      'JWT session management with bcrypt-secured refresh tokens',
    ],
    technicalDetails: {
      frontend: 'React 18, TypeScript, Vite',
      backend: 'Node.js, Express — REST API',
      database: 'Turso (libSQL edge database) for user metadata and tokens',
      storage: "User's personal Google Drive via Google Drive API v3",
      auth: 'Google OAuth 2.0 — access token + refresh token management',
      security: 'AES-256-GCM encryption at rest, bcrypt token hashing, JWT sessions',
      deployment: 'Vercel (frontend + serverless functions)',
    },
    liveUrl: 'https://myvaultix.vercel.app/',
    githubUrl: null,
  },
  {
    slug: 'mycloudstore',
    number: '03',
    title: 'MyCloudStore',
    category: 'Cloud & Storage',
    year: '2026',
    shortDescription:
      'A full-stack personal cloud storage web app built with Next.js, MongoDB Atlas, and Vercel Blob. It supports nested folder hierarchies, in-browser document previews, attached notes, and a PIN-protected Secure Vault that isolates and encrypts sensitive files.',
    mainDescription:
      'Personal cloud storage for uploading, organizing, previewing, and managing files online.',
    fullDescription:
      'MyCloudStore is a full-stack cloud storage web application built with Next.js and backed by MongoDB Atlas and Vercel Blob storage. Users can upload files of any type, organize them into nested folders, preview images and documents directly in the browser, attach notes to files, and manage a trash system with restore and permanent delete. A standout feature is the PIN-protected Secure Vault — a hidden partitioned area within the account where sensitive files can be stored behind a separate numeric PIN, invisible to anyone accessing the main drive.',
    image: '/images/proj_cloudstore.jpg',
    tech: ['Next.js', 'React', 'TypeScript', 'MongoDB Atlas', 'Vercel Blob', 'Server-side Authentication', 'GitHub', 'Vercel'],
    mainTech: ['Next.js', 'React', 'TypeScript', 'MongoDB Atlas'],
    features: [
      'Full-stack Next.js app with server-side authentication',
      'File upload with drag-and-drop support and progress tracking',
      'Nested folder hierarchy for organized file management',
      'In-browser file preview for images, PDFs, and documents',
      'Notes system attached to individual files',
      'Trash with restore and permanent delete capabilities',
      'PIN-protected Secure Vault — a hidden encrypted partition',
      'Full-text search across all file names and notes',
    ],
    technicalDetails: {
      frontend: 'Next.js 14, React, TypeScript',
      backend: 'Next.js API routes (serverless)',
      database: 'MongoDB Atlas — file metadata, folder structure, user data',
      storage: 'Vercel Blob for binary file storage',
      auth: 'Server-side session authentication via Next.js middleware',
      security: 'PIN-protected vault partition, server-side auth guards on all routes',
      deployment: 'Vercel',
    },
    liveUrl: 'https://mycloudstore.vercel.app/',
    githubUrl: null,
  },
  {
    slug: 'explore-the-globe',
    number: '04',
    title: 'Explore The Globe',
    category: 'Interactive & Exploration',
    year: '2026',
    shortDescription:
      'An interactive 3D geography platform built with vanilla JavaScript and raw WebGL without external 3D libraries. Users can rotate a photorealistic Earth, zoom across continents, and click any nation to view cultural history, regional geography, and local facts.',
    mainDescription:
      'Interactive 3D globe for exploring countries and discovering information about the world.',
    fullDescription:
      'Explore The Globe is a browser-based interactive 3D geography platform built with pure HTML, CSS, and JavaScript using the WebGL API directly. Users can rotate a photorealistic Earth, click on any country to select it, and instantly see a detailed information panel about that region — including its regions, culture, history, cuisine, popular places, and interesting facts. Country borders are rendered from GeoJSON data projected onto the 3D sphere geometry. The experience runs entirely client-side with no backend required.',
    image: '/images/proj_exploreglobe.jpg',
    tech: ['HTML5', 'CSS3', 'JavaScript', 'WebGL', 'GeoJSON', 'GitHub', 'Vercel'],
    mainTech: ['JavaScript', 'WebGL', 'GeoJSON', 'CSS3'],
    features: [
      'Interactive 3D Earth rendered with WebGL — no library dependencies',
      'Photorealistic Earth texture with atmospheric lighting',
      'Click-to-select any country via GeoJSON border ray-casting',
      'Detailed country information panel: regions, culture, history, cuisine',
      'Smooth globe rotation with inertia-based mouse drag',
      'Country highlight with border glow on selection',
      'Zoom in/out with mouse scroll and pinch gesture support',
      'Fully client-side — zero backend or database required',
    ],
    technicalDetails: {
      frontend: 'Vanilla HTML5, CSS3, JavaScript — zero framework dependencies',
      rendering: 'Raw WebGL API for 3D sphere rendering and texture mapping',
      data: 'GeoJSON country borders for hit-testing and boundary rendering',
      interaction: 'Custom mouse/touch event handlers for drag, zoom, and selection',
      deployment: 'Static site on Vercel',
    },
    liveUrl: 'https://exploreglobe.vercel.app/',
    githubUrl: null,
  },
  {
    slug: 'doomchat',
    number: '05',
    title: 'DoomChat',
    category: 'Real-Time & Security',
    year: '2026',
    shortDescription:
      'An ephemeral real-time web chat platform engineered for private conversations without accounts or database persistence. Messages are end-to-end encrypted via the Web Crypto API and sent over WebSockets powered by Cloudflare Workers and Durable Objects.',
    mainDescription:
      'Temporary, end-to-end encrypted real-time chat with zero signups and no message persistence.',
    fullDescription:
      'DoomChat is a temporary real-time web chat platform engineered for private conversations without traditional user accounts. Rooms are created on demand, identified by a unique code, and destroyed when all participants leave. Messages are encrypted client-side using the Web Crypto API (AES-GCM with PBKDF2 key derivation) before being transmitted — meaning the server never sees plaintext. Real-time communication uses WebSockets via Cloudflare Workers and Durable Objects, which also manage room state and participant hibernation. No messages are persisted to any database.',
    image: '/images/proj_doomchat.jpg',
    tech: ['React', 'TypeScript', 'Vite', 'Cloudflare Workers', 'Durable Objects', 'WebSockets', 'Web Crypto API', 'AES-GCM', 'PBKDF2', 'Vercel'],
    mainTech: ['React', 'TypeScript', 'Cloudflare', 'WebSockets'],
    features: [
      'No accounts required — join or create a room with a single code',
      'Client-side AES-GCM end-to-end encryption via Web Crypto API',
      'PBKDF2 key derivation from a shared room passphrase',
      'Real-time WebSocket communication via Cloudflare Durable Objects',
      'Room hibernation — server hibernates inactive connections to save resources',
      'Zero message persistence — nothing stored in any database',
      'Automatic room destruction when all participants disconnect',
      'Works on any modern browser with no installation required',
    ],
    technicalDetails: {
      frontend: 'React 18, TypeScript, Vite',
      backend: 'Cloudflare Workers (serverless edge) + Durable Objects (stateful room management)',
      realtime: 'WebSockets through Cloudflare Durable Objects with hibernation API',
      encryption: 'Web Crypto API — AES-GCM 256-bit with PBKDF2 key derivation (100,000 iterations)',
      persistence: 'Zero — no database, no logs, no message storage',
      deployment: 'Cloudflare Workers (backend), Vercel (frontend)',
    },
    liveUrl: 'https://doomchat.vercel.app/',
    githubUrl: null,
  },
  {
    slug: 'toolock',
    number: '06',
    title: 'Toolock',
    category: 'All-in-One Tools Platform',
    year: '2026',
    shortDescription:
      'An all-in-one digital tools suite consolidating PDF manipulation, image conversion, developer utilities, and security tools into a single web app. All file processing runs entirely client-side using browser-native APIs and Web Workers without remote server uploads.',
    mainDescription:
      'All-in-one digital tools suite with client-side processing and a premium interactive experience.',
    fullDescription:
      'Toolock is an all-in-one digital productivity platform that consolidates a wide range of utility tools into a single responsive web application. The core principle is client-side processing — files never leave the user\'s browser, and no data is uploaded to any server. Tools span categories including PDF manipulation, image conversion and editing, text utilities, developer tools (JSON formatter, base64 encoder, hash generator), and security utilities. The platform features an animated Three.js/WebGL 3D visual homepage, lazy-loaded tool modules for instant initial load, and an extensible architecture that makes adding new tools straightforward.',
    image: '/images/proj_toolock.png',
    tech: ['Next.js', 'React', 'TypeScript', 'Three.js', 'WebGL', 'Client-Side Processing', 'Browser APIs', 'Lazy Loading', 'GitHub', 'Vercel'],
    mainTech: ['Next.js', 'React', 'TypeScript', 'Three.js'],
    features: [
      'All file processing is entirely client-side — zero server uploads',
      'PDF tools: merge, split, compress, convert, watermark',
      'Image tools: convert formats, resize, compress, crop',
      'Text tools: word count, case converter, markdown preview, diff checker',
      'Developer tools: JSON formatter, base64 encoder/decoder, hash generator',
      'Security tools: password strength checker, UUID generator',
      'Animated Three.js/WebGL 3D homepage visual experience',
      'Lazy-loaded tool modules for fast initial page load',
    ],
    technicalDetails: {
      frontend: 'Next.js 14, React, TypeScript',
      rendering: 'Three.js / WebGL for homepage 3D visual',
      processing: 'Browser-native APIs — File API, Canvas API, Web Workers for heavy processing',
      architecture: 'Lazy-loaded tool modules — each tool only loads when visited',
      privacy: 'Zero server uploads — all processing happens in the browser',
      deployment: 'Vercel with static optimization',
    },
    liveUrl: 'https://toolock.vercel.app/',
    githubUrl: null,
  },
  {
    slug: 'resuvana',
    number: '07',
    title: 'Resuvana',
    category: 'Professional Resume Builder',
    year: '2026',
    shortDescription:
      'A modern resume-building web app designed for students and professionals to craft ATS-conscious resumes without subscription barriers. It offers six professional templates, a real-time live A4 preview with intelligent page breaks, and instant print-ready PDF export.',
    mainDescription:
      'Modern resume builder with professional templates, ATS-friendly formatting, and live A4 preview.',
    fullDescription:
      'Resuvana is a feature-rich resume building web application designed to be accessible to everyone from fresh graduates to experienced professionals. It offers six distinct professional resume templates that users can switch between in real time. The input form covers all standard resume sections: personal information, professional summary, education, skills, projects, internships, experience, certifications, and professional links. A live A4 canvas preview updates as users type, supporting multi-page resumes with intelligent page-break detection. The final resume can be exported as a print-ready PDF. All data is persisted in the browser\'s localStorage so users can return and continue editing without losing progress.',
    image: '/images/proj_resuvana.jpg',
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'HTML/CSS', 'Local Storage', 'Responsive Design', 'PDF Generation', 'Git', 'GitHub', 'Vercel'],
    mainTech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    features: [
      'Six professional resume templates switchable in real time',
      'Live A4 canvas preview that updates as you type',
      'Multi-page resume support with intelligent page-break detection',
      'Sections: personal info, summary, education, skills, projects, experience, certifications',
      'PDF export with print-quality formatting',
      'ATS-conscious template layouts optimized for applicant tracking systems',
      'Data persistence via localStorage — resume survives page refreshes',
      'Fully responsive — usable on tablet and mobile for on-the-go editing',
    ],
    technicalDetails: {
      frontend: 'Next.js, React, TypeScript, Tailwind CSS',
      preview: 'Live A4-canvas preview using CSS print layout + dynamic React rendering',
      persistence: 'Browser localStorage — zero backend required',
      export: 'Client-side PDF generation via browser print API with custom print styles',
      deployment: 'Vercel',
    },
    liveUrl: 'https://resuvana.vercel.app/',
    githubUrl: null,
  },
  {
    slug: 'cookpro',
    number: '08',
    title: 'CookPro',
    category: 'Smart Recipe Discovery',
    year: '2026',
    shortDescription:
      'A full-stack recipe discovery web app that helps users find practical recipes using ingredients they already have on hand. It features a transparent recipe match percentage engine, personal pantry management, a saved cookbook, and automated shopping lists.',
    mainDescription:
      'Smart ingredient-based recipe discovery with match percentages and pantry management.',
    fullDescription:
      'CookPro is a full-stack recipe discovery platform built to solve the daily problem of "what can I cook with what I have?" Users input ingredients they have on hand, and the platform\'s ingredient-matching engine finds relevant recipes from the TheMealDB API and calculates a transparent match percentage for each result. A relevance ranking algorithm prioritizes recipes that meaningfully use the user\'s primary ingredients over those that only partially match. The platform rounds out the meal-planning workflow with a personal pantry (saved ingredient list), a cookbook for saved recipes, and an integrated shopping list for missing ingredients.',
    image: '/images/proj_cookpro.jpg',
    tech: ['React', 'TypeScript', 'Vite', 'Node.js', 'MongoDB Atlas', 'Server-side APIs', 'TheMealDB API', 'Vercel'],
    mainTech: ['React', 'TypeScript', 'Node.js', 'MongoDB Atlas'],
    features: [
      'Ingredient-based recipe search — find recipes from what you already have',
      'Transparent recipe match percentage calculated per result',
      'Relevance ranking that prioritizes meaningful ingredient usage',
      'Personal pantry — save your regular ingredient list',
      'Cookbook — save favourite recipes for later',
      'Shopping list — auto-generate missing ingredients for any recipe',
      'TheMealDB API integration for a large recipe database',
      'Full-stack with Node.js backend for server-side API orchestration',
    ],
    technicalDetails: {
      frontend: 'React 18, TypeScript, Vite',
      backend: 'Node.js — server-side API orchestration and matching algorithm',
      database: 'MongoDB Atlas — user pantries, cookbooks, and shopping lists',
      externalApi: 'TheMealDB API for recipe data',
      algorithm: 'Custom ingredient-matching engine with weighted relevance scoring',
      deployment: 'Vercel (frontend + serverless API routes)',
    },
    liveUrl: 'https://cookpro.vercel.app/',
    githubUrl: null,
  },
];

/**
 * Look up a project by its URL slug.
 * @param {string} slug
 * @returns {Object|undefined}
 */
export function getProjectBySlug(slug) {
  return PROJECTS.find((p) => p.slug === slug);
}

/**
 * Get the next project in the list (wraps around).
 * @param {string} slug
 * @returns {Object}
 */
export function getNextProject(slug) {
  const idx = PROJECTS.findIndex((p) => p.slug === slug);
  return PROJECTS[(idx + 1) % PROJECTS.length];
}
