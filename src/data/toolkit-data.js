/**
 * Authoritative Technical Toolkit Dataset for Portfolio 2.0
 * Based strictly on the original old portfolio Toolkit dataset.
 * 8 Categories, 31 Technologies, exact ring allocations and icons.
 */

export const SQL_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23ff6420' d='M16 2C8.268 2 2 5.582 2 10v12c0 4.418 6.268 8 14 8s14-3.582 14-8V10c0-4.418-6.268-8-14-8zm0 3c6.627 0 12 2.686 12 6s-5.373 6-12 6-12-2.686-12-6 5.373-6 12-6zm-12 8.356C5.98 14.887 10.742 16 16 16s10.02-1.113 12-2.644V16c0 3.314-5.373 6-12 6s-12-2.686-12-6v-2.644zM4 22c1.98 1.531 6.742 2.644 12 2.644s10.02-1.113 12-2.644V22c0 3.314-5.373 6-12 6s-12-2.686-12-6v0z'/%3E%3C/svg%3E";
export const CAPCUT_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23000000'/%3E%3Cpath d='M10 10h5v12h-5zM17 10h5v12h-5z' fill='%23ffffff'/%3E%3C/svg%3E";

export const TOOLKIT_CATEGORIES = [
  "PROGRAMMING",
  "WEB DEVELOPMENT",
  "SYSTEMS & SECURITY",
  "AI & DEVELOPMENT",
  "CLOUD & INFRASTRUCTURE",
  "DATABASES & BACKEND",
  "DEVELOPMENT & VERSION CONTROL",
  "CREATIVE"
];

export const TOOLKIT_TECHNOLOGIES = [
  // PROGRAMMING (5)
  { name: "C", category: "PROGRAMMING", status: "EXPLORING", ring: 0, icon: "/images/icons/c.svg" },
  { name: "Java", category: "PROGRAMMING", status: "EXPLORING", ring: 1, icon: "/images/icons/java.svg" },
  { name: "Python", category: "PROGRAMMING", status: "EXPLORING", ring: 0, icon: "/images/icons/python.svg" },
  { name: "JavaScript", category: "PROGRAMMING", status: "USING", ring: 1, icon: "/images/icons/javascript.svg" },
  { name: "TypeScript", category: "PROGRAMMING", status: "EXPLORING", ring: 2, icon: "/images/icons/typescript.svg" },

  // WEB DEVELOPMENT (5)
  { name: "HTML", category: "WEB DEVELOPMENT", status: "USING", ring: 1, icon: "/images/icons/html.svg" },
  { name: "CSS", category: "WEB DEVELOPMENT", status: "USING", ring: 1, icon: "/images/icons/css.svg" },
  { name: "React", category: "WEB DEVELOPMENT", status: "EXPLORING", ring: 1, icon: "/images/icons/react.svg" },
  { name: "Node.js", category: "WEB DEVELOPMENT", status: "EXPLORING", ring: 1, icon: "/images/icons/nodejs.svg" },
  { name: "Next.js", category: "WEB DEVELOPMENT", status: "EXPLORING", ring: 2, icon: "/images/icons/nextjs.svg" },

  // SYSTEMS & SECURITY (2)
  { name: "Linux", category: "SYSTEMS & SECURITY", status: "USING", ring: 0, icon: "/images/icons/linux.svg" },
  { name: "Kali Linux", category: "SYSTEMS & SECURITY", status: "EXPLORING", ring: 3, icon: "/images/icons/kalilinux.svg" },

  // AI & DEVELOPMENT (4)
  { name: "ChatGPT", category: "AI & DEVELOPMENT", status: "USING", ring: 2, icon: "/images/icons/chatgpt.svg" },
  { name: "Google Gemini", category: "AI & DEVELOPMENT", status: "USING", ring: 2, icon: "/images/icons/gemini.svg" },
  { name: "PyTorch", category: "AI & DEVELOPMENT", status: "EXPLORING", ring: 2, icon: "/images/icons/pytorch.svg" },
  { name: "Visual Studio Code", category: "AI & DEVELOPMENT", status: "USING", ring: 2, icon: "/images/icons/vscode.svg" },

  // CLOUD & INFRASTRUCTURE (5)
  { name: "AWS", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING", ring: 3, icon: "/images/icons/aws.svg" },
  { name: "Google Cloud", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING", ring: 3, icon: "/images/icons/gcp.svg" },
  { name: "Kubernetes", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING", ring: 3, icon: "/images/icons/kubernetes.svg" },
  { name: "Cloudflare", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING", ring: 3, icon: "/images/icons/cloudflare.svg" },
  { name: "Vercel", category: "CLOUD & INFRASTRUCTURE", status: "EXPLORING", ring: 3, icon: "/images/icons/vercel.svg" },

  // DATABASES & BACKEND (6)
  { name: "MySQL", category: "DATABASES & BACKEND", status: "EXPLORING", ring: 1, icon: "/images/icons/mysql.svg" },
  { name: "MongoDB", category: "DATABASES & BACKEND", status: "EXPLORING", ring: 2, icon: "/images/icons/mongodb.svg" },
  { name: "Firebase", category: "DATABASES & BACKEND", status: "EXPLORING", ring: 2, icon: "/images/icons/firebase.svg" },
  { name: "Supabase", category: "DATABASES & BACKEND", status: "EXPLORING", ring: 3, icon: "/images/icons/supabase.svg" },
  { name: "SQLite", category: "DATABASES & BACKEND", status: "EXPLORING", ring: 3, icon: "/images/icons/sqlite.svg" },
  { name: "SQL", category: "DATABASES & BACKEND", status: "USING", ring: 0, icon: SQL_ICON },

  // DEVELOPMENT & VERSION CONTROL (2)
  { name: "Git", category: "DEVELOPMENT & VERSION CONTROL", status: "USING", ring: 1, icon: "/images/icons/git.svg" },
  { name: "GitHub", category: "DEVELOPMENT & VERSION CONTROL", status: "USING", ring: 2, icon: "/images/icons/github.svg" },

  // CREATIVE (2)
  { name: "Canva", category: "CREATIVE", status: "USING", ring: 3, icon: "/images/icons/canva.svg" },
  { name: "CapCut", category: "CREATIVE", status: "USING", ring: 3, icon: CAPCUT_ICON }
];
