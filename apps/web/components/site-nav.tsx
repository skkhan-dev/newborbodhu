"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { describePrimaryRole } from "@/lib/auth";
import {
  getLocaleFromPathname,
  localizePath,
  toggleLocalePath,
} from "@/lib/locale";
import { getPublicLocaleContent } from "@/lib/public-locale-content";

/* ---------- dropdown inline styles ---------- */
const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  marginTop: 6,
  background: "white",
  borderRadius: 12,
  boxShadow: "0 4px 24px rgba(0,0,0,.12), 0 1px 4px rgba(0,0,0,.08)",
  padding: 8,
  minWidth: 180,
  zIndex: 50,
};

const dropdownItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 14px",
  borderRadius: 8,
  fontSize: "0.9rem",
  color: "inherit",
  textDecoration: "none",
  textAlign: "left",
  background: "none",
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const dropdownDividerStyle: React.CSSProperties = {
  height: 1,
  background: "#e5e5e5",
  margin: "4px 0",
};

/* ============================================= */

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, user, signOut } = useAuth();
  const locale = getLocaleFromPathname(pathname);
  const navCopy = getPublicLocaleContent(locale ?? "en").nav;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = isReady && !!user;

  /* close everything on route change */
  useEffect(() => {
    setDrawerOpen(false);
    setLangOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  /* lock body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  /* close dropdowns on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* helpers */
  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/" || href === "/en" || href === "/bn")
      return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleSignOut() {
    signOut();
    setDrawerOpen(false);
    setUserMenuOpen(false);
    router.push(localizePath("/login", locale));
  }

  function switchLocale(target: "en" | "bn") {
    const nextPath = toggleLocalePath(pathname ?? "/", target);
    setLangOpen(false);
    setDrawerOpen(false);
    // Use hard navigation for locale change so server components re-render with the new locale
    window.location.href = nextPath;
  }

  const userInitial = user?.email?.charAt(0)?.toUpperCase() ?? "?";

  /* -------- render -------- */
  return (
    <>
      <header className="app-header">
        <div className="page-shell page-shell-tight">
          <nav className="top-nav top-nav-surface">
            {/* ---- Brand ---- */}
            <Link
              href={localizePath("/", locale)}
              className="brand-lockup"
              style={{ textDecoration: "none" }}
            >
              <img src="/logo.svg" alt="Borbodhu" className="brand-mark-img" width={40} height={40} />
              <div className="brand-text-stack">
                <span className="brand-tagline-top">মনের মানুষের</span>
                <p className="brand-name">borbodhu.com</p>
                <span className="brand-tagline-bottom">আধুনিক ঠিকানা</span>
              </div>
            </Link>

            {/* ---- Desktop nav cluster ---- */}
            <div className="nav-cluster">
              <div className="nav-links">
                {isLoggedIn ? (
                  <>
                    {/* Logged-in links */}
                    <Link
                      href={localizePath("/search", locale)}
                      className={`nav-link${isActive(localizePath("/search", locale)) ? " nav-link-active" : ""}`}
                    >
                      {navCopy.labels.search}
                    </Link>
                    <Link
                      href={localizePath("/dashboard", locale)}
                      className={`nav-link${isActive(localizePath("/dashboard", locale)) ? " nav-link-active" : ""}`}
                      style={{ position: "relative" }}
                    >
                      {navCopy.labels.messages}
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Logged-out links */}
                    <Link
                      href={localizePath("/profiles", locale)}
                      className={`nav-link${isActive(localizePath("/profiles", locale)) ? " nav-link-active" : ""}`}
                    >
                      {navCopy.labels.profiles}
                    </Link>
                    <Link
                      href={localizePath("/how-it-works", locale)}
                      className={`nav-link${isActive(localizePath("/how-it-works", locale)) ? " nav-link-active" : ""}`}
                    >
                      {navCopy.labels.howItWorks}
                    </Link>
                    <Link
                      href={localizePath("/upgrade", locale)}
                      className={`nav-link${isActive(localizePath("/upgrade", locale)) ? " nav-link-active" : ""}`}
                    >
                      {navCopy.labels.pricing}
                    </Link>
                  </>
                )}
              </div>

              <div
                className="nav-auth"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {/* ---- Language dropdown ---- */}
                <div
                  ref={langRef}
                  style={{ position: "relative" }}
                >
                  <button
                    type="button"
                    className="nav-link"
                    onClick={() => setLangOpen((v) => !v)}
                    aria-label="Change language"
                    aria-expanded={langOpen}
                    aria-haspopup="true"
                    style={{ fontSize: "1.1rem", padding: "4px 8px" }}
                  >
                    🌐 <span style={{ fontSize: "0.7em" }}>▾</span>
                  </button>

                  {langOpen && (
                    <div style={dropdownStyle} role="menu" aria-label="Language options">
                      <button
                        type="button"
                        role="menuitem"
                        style={{
                          ...dropdownItemStyle,
                          fontWeight: (!locale || locale === "en") ? 600 : 400,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        onClick={() => switchLocale("en")}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        style={{
                          ...dropdownItemStyle,
                          fontWeight: locale === "bn" ? 600 : 400,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        onClick={() => switchLocale("bn")}
                      >
                        বাংলা
                      </button>
                    </div>
                  )}
                </div>

                {/* ---- Auth area ---- */}
                {isLoggedIn ? (
                  /* User dropdown */
                  <div
                    ref={userMenuRef}
                    style={{ position: "relative" }}
                  >
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      aria-label="User menu"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 8,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #8b1a30, #5c1020)",
                          color: "white",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                        }}
                      >
                        {userInitial}
                      </span>
                      <span style={{ fontSize: "0.7em", color: "#666" }}>▾</span>
                    </button>

                    {userMenuOpen && (
                      <div style={dropdownStyle} role="menu" aria-label="User menu">
                        <Link
                          href={localizePath("/dashboard", locale)}
                          role="menuitem"
                          style={dropdownItemStyle}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          {navCopy.labels.dashboard}
                        </Link>
                        <div style={dropdownDividerStyle} role="separator" />
                        <button
                          type="button"
                          role="menuitem"
                          style={{ ...dropdownItemStyle, color: "#dc2626" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          onClick={handleSignOut}
                        >
                          {navCopy.labels.signOut}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      href={localizePath("/login", locale)}
                      className="button button-soft"
                    >
                      {navCopy.labels.login}
                    </Link>
                    <Link
                      href={localizePath("/signup", locale)}
                      className="button button-primary"
                    >
                      {navCopy.labels.joinNow} →
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* ---- Mobile hamburger ---- */}
            <button
              type="button"
              aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={drawerOpen}
              className={`nav-hamburger${drawerOpen ? " nav-hamburger-open" : ""}`}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </nav>
        </div>
      </header>

      {/* ---- Mobile slide-out drawer ---- */}
      <div
        className={`nav-drawer${drawerOpen ? " nav-drawer-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div
          className="nav-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <div className="nav-drawer-panel">
          {/* Drawer brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <img src="/logo.svg" alt="Borbodhu" width={40} height={40} style={{ borderRadius: 10 }} />
            <strong style={{ fontSize: "1.1rem" }}>borbodhu.com</strong>
          </div>

          <div className="nav-drawer-divider" />

          {/* ---- Menu section ---- */}
          <p className="nav-drawer-section-label">
            {locale === "bn" ? "নেভিগেশন" : "Menu"}
          </p>

          {isLoggedIn ? (
            <>
              <Link
                href={localizePath("/search", locale)}
                className={`nav-link${isActive(localizePath("/search", locale)) ? " nav-link-active" : ""}`}
              >
                {navCopy.labels.search}
              </Link>
              <Link
                href={localizePath("/dashboard", locale)}
                className={`nav-link${isActive(localizePath("/dashboard", locale)) ? " nav-link-active" : ""}`}
              >
                {navCopy.labels.messages}
              </Link>
              <Link
                href={localizePath("/dashboard", locale)}
                className="nav-link"
              >
                {navCopy.labels.dashboard}
              </Link>
              <Link
                href={localizePath("/dashboard", locale) + "?tab=profile"}
                className="nav-link"
              >
                {navCopy.labels.editProfile}
              </Link>
              <Link
                href={localizePath("/dashboard", locale) + "?tab=billing"}
                className="nav-link"
              >
                {navCopy.labels.membership}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={localizePath("/", locale)}
                className={`nav-link${isActive(localizePath("/", locale)) ? " nav-link-active" : ""}`}
              >
                {locale === "bn" ? "হোম" : "Home"}
              </Link>
              <Link
                href={localizePath("/profiles", locale)}
                className={`nav-link${isActive(localizePath("/profiles", locale)) ? " nav-link-active" : ""}`}
              >
                {navCopy.labels.profiles}
              </Link>
              <Link
                href={localizePath("/how-it-works", locale)}
                className={`nav-link${isActive(localizePath("/how-it-works", locale)) ? " nav-link-active" : ""}`}
              >
                {navCopy.labels.howItWorks}
              </Link>
              <Link
                href={localizePath("/upgrade", locale)}
                className={`nav-link${isActive(localizePath("/upgrade", locale)) ? " nav-link-active" : ""}`}
              >
                {navCopy.labels.pricing}
              </Link>
            </>
          )}

          <div className="nav-drawer-divider" />

          {/* ---- Language section ---- */}
          <p className="nav-drawer-section-label">
            {locale === "bn" ? "ভাষা" : "Language"}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className={`nav-link${!locale || locale === "en" ? " nav-link-active" : ""}`}
              onClick={() => switchLocale("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`nav-link${locale === "bn" ? " nav-link-active" : ""}`}
              onClick={() => switchLocale("bn")}
            >
              বাংলা
            </button>
          </div>

          <div className="nav-drawer-divider" />

          {/* ---- Auth section ---- */}
          {isLoggedIn ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #8b1a30, #5c1020)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  {userInitial}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user?.email}
                  </p>
                  <span className="auth-chip" style={{ fontSize: "0.75rem" }}>
                    {describePrimaryRole(user!)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="button button-soft"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleSignOut}
              >
                {navCopy.labels.signOut}
              </button>
            </>
          ) : (
            <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
              <Link
                href={localizePath("/login", locale)}
                className="button button-soft"
                style={{ justifyContent: "center" }}
              >
                {navCopy.labels.login}
              </Link>
              <Link
                href={localizePath("/signup", locale)}
                className="button button-primary"
                style={{ justifyContent: "center" }}
              >
                {navCopy.labels.joinNow} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
