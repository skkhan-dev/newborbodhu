"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { localizePath, type PublicLocale } from "@/lib/locale";

export type VendorDirectoryItem = {
  id: string;
  businessName: string;
  slug: string;
  categoryName: string | null;
  division: string | null;
  district: string | null;
  area: string | null;
  descriptionEn: string | null;
  descriptionBn: string | null;
  logoPath: string | null;
  packages: Array<{
    id: string;
    nameEn: string;
    nameBn: string | null;
    priceBdt: number;
  }>;
};

type VendorFilterState = {
  search: string;
  category: string;
  division: string;
  district: string;
};

const initialFilters: VendorFilterState = {
  search: "",
  category: "",
  division: "",
  district: "",
};

export type VendorDirectoryPageCopy = {
  heroEyebrowPrimary: string;
  heroEyebrowSecondary: string;
  heroTitle: string;
  heroBody: string;
  createMemberAccount: string;
  memberLogin: string;
  openDashboard: string;
  vendorsMetricLabel: string;
  categoriesMetricLabel: string;
  shortlistMetricLabel: string;
  directorySearchKicker: string;
  directorySearchTitle: string;
  directorySearchBody: string;
  searchLabel: string;
  searchPlaceholder: string;
  categoryLabel: string;
  allCategories: string;
  divisionLabel: string;
  allDivisions: string;
  districtLabel: string;
  districtPlaceholder: string;
  searchButton: string;
  loadingButton: string;
  resetButton: string;
  vendorResultsKicker: string;
  vendorResultsTitle: string;
  vendorResultsBody: string;
  quoteLabel: string;
  descriptionPending: string;
  viewVendor: string;
  shortlistInDashboard: string;
  joinToShortlist: string;
  noResultsKicker: string;
  noResultsTitle: string;
  noResultsBody: string;
};

const defaultCopy: VendorDirectoryPageCopy = {
  heroEyebrowPrimary: "Wedding marketplace",
  heroEyebrowSecondary: "Public vendor discovery live",
  heroTitle: "Browse wedding vendors built for Bangladeshi celebrations at home and abroad.",
  heroBody:
    "This directory is connected to the live Borbodhu test API. Members can shortlist vendors from inside wedding planning, while guests can explore packages, categories, and Dhaka-first seed inventory from the public site.",
  createMemberAccount: "Create member account",
  memberLogin: "Member log in",
  openDashboard: "Open your dashboard",
  vendorsMetricLabel: "vendors in the current filtered result",
  categoriesMetricLabel: "service categories already exposed in the public directory",
  shortlistMetricLabel: "member wedding planning can already save vendors from this list",
  directorySearchKicker: "Directory Search",
  directorySearchTitle: "Filter by category, division, district, or a simple keyword.",
  directorySearchBody:
    "The public directory is intentionally simple in this slice so the team can validate real vendor browsing before vendor self-service and lead capture expand.",
  searchLabel: "Search",
  searchPlaceholder: "Planner, decor, mehendi, venue",
  categoryLabel: "Category",
  allCategories: "All categories",
  divisionLabel: "Division",
  allDivisions: "All divisions",
  districtLabel: "District",
  districtPlaceholder: "Dhaka",
  searchButton: "Search Directory",
  loadingButton: "Loading...",
  resetButton: "Reset Filters",
  vendorResultsKicker: "Vendor Results",
  vendorResultsTitle: "Public vendor cards with package visibility and next-step actions.",
  vendorResultsBody:
    "Members can move into wedding planning from here. Guests can explore the growing marketplace without seeing any private member data.",
  quoteLabel: "Quote",
  descriptionPending: "Vendor description pending.",
  viewVendor: "View vendor",
  shortlistInDashboard: "Shortlist in dashboard",
  joinToShortlist: "Join to shortlist",
  noResultsKicker: "No results",
  noResultsTitle: "No vendors matched this filter yet.",
  noResultsBody:
    "Try a broader keyword or remove one of the location filters to expand the result set.",
};

export function VendorsPageClient({
  initialVendors,
  copy,
  locale = null,
}: {
  initialVendors: VendorDirectoryItem[];
  copy?: Partial<VendorDirectoryPageCopy>;
  locale?: PublicLocale | null;
}) {
  const { user } = useAuth();
  const resolvedCopy = { ...defaultCopy, ...copy };
  const [filters, setFilters] = useState<VendorFilterState>(initialFilters);
  const [vendors, setVendors] = useState<VendorDirectoryItem[]>(initialVendors);
  const [directorySeed, setDirectorySeed] = useState<VendorDirectoryItem[]>(initialVendors);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadVendors(nextFilters: VendorFilterState) {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (nextFilters.search.trim()) {
        params.set("search", nextFilters.search.trim());
      }

      if (nextFilters.category.trim()) {
        params.set("category", nextFilters.category.trim());
      }

      if (nextFilters.division.trim()) {
        params.set("division", nextFilters.division.trim());
      }

      if (nextFilters.district.trim()) {
        params.set("district", nextFilters.district.trim());
      }

      const response = await apiRequest<VendorDirectoryItem[]>(
        `/vendors${params.size ? `?${params.toString()}` : ""}`,
      );

      setVendors(response);

      if (!directorySeed.length && !params.size) {
        setDirectorySeed(response);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!initialVendors.length) {
      void loadVendors(initialFilters);
    }
  }, [initialVendors.length]);

  const directoryReference = directorySeed.length ? directorySeed : vendors;
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          directoryReference
            .map((vendor) => vendor.categoryName)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [directoryReference],
  );
  const divisions = useMemo(
    () =>
      Array.from(
        new Set(
          directoryReference
            .map((vendor) => vendor.division)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [directoryReference],
  );

  return (
    <>
      <section className="hero">
        <div className="hero-card hero-card-compact">
          <div className="eyebrow">
            <span>{resolvedCopy.heroEyebrowPrimary}</span>
            <span>{resolvedCopy.heroEyebrowSecondary}</span>
          </div>
          <h1>{resolvedCopy.heroTitle}</h1>
          <p className="hero-copy">{resolvedCopy.heroBody}</p>
          <div className="hero-actions">
            {user ? (
              <Link href={localizePath("/dashboard", locale)} className="button button-primary">
                {resolvedCopy.openDashboard}
              </Link>
            ) : (
              <>
                <Link href={localizePath("/signup", locale)} className="button button-primary">
                  {resolvedCopy.createMemberAccount}
                </Link>
                <Link href={localizePath("/login", locale)} className="button button-soft">
                  {resolvedCopy.memberLogin}
                </Link>
              </>
            )}
          </div>
          <div className="hero-metrics">
            <article>
              <strong>{vendors.length}</strong>
              <span>{resolvedCopy.vendorsMetricLabel}</span>
            </article>
            <article>
              <strong>{categories.length || 1}</strong>
              <span>{resolvedCopy.categoriesMetricLabel}</span>
            </article>
            <article>
              <strong>Shortlist</strong>
              <span>{resolvedCopy.shortlistMetricLabel}</span>
            </article>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{resolvedCopy.directorySearchKicker}</p>
            <h2>{resolvedCopy.directorySearchTitle}</h2>
          </div>
          <p>{resolvedCopy.directorySearchBody}</p>
        </div>

        {error ? <div className="error-banner dashboard-banner">{error}</div> : null}

        <div className="input-grid vendor-filter-grid">
          <label className="field">
            <span>{resolvedCopy.searchLabel}</span>
            <input
              type="text"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder={resolvedCopy.searchPlaceholder}
            />
          </label>

          <label className="field">
            <span>{resolvedCopy.categoryLabel}</span>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            >
              <option value="">{resolvedCopy.allCategories}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{resolvedCopy.divisionLabel}</span>
            <select
              value={filters.division}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  division: event.target.value,
                }))
              }
            >
              <option value="">{resolvedCopy.allDivisions}</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{resolvedCopy.districtLabel}</span>
            <input
              type="text"
              value={filters.district}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  district: event.target.value,
                }))
              }
              placeholder={resolvedCopy.districtPlaceholder}
            />
          </label>
        </div>

        <div className="inline-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void loadVendors(filters)}
            disabled={isLoading}
          >
            {isLoading ? resolvedCopy.loadingButton : resolvedCopy.searchButton}
          </button>
          <button
            type="button"
            className="button button-soft"
            onClick={() => {
              setFilters(initialFilters);
              void loadVendors(initialFilters);
            }}
            disabled={isLoading}
          >
            {resolvedCopy.resetButton}
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{resolvedCopy.vendorResultsKicker}</p>
            <h2>{resolvedCopy.vendorResultsTitle}</h2>
          </div>
          <p>{resolvedCopy.vendorResultsBody}</p>
        </div>

        {vendors.length ? (
          <div className="card-grid vendor-card-grid">
            {vendors.map((vendor) => (
              <article key={vendor.id} className="mini-card">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <strong>{vendor.businessName}</strong>
                      <p className="mini-text">
                        {[vendor.categoryName, vendor.area, vendor.district, vendor.division]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <span className="status-pill status-pill-gold">
                      {vendor.packages[0]?.priceBdt
                        ? `${vendor.packages[0].priceBdt} BDT`
                        : resolvedCopy.quoteLabel}
                    </span>
                  </div>

                  <p className="mini-text">
                    {vendor.descriptionEn ?? vendor.descriptionBn ?? resolvedCopy.descriptionPending}
                  </p>

                  {vendor.packages.length ? (
                    <div className="tag-list">
                      {vendor.packages.map((pkg) => (
                        <span key={pkg.id} className="tag">
                          {pkg.nameEn}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="inline-actions">
                    <Link
                      href={localizePath(`/vendors/${vendor.slug}`, locale)}
                      className="button button-primary"
                    >
                      {resolvedCopy.viewVendor}
                    </Link>
                    {user?.roles.includes("MEMBER") ? (
                      <Link
                        href={localizePath("/dashboard", locale)}
                        className="button button-soft"
                      >
                        {resolvedCopy.shortlistInDashboard}
                      </Link>
                    ) : (
                      <Link
                        href={localizePath("/signup", locale)}
                        className="button button-soft"
                      >
                        {resolvedCopy.joinToShortlist}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <p className="section-kicker">{resolvedCopy.noResultsKicker}</p>
            <h2>{resolvedCopy.noResultsTitle}</h2>
            <p className="auth-copy">{resolvedCopy.noResultsBody}</p>
          </div>
        )}
      </section>
    </>
  );
}
