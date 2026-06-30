import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Menu, Mail, Instagram, Linkedin, ArrowDown } from "lucide-react";

// ─── Accent ───────────────────────────────────────────────────────────────────
const W = "#FFFFFF"; // pure white accent

// ─── Data ─────────────────────────────────────────────────────────────────────
const mkPh = (n = 8) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Placeholder ${i + 1}`,
    src: "",
  }));

type GalleryItem = {
  id: number;
  name: string;
  src: string;
  path?: string;
};

type ProjectItem = {
  id: string;
  folder: string;
  logo: GalleryItem | null;
  images: GalleryItem[];
  pageCount: number;
  summary: string;
};

const PROJECT_IMAGE_MODULES = import.meta.glob("/projects_data/**/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CATEGORY_IMAGE_MODULES = import.meta.glob("/catogries_images/**/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function getProjectFolder(path: string) {
  const match = path.match(/^\/?projects_data\/([^/]+)/);
  return match?.[1] ?? "unknown-project";
}

function getProjectSortKey(path: string, folder: string) {
  const parts = path.replace(/^\/?projects_data\//, "").split("/");
  const projectFolder = parts[0] ?? "";
  const projectFile = parts.slice(1).join("/");

  if (projectFolder === "DR.Khaled AlYaqout") {
    const customOrder = ["3", "4", "2", "5", "6", "7", "8", "9", "1"];
    const topLevel = parts[1] ?? "";
    const priority = customOrder.indexOf(topLevel);
    return `${priority >= 0 ? String(priority).padStart(2, "0") : "99"}-${projectFile}`;
  }

  return `${folder}-${path}`;
}

function getFileName(path: string) {
  return path.split("/").pop() ?? path;
}

function getCategoryFolder(path: string) {
  const match = path.match(/^\/?catogries_images\/([^/]+)/);
  return match?.[1] ?? "unknown-category";
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function getProjectSummary(folder: string, imageCount: number) {
  if (folder === "DR.Khaled AlYaqout") {
    return "Political campaign identity work built around a strong logo system, campaign rollout graphics, and supporting visuals for print and digital use.";
  }
  if (folder === "Dr.Maher ElChaar") {
    return "Medical branding and promotional design work for Dr. Maher ElChaar, including social media assets, informational layouts, and campaign-style visuals.";
  }
  if (folder === "Qima Travel") {
    return "Travel promotion creatives for Qima Travel, focused on destination advertising, package highlights, and social-ready marketing visuals.";
  }
  if (folder === "SKFH.Hospital") {
    return "Healthcare communication design for SKFH Hospital, covering branded visual materials and awareness-driven promotional pieces.";
  }
  if (folder === "Sinophysio.Academy") {
    return "Educational and promotional design for Sinophysio Academy, with course-style slides and social graphics built for clear communication.";
  }
  if (folder === "The Holly Valley&AlFarouz") {
    return "Hospitality and seasonal campaign visuals for The Holly Valley & AlFarouz, including festive promo artwork and branded announcements.";
  }
  if (folder === "Square") {
    return "Square-format social promotions and campaign graphics built for fast-scrolling advertising and offer-based posts.";
  }
  return `A ${imageCount}-image project folder with branded design work and supporting visuals.`;
}

const PROJECTS: ProjectItem[] = Object.entries(
  Object.entries(PROJECT_IMAGE_MODULES).reduce((acc, [path, src]) => {
    const folder = getProjectFolder(path);
    const item: GalleryItem = {
      id: (acc[folder]?.length ?? 0) + 1,
      name: getFileName(path),
      src,
      path,
    };
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(item);
    return acc;
  }, {} as Record<string, GalleryItem[]>),
)
  .map(([folder, items]) => {
    const sorted = items.sort((a, b) =>
      naturalSort(getProjectSortKey(a.path ?? a.name, folder), getProjectSortKey(b.path ?? b.name, folder)),
    );
    const logoIndex = sorted.findIndex((item) => /logo/i.test(item.name));
    const logo = logoIndex >= 0 ? sorted[logoIndex] : null;
    const images = logoIndex >= 0 ? sorted.filter((_, idx) => idx !== logoIndex) : sorted;
    return {
      id: slugify(folder),
      folder,
      logo,
      images,
      pageCount: Math.max(1, Math.ceil(images.length / 8)),
      summary: getProjectSummary(folder, images.length),
    };
  })
  .sort((a, b) => {
    const order = [
      "Sinophysio.Academy",
      "SKFH.Hospital",
      "Qima Travel",
      "DR.Khaled AlYaqout",
      "Dr.Maher ElChaar",
      "The Holly Valley&AlFarouz",
      "Square",
    ];
    const ai = order.indexOf(a.folder);
    const bi = order.indexOf(b.folder);
    if (ai !== bi) return ai - bi;
    return naturalSort(a.folder, b.folder);
  });

const CATEGORY_TABS = [
  { id: "flags", label: "Flags", folder: "flags" },
  { id: "banners", label: "Banners", folder: "banners" },
  { id: "book-covers", label: "Book Covers", folder: "Book Cover" },
];

const CATEGORIES = CATEGORY_TABS.map((tab) => {
  const items = Object.entries(CATEGORY_IMAGE_MODULES)
    .filter(([path]) => getCategoryFolder(path) === tab.folder || (tab.folder === "Book Cover" && path.includes("/Book Cover/")))
    .map(([path, src], index) => ({
      id: index + 1,
      name: getFileName(path),
      src,
      path,
    }))
    .sort((a, b) => naturalSort(a.path ?? a.name, b.path ?? b.name));

  return {
    ...tab,
    images: items,
    pageCount: Math.max(1, Math.ceil(items.length / 8)),
  };
});

const SKILLS = [
  { abbr: "Ps", name: "Photoshop",   level: 95 },
  { abbr: "Ai", name: "Illustrator", level: 92 },
  { abbr: "Id", name: "InDesign",    level: 88 },
  { abbr: "Fi", name: "Figma",       level: 84 },
  { abbr: "Ca", name: "Canva",       level: 82 },
];

const BADGES = [
  "Branding",
  "Social Media",
  "Marketing Collateral",
  "Digital Ads",
  "Presentations",
  "Infographics",
  "Print Design",
  "Motion Basics",
];

const STATS = [
  { value: 3, suffix: " years", label: "Years Experience" },
  { value: 20, suffix: "+", label: "Projects Delivered" },
  { value: 20, suffix: "+", label: "Brands Served" },
];

const WORKS = PROJECTS.map((project, index) => ({
  idx: String(index + 1).padStart(2, "0"),
  title: project.folder,
  type: `${project.images.length} images`,
  pages: `${project.pageCount} page${project.pageCount === 1 ? "" : "s"}`,
  target: project.id,
}));

const CAPS = [
  { icon: "✦", title: "Social Creatives", desc: "Campaign-ready visuals for social channels that stay on-brand, clear, and visually engaging." },
  { icon: "◈", title: "Marketing Collateral", desc: "Brochures, company profiles, one-pagers, and presentation materials designed to support business growth." },
  { icon: "◉", title: "Brand Systems", desc: "Consistent identity assets, icons, and layout rules that keep every touchpoint aligned." },
  { icon: "⬡", title: "Digital Ads", desc: "Website banners, landing visuals, and promotional graphics built for digital campaigns." },
  { icon: "◆", title: "Event Graphics", desc: "Event, webinar, and exhibition visuals that communicate clearly and stand out quickly." },
  { icon: "◐", title: "Production Ready", desc: "Final artwork, editable source files, and clean exports prepared for multi-channel delivery." },
];

// ─── Global CSS injected once ─────────────────────────────────────────────────
const GLOBAL_CSS = `
  * { cursor: none !important; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: #080808; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }

  @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes scrollLine  { 0%{transform:translateY(-100%);opacity:0} 30%{opacity:1} 70%{opacity:1} 100%{transform:translateY(220%);opacity:0} }
  @keyframes marquee     { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes scanline    { 0%{top:-10%} 100%{top:110%} }
  @keyframes flicker     { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.4} 94%{opacity:1} 97%{opacity:0.7} 98%{opacity:1} }
  @keyframes floatY      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes rotateSlow  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pulse-ring  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
  @keyframes glitch-1 {
    0%,100%{clip-path:inset(0 0 100% 0);transform:translate(0)}
    20%{clip-path:inset(20% 0 60% 0);transform:translate(-3px,1px)}
    40%{clip-path:inset(50% 0 30% 0);transform:translate(3px,-1px)}
    60%{clip-path:inset(70% 0 10% 0);transform:translate(-2px,2px)}
    80%{clip-path:inset(10% 0 80% 0);transform:translate(2px,-2px)}
  }
  @keyframes glitch-2 {
    0%,100%{clip-path:inset(0 0 100% 0);transform:translate(0)}
    20%{clip-path:inset(60% 0 20% 0);transform:translate(3px,-1px)}
    40%{clip-path:inset(10% 0 70% 0);transform:translate(-3px,1px)}
    60%{clip-path:inset(30% 0 50% 0);transform:translate(2px,-2px)}
    80%{clip-path:inset(80% 0 5%  0);transform:translate(-2px,2px)}
  }
  @keyframes revealUp {
    from{clip-path:inset(100% 0 0 0);opacity:0}
    to  {clip-path:inset(0% 0 0 0);opacity:1}
  }
  @keyframes fadeSlideUp {
    from{opacity:0;transform:translateY(30px)}
    to  {opacity:1;transform:translateY(0)}
  }
  .reveal-up { animation: revealUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }
  .fade-slide-up { animation: fadeSlideUp 0.75s cubic-bezier(0.16,1,0.3,1) forwards; }

  @media (pointer: coarse) {
    * { cursor: auto !important; }
  }
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useTypewriter(text: string, speed = 65, delay = 1600) {
  const [out, setOut] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => { setOut(text.slice(0, ++i)); if (i >= text.length) clearInterval(iv); }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return out;
}

function useCounter(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(target);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return val;
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function Cursor() {
  const dot   = useRef<HTMLDivElement>(null);
  const ring  = useRef<HTMLDivElement>(null);
  const pos   = useRef({ x: 0, y: 0 });
  const ring_ = useRef({ x: 0, y: 0 });
  const raf   = useRef<number>(0);

  useEffect(() => {
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const animate = () => {
      if (dot.current) {
        dot.current.style.transform = `translate(${pos.current.x - 4}px,${pos.current.y - 4}px)`;
      }
      if (ring.current) {
        ring_.current.x += (pos.current.x - ring_.current.x) * 0.12;
        ring_.current.y += (pos.current.y - ring_.current.y) * 0.12;
        ring.current.style.transform = `translate(${ring_.current.x - 18}px,${ring_.current.y - 18}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", move);
    raf.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <>
      <div ref={dot}  className="fixed top-0 left-0 z-[999] w-2 h-2 rounded-full pointer-events-none" style={{ background: W, mixBlendMode: "difference" }} />
      <div ref={ring} className="fixed top-0 left-0 z-[998] w-9 h-9 rounded-full pointer-events-none" style={{ border: `1px solid rgba(255,255,255,0.45)`, mixBlendMode: "difference" }} />
    </>
  );
}

// ─── Particle Web ─────────────────────────────────────────────────────────────
function ParticleWeb() {
  const cvs = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = cvs.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let W2 = canvas.width  = window.innerWidth;
    let H2 = canvas.height = window.innerHeight;

    const pts = Array.from({ length: 110 }, () => ({
      x: Math.random() * W2, y: Math.random() * H2,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.5 + 0.12,
    }));

    const MAX_DIST = 140;

    const draw = () => {
      ctx.clearRect(0, 0, W2, H2);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W2; if (p.x > W2) p.x = 0;
        if (p.y < 0) p.y = H2; if (p.y > H2) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(255,255,255,${0.07 * (1 - dist / MAX_DIST)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { W2 = canvas.width = window.innerWidth; H2 = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={cvs} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, current, title, onClose, onPrev, onNext }: {
  images: GalleryItem[]; current: number; title: string;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const active = images[current];

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(16px)" }} onClick={onClose}>
      <div className="relative w-full max-w-5xl mx-6" onClick={e => e.stopPropagation()} style={{ animation: "fadeSlideUp 0.3s ease forwards" }}>
        <div className="w-full flex items-center justify-center p-5 md:p-8" style={{ border: `1px solid rgba(255,255,255,0.25)`, background: "#0a0a0a" }}>
          {active?.src ? (
            <img
              src={active.src}
              alt={active.name}
              className="block w-auto h-auto max-w-full max-h-[78vh] object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border border-white/20 flex items-center justify-center" style={{ animation: "rotateSlow 8s linear infinite" }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>◈</span>
              </div>
              <p className="font-bebas text-2xl tracking-widest text-white">{title} — {String(current + 1).padStart(2, "0")}</p>
              <p className="font-inter text-[11px] tracking-widest text-white/25 uppercase">Preview unavailable</p>
            </div>
          )}
        </div>
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/40 hover:text-white transition-colors"><X size={22} /></button>
        <button onClick={onPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 text-white/40 hover:text-white transition-colors hidden md:block"><ChevronLeft size={30} /></button>
        <button onClick={onNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 text-white/40 hover:text-white transition-colors hidden md:block"><ChevronRight size={30} /></button>
        <div className="flex md:hidden justify-between mt-4">
          <button onClick={onPrev} className="text-white/40 hover:text-white transition-colors"><ChevronLeft size={24} /></button>
          <button onClick={onNext} className="text-white/40 hover:text-white transition-colors"><ChevronRight size={24} /></button>
        </div>
        <p className="text-center mt-4 font-inter text-xs text-white/25 tracking-widest">{current + 1} / {images.length}</p>
      </div>
    </div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function Gallery({ images, title }: { images: GalleryItem[]; title: string }) {
  const [lb, setLb] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const { ref, inView } = useInView(0.05);
  const pageSize = 8;
  const pages = chunkItems(images, pageSize);
  const totalPages = Math.max(1, pages.length);
  const currentItems = pages[page - 1] ?? [];
  const startIndex = (page - 1) * pageSize;

  useEffect(() => {
    setPage(1);
    setLb(null);
  }, [images.length]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="font-inter text-[10px] tracking-widest uppercase text-white/22">
          Page {page} / {totalPages}
        </p>
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-end gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const active = pageNum === page;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setPage(pageNum);
                    setLb(null);
                  }}
                  className="font-inter text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 transition-colors"
                  style={{
                    border: "1px solid",
                    borderColor: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.12)",
                    color: active ? "white" : "rgba(255,255,255,0.35)",
                    background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
        {currentItems.map((img, i) => (
          <button
            key={img.path ?? `${title}-${startIndex + i}`}
            onClick={() => img.src && setLb(startIndex + i)}
            className="group relative overflow-hidden text-left"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0b0b0b",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)",
              transition: `opacity 0.55s ease ${i * 50}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms`,
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.4)"; el.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.background = "#0b0b0b"; }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <div style={{ position: "absolute", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.12)", animation: "scanline 1.2s linear infinite" }} />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 min-h-[180px] md:min-h-[220px]">
              {img.src ? (
                <img
                  src={img.src}
                  alt={img.name}
                  className="block w-full h-auto max-h-[320px] object-contain select-none"
                  draggable={false}
                />
              ) : (
                <div className="text-center">
                  <span className="text-xl transition-colors duration-300 text-white/20 group-hover:text-white/50">◈</span>
                  <span className="block mt-2 font-inter text-[8px] tracking-widest text-white/18 leading-tight uppercase">
                    [INSERT PROJECT IMAGES HERE]
                  </span>
                </div>
              )}
            </div>
            <span className="block px-3 pb-3 font-inter text-[8px] text-white/12">
              {String(startIndex + i + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>
      {lb !== null && (
        <Lightbox images={images} current={lb} title={title}
          onClose={() => setLb(null)}
          onPrev={() => setLb(p => ((p! - 1) + images.length) % images.length)}
          onNext={() => setLb(p => (p! + 1) % images.length)}
        />
      )}
    </>
  );
}

// ─── FadeIn ───────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ label, number }: { label: string; number: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="font-inter text-[10px] tracking-widest text-white/20">{number}</span>
      <div className="w-6 h-px bg-white/40" />
      <span className="font-inter text-[10px] tracking-widest uppercase text-white/35">{label}</span>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const go = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setOpen(false); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{ background: scrolled ? "rgba(8,8,8,0.9)" : "transparent", backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between h-16">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="font-bebas text-2xl tracking-widest text-white" style={{ animation: "flicker 6s ease infinite" }}>
          W<span className="text-white/40">.</span>ALI
        </button>
        <div className="hidden md:flex items-center gap-8">
          {["about","works","projects","categories","contact"].map(id => (
            <button key={id} onClick={() => go(id)} className="font-inter text-[11px] tracking-[0.2em] uppercase text-white/45 hover:text-white transition-colors duration-200 relative group">
              {id}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(v => !v)} className="md:hidden text-white/60 hover:text-white transition-colors">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden px-6 py-6 flex flex-col gap-5" style={{ background: "rgba(8,8,8,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {["about","works","projects","categories","contact"].map(id => (
            <button key={id} onClick={() => go(id)} className="font-inter text-sm tracking-[0.2em] uppercase text-white/45 text-left hover:text-white transition-colors">{id}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
function Marquee() {
  const ITEMS = ["Brand Identity","Motion Graphics","Social Media Design","Print & Large Format","Photography","Visual Storytelling","UI Design","Typography"];
  const line = ITEMS.join("  ·  ") + "  ·  ";
  return (
    <div className="overflow-hidden py-4 border-y" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <div className="flex whitespace-nowrap" style={{ animation: "marquee 22s linear infinite" }}>
        <span className="font-bebas text-3xl tracking-widest text-white/10 pr-8">{line}</span>
        <span className="font-bebas text-3xl tracking-widest text-white/10 pr-8">{line}</span>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const sub = useTypewriter("Graphic Designer | Branding & Digital Marketing", 50, 1400);
  const NAME = "WALID ALI";
  const [in_, setIn] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => { const t = setTimeout(() => setIn(true), 200); return () => clearTimeout(t); }, []);

  // Periodic glitch
  useEffect(() => {
    const fire = () => { setGlitch(true); setTimeout(() => setGlitch(false), 320); };
    const next = () => setTimeout(() => { fire(); next(); }, 3500 + Math.random() * 4000);
    const t = next();
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: "#080808" }}>
      <ParticleWeb />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(8,8,8,0.7) 100%)" }} />

      {/* Horizontal scan line */}
      <div className="absolute left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)", animation: "scanline 5s linear infinite" }} />

      <div className="relative z-10 text-center px-6 select-none">
        {/* Overline */}
        <div className="flex items-center justify-center gap-3 mb-10" style={{ opacity: in_ ? 1 : 0, transform: in_ ? "translateY(0)" : "translateY(-14px)", transition: "all 0.7s ease 100ms" }}>
          <div className="w-8 h-px bg-white/25" />
          <p className="font-inter text-[10px] tracking-[0.5em] uppercase text-white/40">Branding Portfolio</p>
          <div className="w-8 h-px bg-white/25" />
        </div>

        {/* Name with glitch */}
        <div className="relative inline-block">
          <h1 className="font-bebas leading-none tracking-widest flex flex-wrap justify-center"
            style={{ fontSize: "clamp(64px,13vw,176px)", gap: "0.02em", animation: glitch ? "flicker 0.3s ease" : "none" }}>
            {NAME.split("").map((ch, i) => (
              <span key={i} className="inline-block" style={{
                color: "white",
                opacity: in_ ? 1 : 0,
                transform: in_ ? "translateY(0) skewX(0deg)" : "translateY(80px) skewX(-12deg)",
                transition: `opacity 0.7s ease ${240 + i * 72}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${240 + i * 72}ms`,
                minWidth: ch === " " ? "0.3em" : undefined,
              }}>{ch === " " ? " " : ch}</span>
            ))}
          </h1>

          {/* Glitch layers */}
          {glitch && <>
            <h1 className="font-bebas leading-none tracking-widest flex flex-wrap justify-center absolute inset-0 pointer-events-none"
              style={{ fontSize: "clamp(64px,13vw,176px)", gap: "0.02em", color: "rgba(255,255,255,0.8)", animation: "glitch-1 0.3s steps(1) forwards", mixBlendMode: "screen" }}>
              {NAME.split("").map((ch, i) => <span key={i} style={{ minWidth: ch === " " ? "0.3em" : undefined }}>{ch === " " ? " " : ch}</span>)}
            </h1>
            <h1 className="font-bebas leading-none tracking-widest flex flex-wrap justify-center absolute inset-0 pointer-events-none"
              style={{ fontSize: "clamp(64px,13vw,176px)", gap: "0.02em", color: "rgba(180,180,180,0.7)", animation: "glitch-2 0.3s steps(1) forwards", mixBlendMode: "screen" }}>
              {NAME.split("").map((ch, i) => <span key={i} style={{ minWidth: ch === " " ? "0.3em" : undefined }}>{ch === " " ? " " : ch}</span>)}
            </h1>
          </>}
        </div>

        {/* Typewriter */}
        <div className="flex items-center justify-center gap-4 mt-8 h-7">
          <div className="h-px w-12" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.35))" }} />
          <p className="font-inter text-sm md:text-base tracking-[0.3em] uppercase text-white/55">
            {sub}<span style={{ color: "white", animation: "blink 1s step-end infinite" }}>|</span>
          </p>
          <div className="h-px w-12" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.35))" }} />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <p className="font-inter text-[9px] tracking-[0.5em] text-white/20 uppercase">Scroll</p>
        <div className="w-px h-14 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.6))", animation: "scrollLine 1.6s ease-in-out infinite" }} />
        </div>
        <ArrowDown size={12} className="text-white/20" style={{ animation: "floatY 2s ease-in-out infinite" }} />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-20 left-8 hidden lg:block" style={{ opacity: 0.15 }}>
        <div className="w-16 h-16 border-t border-l border-white" />
      </div>
      <div className="absolute bottom-20 right-8 hidden lg:block" style={{ opacity: 0.15 }}>
        <div className="w-16 h-16 border-b border-r border-white" />
      </div>
    </section>
  );
}

// ─── Stats Counter ────────────────────────────────────────────────────────────
function StatItem({ value, suffix, label, active }: { value: number; suffix: string; label: string; active: boolean }) {
  const count = useCounter(value, active);
  return (
    <div className="text-center">
      <p className="font-bebas text-5xl lg:text-6xl text-white">
        {count}{suffix}
      </p>
      <p className="font-inter text-[10px] tracking-widest uppercase text-white/35 mt-1">{label}</p>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function SkillBar({ abbr, level, inView }: { abbr: string; name: string; level: number; inView: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-bebas text-sm w-7 text-right flex-shrink-0 text-white/60">{abbr}</span>
      <div className="flex-1 h-px relative" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="absolute inset-y-0 left-0" style={{ width: inView ? `${level}%` : "0%", height: "1px", background: "linear-gradient(to right, white, rgba(255,255,255,0.2))", transition: "width 1.3s cubic-bezier(0.16,1,0.3,1)" }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ left: inView ? `${level}%` : "0%", background: "white", boxShadow: "0 0 10px white, 0 0 20px rgba(255,255,255,0.4)", transition: "left 1.3s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <span className="font-inter text-[11px] text-white/25 w-7 flex-shrink-0">{level}%</span>
    </div>
  );
}

function AboutSection() {
  const { ref: skRef, inView: skIn } = useInView(0.3);
  const { ref: stRef, inView: stIn } = useInView(0.3);

  return (
    <section id="about" className="pt-32" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <FadeIn><SectionLabel label="About" number="00" /></FadeIn>

        <div className="max-w-3xl mx-auto mt-12">
          <FadeIn delay={180} className="flex flex-col gap-9">
            <div>
              <h2 className="font-bebas text-5xl lg:text-6xl tracking-wide text-white mb-5" style={{ lineHeight: 1.05 }}>
                Branding Designer<br />
                <span className="text-white/40">&amp; Marketing Visuals</span>
              </h2>
              <p className="font-inter text-sm leading-relaxed text-white/50">
                Based in Cairo, I am a graphic designer focused on branding, social media creatives, and marketing support. I create visuals that help companies communicate clearly, stay consistent, and present a polished image across digital and print channels.
              </p>
              <p className="font-inter text-sm leading-relaxed text-white/32 mt-3">
                With strong Adobe Creative Suite skills and experience across multi-format delivery, I adapt campaigns for web, social, presentations, and print while keeping deadlines and brand guidelines in focus.
              </p>
            </div>

            <div ref={skRef} className="flex flex-col gap-4">
              <p className="font-inter text-[10px] tracking-[0.25em] uppercase text-white/25 mb-1">Tools & Production</p>
              {SKILLS.map(s => <SkillBar key={s.abbr} {...s} inView={skIn} />)}
            </div>

            <div className="flex flex-wrap gap-2">
              {BADGES.map(b => (
                <span key={b} className="font-inter text-[10px] tracking-widest uppercase px-3 py-1.5 transition-colors duration-200 hover:text-white hover:border-white/40"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.02)" }}>
                  {b}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Stats bar */}
      <div ref={stRef} className="mt-24 py-14 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/8">
          {STATS.map(s => <StatItem key={s.label} {...s} active={stIn} />)}
        </div>
      </div>

      <Marquee />
    </section>
  );
}

// ─── Works ────────────────────────────────────────────────────────────────────
function WorksSection() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <section id="works" className="py-32 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionLabel label="Selected Works" number="01" />
          <h2 className="font-bebas text-6xl lg:text-8xl tracking-wide text-white mt-2">Index</h2>
        </FadeIn>
        <div className="mt-12">
          {WORKS.map((w, i) => (
            <FadeIn key={w.idx} delay={i * 50}>
              <div
                className="group relative flex items-center gap-5 md:gap-8 py-5 border-b overflow-hidden cursor-pointer"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
                onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
                onClick={() => document.getElementById(w.target)?.scrollIntoView({ behavior: "smooth" })}
              >
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.03), transparent)", opacity: hov === i ? 1 : 0, transition: "opacity 0.2s" }} />

                <span className="font-bebas text-sm text-white/18 group-hover:text-white/45 transition-colors w-6 flex-shrink-0">{w.idx}</span>
                <h3 className="font-bebas text-xl md:text-2xl lg:text-3xl tracking-wide text-white/70 group-hover:text-white transition-colors flex-1 min-w-0 truncate">{w.title}</h3>
                <span className="hidden md:block font-inter text-xs text-white/28 tracking-widest flex-shrink-0">{w.type}</span>
                <span className="font-inter text-xs text-white/18 w-16 text-right flex-shrink-0">{w.pages}</span>
                <span className="font-inter text-xs text-white/0 group-hover:text-white/50 transition-colors duration-200 flex-shrink-0">↗</span>

                {hov === i && (
                  <div className="absolute right-20 md:right-28 top-1/2 -translate-y-1/2 w-28 h-18 pointer-events-none z-10 flex flex-col items-center justify-center gap-1"
                    style={{ width: 112, height: 72, border: "1px solid rgba(255,255,255,0.25)", background: "#080808", animation: "fadeSlideUp 0.2s ease forwards" }}>
                    <span className="text-white/30 text-lg">◈</span>
                    <span className="font-inter text-[8px] text-white/20 tracking-widest">PREVIEW</span>
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Project Section ──────────────────────────────────────────────────────────
function ProjectSection({ p }: { p: (typeof PROJECTS)[0] }) {
  return (
    <section id={p.id} className="py-32" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <FadeIn><SectionLabel label="Project" number="—" /></FadeIn>
        <div className="grid md:grid-cols-3 gap-10 mt-12 mb-16">
          <FadeIn delay={80}>
            <div className="aspect-square flex flex-col items-center justify-center gap-3 p-8 group relative overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.14)", background: "#0a0a0a" }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)" }} />
              {p.logo?.src ? (
                <img
                  src={p.logo.src}
                  alt={p.logo.name}
                  className="block max-w-[80%] max-h-[70%] w-auto h-auto object-contain"
                  draggable={false}
                />
              ) : (
                <div className="text-center">
                  <span className="font-bebas text-5xl text-white/65">{p.folder.slice(0, 2).toUpperCase()}</span>
                  <p className="font-inter text-[9px] tracking-widest text-white/20 uppercase mt-3">Logo missing</p>
                </div>
              )}
              <span className="font-inter text-[11px] tracking-widest text-white/30 text-center">{p.folder}</span>
            </div>
          </FadeIn>
          <FadeIn delay={160} className="md:col-span-2 flex flex-col justify-between gap-8">
            <div>
              <h2 className="font-bebas text-4xl lg:text-5xl tracking-wide text-white mb-4" style={{ lineHeight: 1.05 }}>{p.folder}</h2>
              <p className="font-inter text-sm leading-relaxed text-white/42">{p.summary}</p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              {[{ l: "Images", v: String(p.images.length) }, { l: "Pages", v: String(p.pageCount) }, { l: "Logo", v: p.logo ? "Included" : "Missing" }].map(({ l, v }) => (
                <div key={l}>
                  <p className="font-inter text-[9px] tracking-widest text-white/20 uppercase mb-1">{l}</p>
                  <p className="font-inter text-sm text-white/60">{v}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
        <FadeIn>
          <p className="font-inter text-[10px] tracking-widest text-white/20 uppercase mb-4">Gallery — {p.images.length} images</p>
        </FadeIn>
        <Gallery images={p.images} title={p.folder} />
      </div>
    </section>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesSection() {
  const [active, setActive] = useState(CATEGORIES[0].id);
  const cat = CATEGORIES.find(c => c.id === active)!;
  return (
    <section id="categories" className="py-32 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionLabel label="Categories" number="02" />
          <h2 className="font-bebas text-6xl lg:text-8xl tracking-wide text-white mt-2">Work by Type</h2>
        </FadeIn>
        <div className="flex flex-wrap gap-2 mt-10 mb-10">
          {CATEGORIES.map(c => {
            const on = c.id === active;
            return (
              <button key={c.id} onClick={() => setActive(c.id)}
                className="font-inter text-[11px] tracking-[0.2em] uppercase px-5 py-2.5 transition-all duration-250"
                style={{ border: "1px solid", borderColor: on ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.1)", color: on ? "white" : "rgba(255,255,255,0.35)", background: on ? "rgba(255,255,255,0.06)" : "transparent" }}>
                {c.label}
              </button>
            );
          })}
        </div>
        <div key={active} style={{ animation: "fadeSlideUp 0.4s ease forwards" }}>
          <p className="font-inter text-[10px] tracking-widest text-white/20 uppercase mb-4">
            Gallery - {cat.images.length} images, {cat.pageCount} page{cat.pageCount === 1 ? "" : "s"}
          </p>
          <Gallery images={cat.images} title={cat.label} />
        </div>
      </div>
    </section>
  );
}

// ─── Capabilities ─────────────────────────────────────────────────────────────
function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-32 px-6 lg:px-12" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto">
        <FadeIn>
          <SectionLabel label="Capabilities" number="03" />
          <h2 className="font-bebas text-6xl lg:text-8xl tracking-wide text-white mt-2">What I Do</h2>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {CAPS.map((c, i) => (
            <FadeIn key={c.title} delay={i * 65}>
              <div className="p-8 h-full transition-all duration-300 group relative overflow-hidden cursor-default"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.35)"; el.style.background = "rgba(255,255,255,0.04)"; el.style.transform = "translateY(-6px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.background = "rgba(255,255,255,0.015)"; el.style.transform = "translateY(0)"; }}
              >
                {/* Glare sweep on hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)" }} />
                <span className="text-3xl block mb-5 text-white/50 group-hover:text-white transition-colors duration-300">{c.icon}</span>
                <h3 className="font-bebas text-xl tracking-wide text-white mb-3">{c.title}</h3>
                <p className="font-inter text-xs leading-relaxed text-white/35">{c.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function ContactSection() {
  return (
    <section id="contact" className="py-40 px-6 text-center relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Radial bg glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)" }} />

      <FadeIn><SectionLabel label="Contact" number="04" /></FadeIn>
      <FadeIn delay={100}>
        <h2 className="font-bebas text-6xl md:text-8xl lg:text-9xl tracking-wide text-white mt-4 mb-4" style={{ lineHeight: 1 }}>
          {"Let's Build"}<br /><span className="text-white/30">Your Brand</span>
        </h2>
      </FadeIn>
      <FadeIn delay={200}>
        <p className="font-inter text-sm text-white/35 max-w-sm mx-auto mb-12 leading-relaxed">
          Available for branding, social media, marketing materials, and design support.
        </p>
      </FadeIn>
      <FadeIn delay={300}>
        <div className="mx-auto max-w-md grid gap-3">
          <a
            href="mailto:iamwalidali@gmail.com"
            className="inline-flex items-center justify-between gap-4 font-inter text-sm tracking-[0.16em] uppercase px-5 py-4 transition-colors duration-300"
            style={{ border: "1px solid rgba(255,255,255,0.2)", color: "white", background: "rgba(255,255,255,0.02)" }}
          >
            <span className="flex items-center gap-3">
              <Mail size={14} />
              Email
            </span>
            <span className="tracking-normal normal-case text-white/60">iamwalidali@gmail.com</span>
          </a>
          <a
            href="tel:+201020636171"
            className="inline-flex items-center justify-between gap-4 font-inter text-sm tracking-[0.16em] uppercase px-5 py-4 transition-colors duration-300"
            style={{ border: "1px solid rgba(255,255,255,0.2)", color: "white", background: "rgba(255,255,255,0.02)" }}
          >
            <span>Phone</span>
            <span className="tracking-normal normal-case text-white/60">+201020636171</span>
          </a>
        </div>
      </FadeIn>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="px-6 lg:px-12 py-10" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-bebas text-2xl tracking-widest text-white/45" style={{ animation: "flicker 8s ease infinite 2s" }}>
          WALID<span className="text-white/18">.</span>ALI
        </span>
        <div className="flex items-center gap-5">
          {[<Instagram key="ig" size={15} />, <Linkedin key="li" size={15} />, <Mail key="ml" size={15} />].map((icon, i) => (
            <a key={i} href="#" className="text-white/22 hover:text-white/65 transition-colors">{icon}</a>
          ))}
        </div>
        <p className="font-inter text-[10px] tracking-widest text-white/18">© 2024 Walid Ali. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setShowCursor(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {showCursor && <Cursor />}
      <div className="min-h-screen" style={{ background: "#080808", color: "#f0f0f0" }}>
        <Navbar />
        <HeroSection />
        <AboutSection />
        <WorksSection />
        <section id="projects">
          {PROJECTS.map(p => <ProjectSection key={p.id} p={p} />)}
        </section>
        <CategoriesSection />
        <CapabilitiesSection />
        <ContactSection />
        <Footer />
      </div>
    </>
  );
}
