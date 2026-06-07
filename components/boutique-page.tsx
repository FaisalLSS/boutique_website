"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  CalendarHeart,
  CheckCircle2,
  Grid2X2,
  Heart,
  Instagram,
  LogIn,
  LogOut,
  Moon,
  Phone,
  Play,
  Search,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  UserPlus,
  UserRound,
  X
} from "lucide-react";
import { collections, driveVideoFolder, instagram, portfolio, products, services, testimonials, videos } from "@/data/content";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

const FashionCanvas = dynamic(() => import("@/components/fashion-canvas"), {
  ssr: false
});

const boutiquePhone = "917839309007";
const boutiquePhoneDisplay = "+91 78393 09007";
const boutiqueName = "Sadaf Boutique";
const boutiqueOwnerName = "Sadaf Khan";
const instagramUrl = "https://www.instagram.com/_sk8241?igsh=MXR2YXV4dnVoczE1NA==";
const ownerEmail =
  process.env.NEXT_PUBLIC_BOUTIQUE_OWNER_EMAIL ?? process.env.NEXT_PUBLIC_VIORA_OWNER_EMAIL ?? "";
const whatsappUrl =
  `https://wa.me/${boutiquePhone}?text=Hello%20${encodeURIComponent(boutiqueName)}%2C%20I%20would%20like%20to%20chat%20with%20support.`;

const emailTemplateFallbacks: Record<string, string[]> = {
  kjh1fb: ["template_qseeshk", "template_gseeshk"],
  template_qseeshk: ["kjh1fb", "template_gseeshk"],
  template_gseeshk: ["template_qseeshk", "kjh1fb"],
  v3edt7j: ["template_t42izq4"],
  template_t42izq4: ["v3edt7j"]
};

type Product = (typeof products)[number];
type CartItem = {
  product: Product;
  size: string;
  quantity: number;
};

type AuthMode = "login" | "signup";

type ToastMessage = {
  id: number;
  title: string;
  message: string;
};

type AuthUser = {
  name: string;
  email: string;
  phone: string;
};

type StoredUser = AuthUser & {
  password: string;
};

type StoredCartItem = {
  productId: string;
  size: string;
  quantity: number;
};

type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  landmark: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}

const deliveryBoyPhone = boutiquePhoneDisplay;
const usersStorageKey = "sadaf-users";
const sessionStorageKey = "sadaf-current-user";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cartStorageKey(email: string) {
  return `sadaf-cart:${normalizeEmail(email)}`;
}

function readStoredUsers() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(usersStorageKey);
    return stored ? (JSON.parse(stored) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
}

function readStoredCart(email: string) {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(cartStorageKey(email));
    const items = stored ? (JSON.parse(stored) as StoredCartItem[]) : [];
    return items.flatMap((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return product ? [{ product, size: item.size, quantity: item.quantity }] : [];
    });
  } catch {
    return [];
  }
}

function saveStoredCart(email: string, items: CartItem[]) {
  const storedItems: StoredCartItem[] = items.map((item) => ({
    productId: item.product.id,
    size: item.size,
    quantity: item.quantity
  }));
  window.localStorage.setItem(cartStorageKey(email), JSON.stringify(storedItems));
}

function getDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatEmailJsError(error = "") {
  const normalizedError = error.toLowerCase();

  if (normalizedError.includes("invalid grant")) {
    return "Email service needs Gmail reconnection. Please contact Sadaf Boutique on WhatsApp or call us.";
  }

  if (normalizedError.includes("template id not found")) {
    return "Email template was not found. Please update the order/contact template ID from the EmailJS dashboard.";
  }

  return error || "Please check service, template, and recipient settings.";
}

async function sendEmailJs(templateId: string | undefined, params: Record<string, string>, serviceOverride?: string) {
  const serviceId = serviceOverride ?? process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const templateIds = templateId ? Array.from(new Set([templateId, ...(emailTemplateFallbacks[templateId] ?? [])])) : [];

  if (!serviceId || !publicKey || templateIds.length === 0) {
    return { ok: false, error: "Missing EmailJS service ID, template ID, or public key." };
  }

  let lastError = "";

  for (const currentTemplateId of templateIds) {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: currentTemplateId,
        user_id: publicKey,
        template_params: params
      })
    });

    if (response.ok) {
      return { ok: true, error: "" };
    }

    lastError = await response.text();
    if (!lastError.toLowerCase().includes("template id not found")) {
      return { ok: false, error: lastError };
    }
  }

  return { ok: false, error: lastError };
}

function Header({
  cartCount,
  currentUser,
  onCartOpen,
  onAuthOpen,
  onLogout
}: {
  cartCount: number;
  currentUser: AuthUser | null;
  onCartOpen: () => void;
  onAuthOpen: (mode: AuthMode) => void;
  onLogout: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const links = ["Shop", "Portfolio", "Services", "Contact"];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink/45 text-ivory backdrop-blur-xl dark:bg-ink/70">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#home" className="font-display text-2xl font-semibold tracking-wide">
          Sadaf
        </a>
        <div className="hidden items-center gap-7 text-sm uppercase tracking-[0.18em] text-ivory/78 md:flex">
          {links.map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`} className="transition hover:text-champagne">
              {link}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              className="hidden h-10 items-center gap-2 rounded-full border border-white/20 px-3 text-sm font-semibold text-ivory transition hover:border-champagne hover:text-champagne sm:inline-flex"
            >
              <UserRound size={17} />
              {currentUser.name.split(" ")[0] || "Account"}
              <LogOut size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAuthOpen("login")}
              aria-label="Login or sign up"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-ivory transition hover:border-champagne hover:text-champagne sm:w-auto sm:px-3"
            >
              <span className="hidden items-center gap-2 text-sm font-semibold sm:inline-flex">
                <LogIn size={17} />
                Login
              </span>
              <LogIn className="sm:hidden" size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onCartOpen}
            aria-label="Open cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/20 text-ivory transition hover:border-champagne hover:text-champagne"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-champagne px-1 text-[11px] font-bold text-ink">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark and light mode"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-ivory transition hover:border-champagne hover:text-champagne"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a
            href={whatsappUrl}
            className="hidden items-center gap-2 rounded-full bg-champagne px-4 py-2 text-sm font-semibold text-ink shadow-glow transition hover:scale-105 sm:inline-flex"
          >
            <CalendarHeart size={17} />
            Book Visit
          </a>
        </div>
      </nav>
    </header>
  );
}

function AuthModal({
  mode,
  onModeChange,
  onClose,
  onSuccess
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}) {
  const [status, setStatus] = useState("");
  const isSignup = mode === "signup";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    const users = readStoredUsers();
    const existingUser = users.find((user) => normalizeEmail(user.email) === email);

    if (isSignup) {
      const name = String(form.get("name") ?? "").trim();
      const phone = String(form.get("phone") ?? "").trim();

      if (existingUser) {
        setStatus("Account already exists. Please login with this email.");
        return;
      }

      if (password.length < 6) {
        setStatus("Password must be at least 6 characters.");
        return;
      }

      const newUser = { name, email, phone, password };
      saveStoredUsers([...users, newUser]);
      window.localStorage.setItem(sessionStorageKey, email);
      onSuccess({ name, email, phone });
      return;
    }

    if (!existingUser || existingUser.password !== password) {
      setStatus("Invalid email or password.");
      return;
    }

    window.localStorage.setItem(sessionStorageKey, existingUser.email);
    onSuccess({ name: existingUser.name, email: existingUser.email, phone: existingUser.phone });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] grid place-items-center bg-ink/78 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close account form" onClick={onClose} />
      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 26, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="relative w-full max-w-md rounded-lg bg-ivory p-6 text-ink shadow-luxury dark:bg-[#20191b] dark:text-ivory sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account form"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-ink/10 dark:border-ivory/10"
        >
          <X size={18} />
        </button>
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-rosewood dark:text-champagne">Account</p>
          <h2 className="font-display text-4xl font-semibold">{isSignup ? "Create account" : "Login"}</h2>
        </div>

        {isSignup && (
          <>
            <label className="mb-4 block text-sm font-semibold">
              Full Name
              <input name="name" required className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink" />
            </label>
            <label className="mb-4 block text-sm font-semibold">
              Phone Number
              <input name="phone" required className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink" />
            </label>
          </>
        )}

        <label className="mb-4 block text-sm font-semibold">
          Email ID
          <input name="email" type="email" required className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink" />
        </label>
        <label className="mb-5 block text-sm font-semibold">
          Password
          <input name="password" type="password" required className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink" />
        </label>

        {status && <p className="mb-4 text-sm text-rosewood dark:text-champagne">{status}</p>}

        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-6 py-4 font-semibold text-ivory">
          {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
          {isSignup ? "Sign Up" : "Login"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus("");
            onModeChange(isSignup ? "login" : "signup");
          }}
          className="mt-4 w-full rounded-full border border-ink/15 px-6 py-3 font-semibold dark:border-ivory/15"
        >
          {isSignup ? "Already have an account? Login" : "New customer? Sign up"}
        </button>
      </motion.form>
    </motion.div>
  );
}

function ToastPopup({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <motion.div
      className="fixed right-4 top-24 z-[80] w-[calc(100%-2rem)] max-w-sm rounded-lg border border-ink/10 bg-ivory p-4 text-ink shadow-luxury dark:border-ivory/10 dark:bg-[#20191b] dark:text-ivory sm:right-6"
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rosewood text-ivory">
          <CheckCircle2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm leading-5 text-ink/65 dark:text-ivory/65">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close message"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/10 dark:border-ivory/10"
        >
          <X size={15} />
        </button>
      </div>
    </motion.div>
  );
}

function Hero() {
  const title = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.45], [0, 150]);

  useEffect(() => {
    if (!title.current) return;
    gsap.fromTo(
      title.current.children,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 1.1, ease: "power3.out" }
    );
  }, []);

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-ink text-ivory">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-45"
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-poster.svg"
      >
        <source src="/videos/hero-boutique.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,19,19,.92),rgba(23,19,19,.56),rgba(23,19,19,.28))]" />
      <div className="absolute inset-0 bg-silk-radial opacity-80" />
      <FashionCanvas />

      <motion.div
        style={{ y }}
        className="relative z-20 mx-auto flex min-h-screen max-w-7xl items-center px-4 pb-16 pt-28 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-5 inline-flex items-center gap-2 border-b border-champagne/60 pb-2 text-xs font-semibold uppercase tracking-[0.34em] text-champagne"
          >
            <Sparkles size={15} />
            Designer ethnic couture for women
          </motion.p>
          <h1 ref={title} className="font-display text-6xl font-semibold leading-[0.9] sm:text-7xl lg:text-8xl">
            <span className="block">Sadaf</span>
            <span className="gold-text block">Boutique</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ivory/78 sm:text-xl">
            Bridal grandeur, refined ethnic wear, party silhouettes, sarees, kurtis, gowns, and bespoke stitching
            shaped with couture-level attention.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#shop"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-champagne px-7 py-4 font-semibold text-ink shadow-glow transition hover:scale-[1.03]"
            >
              Shop New Arrivals
              <ArrowRight className="transition group-hover:translate-x-1" size={19} />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-ivory/30 px-7 py-4 font-semibold text-ivory transition hover:border-champagne hover:text-champagne"
            >
              Book Consultation
            </a>
          </div>
        </div>
      </motion.div>
      <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center text-xs uppercase tracking-[0.35em] text-ivory/60">
        Scroll
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="mx-auto mb-12 max-w-3xl text-center"
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-rosewood dark:text-champagne">{eyebrow}</p>
      <h2 className="font-display text-4xl font-semibold text-ink dark:text-ivory sm:text-6xl">{title}</h2>
      <p className="mt-5 text-base leading-7 text-ink/68 dark:text-ivory/68 sm:text-lg">{copy}</p>
    </motion.div>
  );
}

function Collections() {
  const categories = useMemo(() => ["All", ...collections.map((item) => item.category)], []);
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? collections : collections.filter((item) => item.category === active);

  return (
    <section id="collections" className="bg-ivory px-4 py-24 dark:bg-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="The atelier edit"
          title="Collections That Feel Made For Your Moment"
          copy="Curated fashion chapters with polished silhouettes, premium fabrics, and occasion-led styling."
        />
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                active === category
                  ? "border-rosewood bg-rosewood text-ivory dark:border-champagne dark:bg-champagne dark:text-ink"
                  : "border-ink/10 text-ink/70 hover:border-rosewood dark:border-ivory/15 dark:text-ivory/70"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.article
                layout
                key={item.title}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                whileHover={{ y: -8 }}
                className="group overflow-hidden rounded-lg bg-white shadow-luxury dark:bg-white/8"
              >
                <div className="relative h-80 overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                  <p className="absolute left-5 top-5 rounded-full bg-ivory/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-ink">
                    {item.category}
                  </p>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-3xl font-semibold text-ink dark:text-ivory">{item.title}</h3>
                  <p className="mt-3 leading-7 text-ink/65 dark:text-ivory/65">{item.copy}</p>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function ProductShop({
  onAddToCart
}: {
  onAddToCart: (product: Product, size: string) => void;
}) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((item) => item.category)))], []);
  const [active, setActive] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const visible = products.filter((product) => {
      const matchesCategory = active === "All" || product.category === active;
      const matchesQuery = product.title.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });

    return [...visible].sort((a, b) => {
      if (sort === "Price Low") return a.price - b.price;
      if (sort === "Price High") return b.price - a.price;
      return 0;
    });
  }, [active, query, sort]);

  function toggleLike(id: string) {
    setLiked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section id="shop" className="bg-white px-4 py-24 dark:bg-[#151111] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mb-16 overflow-hidden rounded-lg bg-ink p-5 text-ivory shadow-luxury sm:p-8 lg:p-10"
        >
          <div className="absolute inset-0 bg-silk-radial opacity-70" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-champagne/30" />
          <div className="absolute -bottom-28 left-1/3 h-80 w-80 rounded-full border border-rosewood/35" />
          <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.34em] text-champagne">3D Boutique Shop</p>
              <h2 className="font-display text-5xl font-semibold leading-tight sm:text-6xl">
                Shop Looks With Gallery, Size, Likes And COD
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-ivory/72">
                Tap any suit, kurti, frock, saree, or bridal design to open an interactive gallery with multiple views and a real order flow.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {products.slice(0, 3).map((product, index) => (
                <motion.button
                  key={product.id}
                  type="button"
                  onClick={() => setSelected(product)}
                  whileHover={{ rotateY: 8, rotateX: -4, y: -10 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="group relative h-80 overflow-hidden rounded-lg bg-ivory shadow-glow [transform-style:preserve-3d]"
                  style={{ transform: `translateY(${index % 2 === 0 ? "0" : "24px"})` }}
                >
                  <Image src={product.images[0]} alt={product.title} fill className="object-cover transition duration-700 group-hover:scale-110" />
                  <span className="absolute bottom-4 left-4 right-4 rounded-md bg-ink/72 px-3 py-2 text-left text-sm font-semibold text-ivory backdrop-blur">
                    {product.title}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <SectionIntro
          eyebrow="Shop Sadaf"
          title="Designer Suits, Frocks, Kurtis And Sarees"
          copy="Open any design to view 3-4 photos, select size, like favourites, and add to a cash-on-delivery cart."
        />

        <div className="mb-6 grid gap-3 border-y border-ink/10 py-4 dark:border-ivory/10 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/45 dark:text-ivory/45" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search kurtis, sarees, bridal..."
              className="h-12 w-full rounded-md border border-ink/10 bg-ivory pl-11 pr-4 outline-none transition focus:border-rosewood dark:border-ivory/10 dark:bg-ink dark:text-ivory"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                className={`h-12 shrink-0 rounded-md border px-4 text-sm font-semibold transition ${
                  active === category
                    ? "border-ink bg-ink text-ivory dark:border-champagne dark:bg-champagne dark:text-ink"
                    : "border-ink/10 text-ink/70 dark:border-ivory/10 dark:text-ivory/70"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="flex h-12 items-center gap-2 rounded-md border border-ink/10 bg-ivory px-4 text-sm dark:border-ivory/10 dark:bg-ink">
            <SlidersHorizontal size={17} />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent outline-none">
              <option>Featured</option>
              <option>Price Low</option>
              <option>Price High</option>
            </select>
          </label>
        </div>

        <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-ink/50 dark:text-ivory/50">
          <span className="inline-flex items-center gap-2">
            <Grid2X2 size={15} />
            {filtered.length} Products
          </span>
          <span>COD Available</span>
        </div>

        <motion.div layout className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <motion.article layout key={product.id} className="group">
              <button
                type="button"
                onClick={() => setSelected(product)}
                className="relative block h-[440px] w-full overflow-hidden rounded-lg bg-silk text-left shadow-sm dark:bg-white/8"
              >
                <Image src={product.images[0]} alt={product.title} fill className="object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute left-3 top-3 bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                  {product.badge}
                </span>
              </button>
              <div className="mt-4 flex items-start justify-between gap-3">
                <button type="button" onClick={() => setSelected(product)} className="text-left">
                  <h3 className="line-clamp-2 text-base font-medium text-ink dark:text-ivory">{product.title}</h3>
                  <p className="mt-2">
                    <span className="font-semibold text-red-600">{formatPrice(product.price)}</span>
                    <span className="ml-2 text-sm text-ink/45 line-through dark:text-ivory/45">{formatPrice(product.mrp)}</span>
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => toggleLike(product.id)}
                  aria-label="Like product"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-rosewood transition hover:scale-105 dark:border-ivory/10 dark:bg-ink"
                >
                  <Heart size={18} fill={liked.includes(product.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && (
          <ProductDetail
            product={selected}
            liked={liked.includes(selected.id)}
            onToggleLike={() => toggleLike(selected.id)}
            onClose={() => setSelected(null)}
            onAddToCart={onAddToCart}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function ProductDetail({
  product,
  liked,
  onToggleLike,
  onClose,
  onAddToCart
}: {
  product: Product;
  liked: boolean;
  onToggleLike: () => void;
  onClose: () => void;
  onAddToCart: (product: Product, size: string) => void;
}) {
  const [image, setImage] = useState(product.images[0]);
  const [size, setSize] = useState(product.sizes[0]);

  useEffect(() => {
    setImage(product.images[0]);
    setSize(product.sizes[0]);
  }, [product]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/86 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close product"
        className="fixed right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-ivory text-ink"
      >
        <X size={20} />
      </button>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        className="mx-auto mt-16 grid max-w-7xl gap-8 rounded-lg bg-ivory p-4 text-ink shadow-luxury dark:bg-[#20191b] dark:text-ivory md:p-8 lg:grid-cols-[0.95fr_0.75fr]"
      >
        <div className="grid gap-4 sm:grid-cols-[76px_1fr]">
          <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
            {product.images.map((thumb) => (
              <button
                key={thumb}
                type="button"
                onClick={() => setImage(thumb)}
                className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-md border ${
                  image === thumb ? "border-ink dark:border-champagne" : "border-ink/10 dark:border-ivory/10"
                }`}
              >
                <Image src={thumb} alt={`${product.title} view`} fill className="object-cover" />
              </button>
            ))}
          </div>
          <motion.div layoutId={product.id} className="relative order-1 min-h-[520px] overflow-hidden rounded-lg bg-silk sm:order-2">
            <Image src={image} alt={product.title} fill className="object-cover" priority />
          </motion.div>
        </div>
        <div className="py-2 lg:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-rosewood dark:text-champagne">{boutiqueName}</p>
          <h3 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">{product.title}</h3>
          <p className="mt-4 text-lg">
            <span className="text-2xl font-semibold text-red-600">{formatPrice(product.price)}</span>
            <span className="ml-3 text-ink/45 line-through dark:text-ivory/45">{formatPrice(product.mrp)}</span>
          </p>
          <p className="mt-2 text-sm text-ink/55 dark:text-ivory/55">Inclusive of all taxes. Cash on delivery available.</p>
          <p className="mt-6 leading-7 text-ink/68 dark:text-ivory/68">{product.copy}</p>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSize(item)}
                  className={`min-h-11 min-w-20 rounded-md border px-4 text-sm font-medium transition ${
                    size === item
                      ? "border-ink bg-ink text-ivory dark:border-champagne dark:bg-champagne dark:text-ink"
                      : "border-ink/15 text-ink/70 dark:border-ivory/15 dark:text-ivory/70"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">Color: {product.color}</p>
            <span className="block h-9 w-9 rounded-sm border-2 border-white bg-rosewood shadow ring-1 ring-ink/20" />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={() => onAddToCart(product, size)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rosewood px-6 py-4 font-semibold text-ivory transition hover:scale-[1.02]"
            >
              <ShoppingBag size={19} />
              Add To Cart
            </button>
            <button
              type="button"
              onClick={onToggleLike}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-4 font-semibold dark:border-ivory/15"
            >
              <Heart size={19} fill={liked ? "currentColor" : "none"} />
              Like
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CartDrawer({
  items,
  open,
  currentUser,
  onClose,
  onRemove,
  onQuantity,
  onOrderComplete
}: {
  items: CartItem[];
  open: boolean;
  currentUser: AuthUser | null;
  onClose: () => void;
  onRemove: (id: string, size: string) => void;
  onQuantity: (id: string, size: string, quantity: number) => void;
  onOrderComplete: () => void;
}) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrderConfirmed, setShowOrderConfirmed] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  function confirmOrder(message: string) {
    setEmailStatus(message);
    setShowCheckout(false);
    setShowOrderConfirmed(true);
    onOrderComplete();
  }

  function closeCart() {
    setShowOrderConfirmed(false);
    onClose();
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details: CheckoutDetails = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
      landmark: String(form.get("landmark") ?? "")
    };
    const deliveryDate = getDeliveryDate();
    const orderLines = items
      .map((item) => `${item.product.title} | Size: ${item.size} | Qty: ${item.quantity} | ${formatPrice(item.product.price * item.quantity)}`)
      .join("\n");
    setEmailStatus("Sending confirmation emails...");
    try {
      const orderId = `SADAF-${Date.now().toString().slice(-6)}`;
      const baseParams = {
        order_id: orderId,
        boutique_name: boutiqueName,
        owner_name: boutiqueOwnerName,
        customer_name: details.name,
        customer_email: details.email,
        customer_err: `, ${details.email}`,
        customer_phone: details.phone,
        customer_address: details.address,
        customer_landmark: details.landmark,
        order_items: orderLines,
        orders: orderLines,
        units: String(items.reduce((sum, item) => sum + item.quantity, 0)),
        order_total: formatPrice(total),
        delivery_date: deliveryDate,
        delivery_boy_phone: deliveryBoyPhone,
        owner_email: ownerEmail,
        from_name: details.name,
        to_name: details.name,
        your_email: details.email,
        message: orderLines
      };

      const customerSent = await sendEmailJs(
        process.env.NEXT_PUBLIC_EMAILJS_ORDER_TEMPLATE_ID,
        {
          ...baseParams,
          to_email: details.email,
          receiver_email: details.email,
          email: details.email,
          reply_to: ownerEmail
        },
        process.env.NEXT_PUBLIC_EMAILJS_ORDER_SERVICE_ID
      );
      const ownerSent = await sendEmailJs(
        process.env.NEXT_PUBLIC_EMAILJS_ORDER_TEMPLATE_ID,
        {
          ...baseParams,
          customer_err: "",
          to_name: boutiqueOwnerName,
          to_email: ownerEmail,
          receiver_email: ownerEmail,
          email: ownerEmail,
          reply_to: details.email
        },
        process.env.NEXT_PUBLIC_EMAILJS_ORDER_SERVICE_ID
      );
      if (customerSent.ok && ownerSent.ok) {
        confirmOrder("Order confirmed. Emails were sent to customer and Sadaf Boutique.");
      } else if (ownerSent.ok) {
        confirmOrder(`Order confirmed. Email was sent to Sadaf Boutique, but the customer email failed: ${formatEmailJsError(customerSent.error)}`);
      } else if (customerSent.ok) {
        confirmOrder(`Order confirmed. Customer email was sent, but Sadaf Boutique email failed: ${formatEmailJsError(ownerSent.error)}`);
      } else {
        setEmailStatus(`EmailJS error: ${formatEmailJsError(customerSent.error || ownerSent.error)}`);
      }
    } catch (error) {
      setEmailStatus(`Email could not be sent right now. ${error instanceof Error ? error.message : "Please try again."}`);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-ink/65 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close cart overlay" onClick={closeCart} />
          <AnimatePresence>
            {showOrderConfirmed && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-confirmed-title"
                className="absolute inset-0 z-20 grid place-items-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ y: 24, scale: 0.96 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 18, scale: 0.98 }}
                  transition={{ type: "spring", damping: 22, stiffness: 260 }}
                  className="w-full max-w-sm rounded-lg bg-ivory p-6 text-center text-ink shadow-luxury dark:bg-[#20191b] dark:text-ivory"
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rosewood text-ivory">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 id="order-confirmed-title" className="mt-4 font-display text-3xl font-semibold">
                    Your order is confirmed
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-ink/65 dark:text-ivory/65">
                    Confirmation email has been sent. Sadaf Boutique will contact you soon for delivery.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowOrderConfirmed(false)}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-rosewood px-6 py-3 font-semibold text-ivory"
                  >
                    Done
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory text-ink shadow-luxury dark:bg-[#20191b] dark:text-ivory"
          >
            <div className="flex items-center justify-between border-b border-ink/10 p-5 dark:border-ivory/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-rosewood dark:text-champagne">Your cart</p>
                <h3 className="font-display text-3xl font-semibold">Cash On Delivery</h3>
              </div>
              <button type="button" onClick={closeCart} className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 dark:border-ivory/10">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center text-ink/55 dark:text-ivory/55">
                  <p>Your cart is empty. Add a boutique piece to start a COD order.</p>
                </div>
              ) : showCheckout ? (
                <form onSubmit={checkout} className="space-y-4">
                  <p className="rounded-lg bg-champagne/20 p-4 text-sm leading-6 text-ink/70 dark:text-ivory/70">
                    Confirm your details for Cash on Delivery. Expected delivery: {getDeliveryDate()}. Delivery contact:
                    {" "}{deliveryBoyPhone}.
                  </p>
                  <label className="block text-sm font-semibold">
                    Full Name
                    <input
                      name="name"
                      required
                      defaultValue={currentUser?.name ?? ""}
                      className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Email ID
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={currentUser?.email ?? ""}
                      className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Phone Number
                    <input
                      name="phone"
                      required
                      defaultValue={currentUser?.phone ?? ""}
                      className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Full Address
                    <textarea name="address" required rows={4} className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink" />
                  </label>
                  <label className="block text-sm font-semibold">
                    Landmark
                    <input name="landmark" className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood dark:bg-ink" />
                  </label>
                  {emailStatus && <p className="text-sm text-rosewood dark:text-champagne">{emailStatus}</p>}
                  <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-6 py-4 font-semibold text-ivory">
                    <CheckCircle2 size={19} />
                    Confirm COD Order
                  </button>
                  <button type="button" onClick={() => setShowCheckout(false)} className="w-full rounded-full border border-ink/15 px-6 py-3 font-semibold dark:border-ivory/15">
                    Back To Cart
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <article key={`${item.product.id}-${item.size}`} className="grid grid-cols-[84px_1fr] gap-4 rounded-lg border border-ink/10 p-3 dark:border-ivory/10">
                      <div className="relative h-28 overflow-hidden rounded-md bg-silk">
                        <Image src={item.product.images[0]} alt={item.product.title} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="line-clamp-2 font-medium">{item.product.title}</h4>
                        <p className="mt-1 text-sm text-ink/55 dark:text-ivory/55">Size: {item.size}</p>
                        <p className="mt-2 font-semibold text-red-600">{formatPrice(item.product.price)}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-ink/10 dark:border-ivory/10">
                            <button
                              type="button"
                              onClick={() => onQuantity(item.product.id, item.size, Math.max(1, item.quantity - 1))}
                              className="h-9 w-9"
                            >
                              -
                            </button>
                            <span className="grid h-9 w-9 place-items-center text-sm">{item.quantity}</span>
                            <button type="button" onClick={() => onQuantity(item.product.id, item.size, item.quantity + 1)} className="h-9 w-9">
                              +
                            </button>
                          </div>
                          <button type="button" onClick={() => onRemove(item.product.id, item.size)} className="text-rosewood dark:text-champagne">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-ink/10 p-5 dark:border-ivory/10">
              <div className="mb-4 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setShowCheckout(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-6 py-4 font-semibold text-ivory disabled:cursor-not-allowed disabled:opacity-45"
              >
                <CheckCircle2 size={19} />
                Buy With Cash On Delivery
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VideoShowcase() {
  const [active, setActive] = useState<(typeof videos)[number] | null>(null);

  return (
    <section className="bg-silk px-4 py-24 dark:bg-[#20191b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Motion gallery"
          title="Google Drive Reels And Boutique Videos"
          copy="Your public Drive folder is embedded below. Add reels, customer videos, bridal showcase videos, or fashion walk clips there and visitors can open them from the gallery."
        />
        <div className="mb-10 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-luxury dark:border-ivory/10 dark:bg-ink">
          <div className="flex flex-col gap-3 border-b border-ink/10 p-5 dark:border-ivory/10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-3xl font-semibold text-ink dark:text-ivory">{driveVideoFolder.title}</h3>
              <p className="mt-1 text-sm text-ink/55 dark:text-ivory/55">
                Upload videos in this Google Drive folder. For card-style previews, add individual file preview links in data/content.ts.
              </p>
            </div>
            <a
              href={driveVideoFolder.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-champagne px-5 py-3 text-sm font-semibold text-ink"
            >
              Open Drive Folder
              <ArrowRight size={17} />
            </a>
          </div>
          <iframe title="Sadaf Boutique Google Drive videos" src={driveVideoFolder.embedUrl} className="h-[460px] w-full border-0 bg-white" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {videos.map((video, index) => (
            <motion.button
              key={video.title}
              type="button"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              onClick={() => setActive(video)}
              className="group relative h-96 overflow-hidden rounded-lg text-left shadow-luxury"
            >
              <Image src={video.poster} alt={video.title} fill className="object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-champagne px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-ink">
                {video.type}
              </span>
              <span className="absolute bottom-5 left-5 right-5 flex items-center justify-between font-display text-3xl font-semibold text-ivory">
                {video.title}
                <span className="grid h-12 w-12 place-items-center rounded-full bg-ivory text-ink transition group-hover:scale-110">
                  <Play fill="currentColor" size={18} />
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/88 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Close video preview"
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-ivory text-ink"
            >
              <X size={20} />
            </button>
            <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-ink shadow-luxury">
              <video controls autoPlay playsInline poster={active.poster} className="aspect-video w-full object-cover">
                <source src={active.src} type="video/mp4" />
              </video>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Portfolio() {
  return (
    <section id="portfolio" className="bg-ivory px-4 py-24 dark:bg-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Portfolio"
          title="Craft, Fit, And Celebration"
          copy="A masonry gallery for bridal photoshoots, customer moments, before and after stitching, and Instagram-style stories."
        />
        <div className="masonry">
          {portfolio.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className={`masonry-item group relative ${item.span} overflow-hidden rounded-lg shadow-luxury`}
            >
              <Image src={item.image} alt={item.title} fill className="object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent opacity-80" />
              <h3 className="absolute bottom-5 left-5 right-5 font-display text-3xl font-semibold text-ivory">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="bg-plum px-4 py-24 text-ivory sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative min-h-[520px] overflow-hidden rounded-lg shadow-luxury"
        >
          <Image src="/images/about-atelier.svg" alt="Sadaf Boutique atelier" fill className="object-cover" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-champagne">Our story</p>
          <h2 className="font-display text-5xl font-semibold sm:text-6xl">An Atelier Built Around The Woman Wearing It</h2>
          <div className="mt-7 space-y-5 text-lg leading-8 text-ivory/75">
            <p>
              Sadaf Boutique brings together custom tailoring expertise, premium fabric selection, and designer
              craftsmanship for women who want clothing that feels personal and occasion-worthy.
            </p>
            <p>
              Every piece begins with listening: the celebration, the body, the fabric, the finishing, and the feeling
              the client wants to carry into the room.
            </p>
            <p>
              From bridal heirlooms to everyday refined kurtis, our process blends measurements, fittings, hand detail,
              and styling guidance into a calm, high-touch boutique experience.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ServicesTestimonials() {
  return (
    <section id="services" className="bg-silk px-4 py-24 dark:bg-[#20191b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Services"
          title="Boutique Care From Sketch To Final Fit"
          copy="Every service is designed to make luxury fashion feel easy, precise, and deeply personal."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-ink/10 bg-ivory p-6 shadow-sm dark:border-ivory/10 dark:bg-ink"
              >
                <Icon className="mb-5 text-rosewood dark:text-champagne" size={30} />
                <h3 className="font-display text-3xl font-semibold text-ink dark:text-ivory">{service.title}</h3>
                <p className="mt-3 leading-7 text-ink/65 dark:text-ivory/65">{service.copy}</p>
              </motion.article>
            );
          })}
        </div>
        <div className="mt-20 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <motion.article
              key={item.name}
              whileHover={{ y: -6 }}
              className="rounded-lg bg-ink p-7 text-ivory shadow-luxury dark:bg-plum"
            >
              <p className="font-display text-3xl leading-9">"{item.quote}"</p>
              <div className="mt-8 border-t border-ivory/15 pt-5">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-champagne">{item.role}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramFeed() {
  return (
    <section className="bg-ivory px-4 py-24 dark:bg-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Instagram"
          title="@sadafboutique"
          copy="A ready-to-connect feed layout for new drops, bridal fittings, customer portraits, and reels."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {instagram.map((image, index) => (
            <motion.a
              key={image}
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <Image src={image} alt="Sadaf Instagram post" fill className="object-cover transition duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 grid place-items-center bg-ink/40 opacity-0 transition group-hover:opacity-100">
                <Instagram className="text-ivory" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function GoodWorks() {
  const works = [
    { value: "450+", label: "custom outfits delivered" },
    { value: "120+", label: "bridal and festive fittings" },
    { value: "4.9/5", label: "client styling experience" },
    { value: "COD", label: "simple cash on delivery orders" }
  ];

  return (
    <section className="bg-ivory px-4 py-20 dark:bg-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-lg border border-ink/10 bg-white p-6 shadow-luxury dark:border-ivory/10 dark:bg-white/8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-rosewood dark:text-champagne">My good works</p>
            <h2 className="font-display text-4xl font-semibold text-ink dark:text-ivory sm:text-5xl">Real Boutique Work, Saved At The Bottom For Trust</h2>
            <p className="mt-4 leading-7 text-ink/65 dark:text-ivory/65">
              Use this section for your best fittings, happy customer moments, bridal finishes, alteration transformations,
              and behind-the-scenes tailoring achievements.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {works.map((work) => (
              <div key={work.label} className="rounded-lg bg-silk p-5 dark:bg-ink">
                <p className="font-display text-4xl font-semibold text-rosewood dark:text-champagne">{work.value}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.18em] text-ink/55 dark:text-ivory/55">{work.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [contactStatus, setContactStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contactForm = event.currentTarget;
    const form = new FormData(contactForm);
    setContactStatus("Sending enquiry...");
    try {
      const sent = await sendEmailJs(process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID, {
        boutique_name: boutiqueName,
        owner_name: boutiqueOwnerName,
        customer_name: String(form.get("name") ?? ""),
        customer_email: String(form.get("email") ?? ""),
        customer_phone: String(form.get("phone") ?? ""),
        service: String(form.get("service") ?? ""),
        message: String(form.get("message") ?? ""),
        owner_email: ownerEmail,
        to_email: ownerEmail,
        receiver_email: ownerEmail,
        email: ownerEmail,
        from_name: String(form.get("name") ?? ""),
        to_name: boutiqueOwnerName,
        your_email: String(form.get("email") ?? ""),
        reply_to: String(form.get("email") ?? "")
      }, process.env.NEXT_PUBLIC_EMAILJS_CONTACT_SERVICE_ID);
      setContactStatus(sent.ok ? "Email enquiry sent successfully. We will contact you soon." : `EmailJS error: ${formatEmailJsError(sent.error)}`);
      if (sent.ok) {
        contactForm.reset();
      }
    } catch {
      setContactStatus("Email could not be sent right now. Please try again.");
    }
  }

  return (
    <section id="contact" className="bg-ink px-4 py-24 text-ivory sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-champagne">Visit Sadaf</p>
          <h2 className="font-display text-5xl font-semibold sm:text-6xl">Book Your Boutique Consultation</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ivory/70">
            Share your occasion, timeline, and preferred style. Your enquiry is sent directly to our boutique email.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={whatsappUrl} className="inline-flex items-center gap-2 rounded-full bg-champagne px-5 py-3 font-semibold text-ink">
              <Send size={18} />
              WhatsApp
            </a>
            <a href={`tel:+${boutiquePhone}`} className="inline-flex items-center gap-2 rounded-full border border-ivory/20 px-5 py-3 font-semibold">
              <Phone size={18} />
              Call Now
            </a>
          </div>
          <div className="mt-8 overflow-hidden rounded-lg border border-ivory/12">
            <iframe
              title="Sadaf Boutique map"
              src="https://www.google.com/maps?q=New%20Delhi%20India&output=embed"
              className="h-72 w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-lg bg-ivory p-6 text-ink shadow-luxury sm:p-8">
          <label className="mb-5 block text-sm font-semibold">
            Name
            <input name="name" required className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood" />
          </label>
          <label className="mb-5 block text-sm font-semibold">
            Phone
            <input name="phone" required className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood" />
          </label>
          <label className="mb-5 block text-sm font-semibold">
            Email
            <input name="email" type="email" required className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood" />
          </label>
          <label className="mb-5 block text-sm font-semibold">
            Service
            <select name="service" className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood">
              {services.slice(0, 5).map((service) => (
                <option key={service.title}>{service.title}</option>
              ))}
            </select>
          </label>
          <label className="mb-6 block text-sm font-semibold">
            Message
            <textarea name="message" rows={5} className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 outline-none focus:border-rosewood" />
          </label>
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-6 py-4 font-semibold text-ivory">
            Send Enquiry
            <ArrowRight size={18} />
          </button>
          {contactStatus && <p className="mt-4 text-sm text-rosewood">{contactStatus}</p>}
        </form>
      </div>
    </section>
  );
}

function FloatingButtons() {
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-3">
      <a href={whatsappUrl} aria-label="WhatsApp" className="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-luxury">
        <Send size={19} />
      </a>
      <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-12 w-12 place-items-center rounded-full bg-rosewood text-white shadow-luxury">
        <Instagram size={19} />
      </a>
      <a href={`tel:+${boutiquePhone}`} aria-label="Call now" className="grid h-12 w-12 place-items-center rounded-full bg-champagne text-ink shadow-luxury">
        <Phone size={19} />
      </a>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-ink px-4 py-10 text-ivory/65 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-ivory/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-3xl text-ivory">{boutiqueName}</p>
        <p className="text-sm">Designer ethnic wear, bridal couture, and bespoke stitching.</p>
      </div>
    </footer>
  );
}

export default function BoutiquePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [cartReady, setCartReady] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const storedEmail = window.localStorage.getItem(sessionStorageKey);
    const storedUser = readStoredUsers().find((user) => normalizeEmail(user.email) === normalizeEmail(storedEmail ?? ""));

    if (storedUser) {
      setCurrentUser({ name: storedUser.name, email: storedUser.email, phone: storedUser.phone });
      setCart(readStoredCart(storedUser.email));
    }

    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady || !currentUser) return;
    saveStoredCart(currentUser.email, cart);
  }, [cart, cartReady, currentUser]);

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function showToast(title: string, message: string) {
    setToast({ id: Date.now(), title, message });
  }

  function handleAuthSuccess(user: AuthUser) {
    const mode = authMode;
    setCurrentUser(user);
    setCart(readStoredCart(user.email));
    setAuthOpen(false);
    showToast(
      mode === "signup" ? "Account created" : "Login successful",
      mode === "signup" ? `Welcome, ${user.name}. Your account is ready.` : `Welcome back, ${user.name}.`
    );
  }

  function logout() {
    const userName = currentUser?.name ?? "customer";
    setCurrentUser(null);
    setCart([]);
    setCartOpen(false);
    window.localStorage.removeItem(sessionStorageKey);
    showToast("Logged out", `${userName}, you have been logged out successfully.`);
  }

  function openCart() {
    if (!currentUser) {
      openAuth("login");
      return;
    }

    setCartOpen(true);
  }

  function addToCart(product: Product, size: string) {
    if (!currentUser) {
      openAuth("login");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id && item.size === size);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id && item.size === size ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, size, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function removeFromCart(id: string, size: string) {
    setCart((current) => current.filter((item) => item.product.id !== id || item.size !== size));
  }

  function updateQuantity(id: string, size: string, quantity: number) {
    setCart((current) =>
      current.map((item) => (item.product.id === id && item.size === size ? { ...item, quantity } : item))
    );
  }

  function clearPurchasedCart() {
    if (currentUser) {
      window.localStorage.removeItem(cartStorageKey(currentUser.email));
    }

    setCart([]);
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-ivory text-ink dark:bg-ink dark:text-ivory">
        <div className="noise" />
        <Header
          cartCount={cartCount}
          currentUser={currentUser}
          onCartOpen={openCart}
          onAuthOpen={openAuth}
          onLogout={logout}
        />
        <main>
          <Hero />
          <ProductShop onAddToCart={addToCart} />
          <Portfolio />
          <About />
          <ServicesTestimonials />
          <InstagramFeed />
          <GoodWorks />
          <Contact />
        </main>
        <Footer />
        <FloatingButtons />
        <CartDrawer
          items={cart}
          open={cartOpen}
          currentUser={currentUser}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onQuantity={updateQuantity}
          onOrderComplete={clearPurchasedCart}
        />
        <AnimatePresence>
          {authOpen && (
            <AuthModal
              mode={authMode}
              onModeChange={setAuthMode}
              onClose={() => setAuthOpen(false)}
              onSuccess={handleAuthSuccess}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {toast && <ToastPopup toast={toast} onClose={() => setToast(null)} />}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}
