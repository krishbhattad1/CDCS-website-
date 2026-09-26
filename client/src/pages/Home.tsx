import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  Database,
  Github,
  Layers3,
  Linkedin,
  Mail,
  Menu,
  Network,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import ArchitectureDiagram from "./ArchitectureDiagram";

type Feature = {
  number: string;
  title: string;
  body: string;
  tag: string;
  icon: typeof ShieldCheck;
};

type Metric = {
  stat: string;
  label: string;
  context: string;
  measured?: boolean;
};

const navItems = [
  { label: "Product", href: "#what-is-cdcs" },
  { label: "Features", href: "#features" },
  { label: "Performance", href: "#performance" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Docs", href: "#docs" },
];

const gettingStartedDownload = "/CDCS.zip";
const krishLinkedIn = "https://www.linkedin.com/in/krish-bhattad-2925a5386?utm_source=share_via&utm_content=profile&utm_medium=member_android";
const omishaLinkedIn = "https://www.linkedin.com/in/omisha-iyer-17a78a397?utm_source=share_via&utm_content=profile&utm_medium=member_android";

const features: Feature[] = [
  {
    number: "01",
    title: "Raft Consensus",
    body: "5 active + 2 standby nodes maintain odd quorum. Every write is agreed upon before it's committed -no split-brain, ever.",
    tag: "hashicorp/raft",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Reed-Solomon Erasure Coding",
    body: "Data is split into 4 data + 2 parity shards with checksum verification, surviving node failures without full replication overhead.",
    tag: "4+2 shards",
    icon: Layers3,
  },
  {
    number: "03",
    title: "PebbleDB + 2Q Eviction",
    body: "Disk-backed storage per node with a 2Q eviction policy, migrated from BadgerDB for lower read latency.",
    tag: "PebbleDB",
    icon: Database,
  },
  {
    number: "04",
    title: "gRPC with Leader-Following",
    body: "Clients automatically follow the Raft leader via NOT_LEADER hints, with retry with backoff baked in.",
    tag: "gRPC",
    icon: Network,
  },
  {
    number: "05",
    title: "Singleflight + TTL",
    body: "A custom hybrid cache with sharding, TTL jitter, retry-with-backoff, negative caching, and circuit breaking -collapses duplicate requests into one, preventing cache stampedes under load.",
    tag: "singleflight",
    icon: Zap,
  },
];

const metrics: Metric[] = [
  {
    stat: "5-node",
    label: "Raft Quorum",
    context: "Odd quorum ensures no split-brain, ever.",
  },
  {
    stat: "4+2",
    label: "Erasure Coding",
    context: "Survives up to 2 node failures without data loss.",
  },
  {
    stat: "0",
    label: "Single Points of Failure",
    context: "Automatic leader failover, always available.",
  },
  {
    stat: "2",
    label: "Staleness Policies",
    context: "StrictNoStale or ToleratesStale - tuned per key.",
  },
  {
    stat: "Xms",
    label: "Read Latency (P99)",
    context: "Under [load condition/test setup]",
    measured: true,
  },
  {
    stat: "ops/sec",
    label: "Throughput",
    context: "Sustained under [test setup]",
    measured: true,
  },
  {
    stat: "—",
    label: "Leader Election Time",
    context: "Time to recover from leader failure",
    measured: true,
  },
  {
    stat: "—",
    label: "Cache Hit Ratio",
    context: "Under stampede/singleflight test conditions",
    measured: true,
  },
];

const dashboardImages = [
  {
    src: "/dashboard-1.png",
    alt: "CDCS Cluster Dashboard showing Raft control plane nodes and metrics",
  },
  {
    src: "/dashboard-2.png",
    alt: "CDCS dashboard showing the Live 2Q Cache Inspector and stored files",
  },
  {
    src: "/dashboard-3.png",
    alt: "CDCS dashboard showing physical storage plane status and consensus log ledger",
  },
];

function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={`section-heading section-heading-${align}`}>
      {eyebrow ? (
        <p className="eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </p>
      ) : null}
      <h2>{title}</h2>
      {children ? <p className="section-subtext body-copy">{children}</p> : null}
    </div>
  );
}

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState(0);
  const [dashboardHovered, setDashboardHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setShowBackToTop(window.scrollY > window.innerHeight * 0.7);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealItems.forEach((item) => observer.observe(item));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (dashboardHovered) return;
    const timer = window.setInterval(() => {
      setActiveDashboard((current) => (current + 1) % dashboardImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [dashboardHovered]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="cdcs-site">
      <header className={`site-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="nav-shell">
          <a className="brand" href="#product" aria-label="CDCS home">
            <span className="brand-wordmark">CDCS</span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item.href} className="nav-link" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <a className="button button-primary nav-cta" href={gettingStartedDownload} download="CDCS.zip">
            Get Started <ArrowUpRight size={16} strokeWidth={2.2} />
          </a>

          <button
            className="menu-button"
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className={`mobile-nav ${mobileOpen ? "is-open" : ""}`}>
          {navItems.map((item) => (
            <a
              key={item.href}
              className="nav-link"
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
              <ArrowUpRight size={15} />
            </a>
          ))}
          <a className="button button-primary mobile-cta" href={gettingStartedDownload} download="CDCS.zip" onClick={() => setMobileOpen(false)}>
            Get Started <ArrowUpRight size={16} />
          </a>
        </div>
      </header>

      <main>
        <section className="hero reveal is-visible" id="product">
          <div className="hero-soft-pattern" aria-hidden="true" />
          <div className="hero-content">
            <h1>
              <span>Consistent Distributed</span>
              <span>Cache System</span>
            </h1>
          </div>
        </section>

        <section className="intro-section section-pad reveal" id="what-is-cdcs" data-reveal>
          <div className="container intro-grid">
            <div className="section-heading intro-heading">
              <h2 className="intro-title">
                <span>What is</span>
                <span>CDCS?</span>
              </h2>
            </div>
            <div className="intro-copy">
              <p className="intro-lede body-copy">
                CDCS is a Go based distributed cache that uses Raft consensus for strong consistency and Reed Solomon erasure coding for fault-tolerant storage -no stale reads, no split-brain, no single point of failure.
              </p>
            </div>
          </div>
        </section>

        <section className="features-section section-pad reveal" id="features" data-reveal>
          <div className="container">
            <div className="section-topline">
              <SectionHeading
                title="Key features / design decisions"
              />
            </div>
            <div className="feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article className="feature-card" key={feature.number} tabIndex={0}>
                    <div className="feature-card-top">
                      <Icon className="feature-icon" size={19} strokeWidth={1.8} />
                    </div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <div className="feature-reveal">
                      <p className="feature-body body-copy">{feature.body}</p>
                      <span className="feature-tag">{feature.tag}</span>
                    </div>
                    <ArrowUpRight className="feature-arrow" size={17} />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="architecture-section section-pad reveal" id="architecture" data-reveal>
          <div className="container">
            <div className="section-topline architecture-heading-row">
              <SectionHeading
                title="How It Works"
              >
                Built on proven distributed systems primitives, engineered for correctness.
              </SectionHeading>
            </div>
            <div
              id="architecture-diagram"
              className="architecture-canvas"
              aria-label="Animated CDCS architecture diagram"
            >
              <ArchitectureDiagram />
            </div>
          </div>
        </section>

        <section className="metrics-section section-pad reveal" id="performance" data-reveal>
          <div className="container">
            <div className="section-topline">
              <SectionHeading
                title="Performance & Guarantees"
              >
                Numbers and properties that define how CDCS behaves under load.
              </SectionHeading>
            </div>
            <div className="metrics-grid">
              {metrics.map((metric) => (
                <article className={`metric-card ${metric.measured ? "is-measured" : ""}`} key={metric.label}>
                  <div className="metric-card-top">
                    <span className="metric-stat">{metric.stat}</span>
                    {metric.measured ? <span className="metric-pending">to be measured</span> : <Check size={17} />}
                  </div>
                  <h3>{metric.label}</h3>
                  <p className="metric-context body-copy">{metric.context}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-section section-pad reveal" id="dashboard" data-reveal>
          <div className="container">
            <div className="section-topline">
              <SectionHeading title="Dashboard" />
            </div>
            <div
              className="dashboard-carousel"
              onMouseEnter={() => setDashboardHovered(true)}
              onMouseLeave={() => setDashboardHovered(false)}
              onFocus={() => setDashboardHovered(true)}
              onBlur={() => setDashboardHovered(false)}
            >
              <div className="dashboard-carousel-viewport">
                {dashboardImages.map((image, index) => (
                  <img
                    key={image.src}
                    className={`dashboard-slide-image ${index === activeDashboard ? "is-active" : ""}`}
                    src={image.src}
                    alt={image.alt}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                ))}
                <button
                  className="dashboard-carousel-control dashboard-carousel-prev"
                  type="button"
                  aria-label="Previous dashboard image"
                  onClick={() => setActiveDashboard((current) => (current - 1 + dashboardImages.length) % dashboardImages.length)}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  className="dashboard-carousel-control dashboard-carousel-next"
                  type="button"
                  aria-label="Next dashboard image"
                  onClick={() => setActiveDashboard((current) => (current + 1) % dashboardImages.length)}
                >
                  <ChevronRight size={22} />
                </button>
              </div>
              <div className="dashboard-carousel-footer">
                <span>{String(activeDashboard + 1).padStart(2, "0")} / {String(dashboardImages.length).padStart(2, "0")}</span>
                <div className="dashboard-carousel-dots" aria-label="Choose dashboard image">
                  {dashboardImages.map((image, index) => (
                    <button
                      key={image.src}
                      className={`dashboard-carousel-dot ${index === activeDashboard ? "is-active" : ""}`}
                      type="button"
                      aria-label={`Show dashboard image ${index + 1}`}
                      aria-current={index === activeDashboard ? "true" : undefined}
                      onClick={() => setActiveDashboard(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="docs-section section-pad reveal" id="docs" data-reveal>
          <div className="container docs-container">
            <div className="section-topline">
              <SectionHeading title="Documentation">
                Everything you need to get CDCS running - from quick start to API reference.
              </SectionHeading>
            </div>
            <div className="docs-card">
              <div className="docs-icon"><BookOpen size={22} strokeWidth={1.8} /></div>
              <div className="docs-card-copy">
                <h3>Explore the Docs</h3>
                <p className="docs-preview body-copy">
                  From quick start guides to full API references - architecture deep-dives, configuration options, and everything needed to run CDCS in production.
                </p>
              </div>
              <a className="button button-primary docs-button" href="https://github.com/krishbhattad/CDCS-website-/blob/main/README.md" target="_blank" rel="noreferrer">
                Continue Reading <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer reveal" id="footer" data-reveal>
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand-column">
              <a className="brand footer-brand" href="#product" aria-label="CDCS home">
                <span className="brand-wordmark">CDCS</span>
              </a>
              <p className="footer-tagline body-copy">Consistent Distributed Cache System</p>
              <span className="version-tag">v0.1.0</span>
            </div>
            <div className="footer-links-column">
              <p className="footer-heading">Product</p>
              <div className="footer-link-grid">
                <a href="#what-is-cdcs">Product</a>
                <a href="#features">Features</a>
                <a href="#architecture">Architecture</a>
                <a href="#performance">Performance</a>
                <a href="#dashboard">Dashboard</a>
                <a href="#docs">Docs</a>
                <a href="#footer">GitHub</a>
              </div>
            </div>
            <div className="footer-links-column">
              <p className="footer-heading">Connect</p>
              <div className="footer-link-stack">
                <a href="#footer">Email</a>
                <a href={krishLinkedIn} target="_blank" rel="noreferrer">LinkedIn - Krish Bhattad</a>
                <a href={omishaLinkedIn} target="_blank" rel="noreferrer">LinkedIn - Omisha Iyer</a>
                <a href="#footer">GitHub</a>
              </div>
            </div>
          </div>
          <div className="footer-divider" />
            <div className="footer-bottom">
              <p className="body-copy">© CDCS - 2026. All rights reserved.</p>
            <div className="footer-socials" aria-label="Social links">
              <a href="#footer" aria-label="GitHub"><Github size={17} /></a>
              <a href={krishLinkedIn} target="_blank" rel="noreferrer" aria-label="LinkedIn - Krish Bhattad"><Linkedin size={17} /></a>
              <a href={omishaLinkedIn} target="_blank" rel="noreferrer" aria-label="LinkedIn - Omisha Iyer"><Linkedin size={17} /></a>
              <a href="#footer" aria-label="Email"><Mail size={17} /></a>
            </div>
          </div>
        </div>
      </footer>

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? "is-visible" : ""}`}
        aria-label="Back to top"
        onClick={scrollToTop}
      >
        <ArrowUp size={17} />
      </button>
    </div>
  );
}

export default Home;