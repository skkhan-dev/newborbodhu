"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, getErrorMessage } from "@/lib/api";
import { localizePath, type PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

export type VendorDashboardResponse = {
  profile: {
    id: string;
    businessName: string;
    slug: string;
    status: string;
    billingStatus: string;
    categoryName: string | null;
    division: string | null;
    district: string | null;
    area: string | null;
    address: string | null;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    descriptionEn: string | null;
    descriptionBn: string | null;
  };
  packages: Array<{
    id: string;
    nameEn: string;
    nameBn: string | null;
    descriptionEn: string | null;
    descriptionBn: string | null;
    priceBdt: number;
    isActive: boolean;
  }>;
  recentLeads: Array<{
    id: string;
    status: string;
    message: string | null;
    requesterName: string | null;
    requesterEmail: string | null;
    requesterPhone: string | null;
    source: string | null;
    createdAt: string;
    memberProfile: {
      id: string;
      displayId: string;
      displayName: string;
    } | null;
    weddingProject: {
      id: string;
      title: string;
    } | null;
  }>;
};

type VendorWorkspaceProps = {
  accessToken: string;
  data: VendorDashboardResponse;
  onRefresh: () => Promise<void>;
  locale?: PublicLocale | null;
};

const defaultPackageForm = {
  nameEn: "",
  nameBn: "",
  descriptionEn: "",
  descriptionBn: "",
  priceBdt: "",
};

function leadActions(status: string) {
  switch (status) {
    case "NEW":
      return ["OPEN", "CLOSED_REJECTED"];
    case "OPEN":
      return ["RESPONDED", "CLOSED_REJECTED"];
    case "RESPONDED":
      return ["BOOKED", "CLOSED_REJECTED"];
    default:
      return [];
  }
}

function translateLeadStatus(status: string, locale: PublicLocale | null) {
  switch (status) {
    case "NEW":
      return localeText(locale, "New", "নতুন");
    case "OPEN":
      return localeText(locale, "Open", "খোলা");
    case "RESPONDED":
      return localeText(locale, "Responded", "উত্তর দেওয়া হয়েছে");
    case "BOOKED":
      return localeText(locale, "Booked", "বুকড");
    case "CLOSED_REJECTED":
      return localeText(locale, "Closed rejected", "বন্ধ - বাতিল");
    default:
      return status.replace(/_/g, " ");
  }
}

function translateVendorStatus(status: string, locale: PublicLocale | null) {
  switch (status) {
    case "ACTIVE":
      return localeText(locale, "Active", "সক্রিয়");
    case "PENDING":
      return localeText(locale, "Pending", "অপেক্ষমাণ");
    case "INACTIVE":
      return localeText(locale, "Inactive", "নিষ্ক্রিয়");
    default:
      return status.replace(/_/g, " ");
  }
}

function translateBillingStatus(status: string, locale: PublicLocale | null) {
  switch (status) {
    case "ACTIVE":
      return localeText(locale, "Active", "সক্রিয়");
    case "PENDING":
      return localeText(locale, "Pending", "অপেক্ষমাণ");
    case "PAST_DUE":
      return localeText(locale, "Past due", "বকেয়া");
    default:
      return status.replace(/_/g, " ");
  }
}

export function VendorWorkspace({
  accessToken,
  data,
  onRefresh,
  locale = null,
}: VendorWorkspaceProps) {
  const [profileForm, setProfileForm] = useState({
    businessName: data.profile.businessName,
    categoryName: data.profile.categoryName ?? "",
    division: data.profile.division ?? "",
    district: data.profile.district ?? "",
    area: data.profile.area ?? "",
    address: data.profile.address ?? "",
    contactPerson: data.profile.contactPerson ?? "",
    phone: data.profile.phone ?? "",
    email: data.profile.email ?? "",
    website: data.profile.website ?? "",
    descriptionEn: data.profile.descriptionEn ?? "",
    descriptionBn: data.profile.descriptionBn ?? "",
  });
  const [packageForm, setPackageForm] = useState(defaultPackageForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);

  useEffect(() => {
    setProfileForm({
      businessName: data.profile.businessName,
      categoryName: data.profile.categoryName ?? "",
      division: data.profile.division ?? "",
      district: data.profile.district ?? "",
      area: data.profile.area ?? "",
      address: data.profile.address ?? "",
      contactPerson: data.profile.contactPerson ?? "",
      phone: data.profile.phone ?? "",
      email: data.profile.email ?? "",
      website: data.profile.website ?? "",
      descriptionEn: data.profile.descriptionEn ?? "",
      descriptionBn: data.profile.descriptionBn ?? "",
    });
  }, [data]);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSavingProfile(true);

    try {
      await apiRequest("/vendors/me/profile", {
        method: "PATCH",
        token: accessToken,
        body: profileForm,
      });
      await onRefresh();
      setSuccess(localeText(locale, "Vendor profile updated.", "ভেন্ডর প্রোফাইল আপডেট হয়েছে।"));
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePackageSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreatingPackage(true);

    try {
      await apiRequest("/vendors/me/packages", {
        method: "POST",
        token: accessToken,
        body: {
          ...packageForm,
          priceBdt: Number(packageForm.priceBdt),
          isActive: true,
        },
      });
      setPackageForm(defaultPackageForm);
      await onRefresh();
      setSuccess(localeText(locale, "Vendor package added.", "ভেন্ডর প্যাকেজ যোগ হয়েছে।"));
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsCreatingPackage(false);
    }
  }

  async function handlePackageToggle(
    vendorPackage: VendorDashboardResponse["packages"][number],
  ) {
    setError(null);
    setSuccess(null);
    setBusyPackageId(vendorPackage.id);

    try {
      await apiRequest(`/vendors/me/packages/${vendorPackage.id}`, {
        method: "PATCH",
        token: accessToken,
        body: {
          nameEn: vendorPackage.nameEn,
          nameBn: vendorPackage.nameBn ?? undefined,
          descriptionEn: vendorPackage.descriptionEn ?? undefined,
          descriptionBn: vendorPackage.descriptionBn ?? undefined,
          priceBdt: vendorPackage.priceBdt,
          isActive: !vendorPackage.isActive,
        },
      });
      await onRefresh();
      setSuccess(
        vendorPackage.isActive
          ? localeText(locale, "Package paused.", "প্যাকেজ স্থগিত হয়েছে।")
          : localeText(locale, "Package activated.", "প্যাকেজ চালু হয়েছে।"),
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setBusyPackageId(null);
    }
  }

  async function handleLeadStatusChange(leadId: string, status: string) {
    setError(null);
    setSuccess(null);
    setBusyLeadId(leadId);

    try {
      await apiRequest(`/vendors/me/leads/${leadId}`, {
        method: "PATCH",
        token: accessToken,
        body: { status },
      });
      await onRefresh();
      setSuccess(
        localeText(
          locale,
          `Lead moved to ${translateLeadStatus(status, locale)}.`,
          `লিড ${translateLeadStatus(status, locale)} অবস্থায় নেওয়া হয়েছে।`,
        ),
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setBusyLeadId(null);
    }
  }

  return (
    <section className="dashboard-stack">
      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">
              {localeText(locale, "Vendor Dashboard", "ভেন্ডর ড্যাশবোর্ড")}
            </p>
            <h2>{data.profile.businessName}</h2>
          </div>
          <span className="status-pill status-pill-teal">
            {translateBillingStatus(data.profile.billingStatus, locale)}
          </span>
        </div>

        <div className="tag-list">
          <span className="tag">{data.profile.slug}</span>
          <span className="tag">{translateVendorStatus(data.profile.status, locale)}</span>
          {data.profile.categoryName ? <span className="tag">{data.profile.categoryName}</span> : null}
        </div>

        <div className="inline-actions">
          <Link
            href={localizePath(`/vendors/${data.profile.slug}`, locale)}
            className="button button-soft"
          >
            {localeText(locale, "View public page", "পাবলিক পেজ দেখুন")}
          </Link>
          <Link href={localizePath("/vendors", locale)} className="button button-soft">
            {localeText(locale, "Browse directory", "ডিরেক্টরি দেখুন")}
          </Link>
        </div>
      </article>

      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">
              {localeText(locale, "Vendor Profile", "ভেন্ডর প্রোফাইল")}
            </p>
            <h3>{localeText(locale, "Business details", "ব্যবসার তথ্য")}</h3>
          </div>
          <p className="hint">
            {localeText(
              locale,
              "Keep this accurate so public pages and lead emails stay trustworthy.",
              "এটি সঠিক রাখুন যাতে পাবলিক পেজ এবং লিড ইমেইল বিশ্বাসযোগ্য থাকে।",
            )}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleProfileSubmit}>
          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Business name", "ব্যবসার নাম")}</span>
              <input
                type="text"
                value={profileForm.businessName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    businessName: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "Category", "ক্যাটাগরি")}</span>
              <input
                type="text"
                value={profileForm.categoryName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    categoryName: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Contact person", "যোগাযোগের ব্যক্তি")}</span>
              <input
                type="text"
                value={profileForm.contactPerson}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    contactPerson: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "Phone", "ফোন")}</span>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Email", "ইমেইল")}</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "Website", "ওয়েবসাইট")}</span>
              <input
                type="text"
                value={profileForm.website}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    website: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Division", "বিভাগ")}</span>
              <input
                type="text"
                value={profileForm.division}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    division: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "District", "জেলা")}</span>
              <input
                type="text"
                value={profileForm.district}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    district: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Area", "এলাকা")}</span>
              <input
                type="text"
                value={profileForm.area}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    area: event.target.value,
                  }))
                }
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "Address", "ঠিকানা")}</span>
              <input
                type="text"
                value={profileForm.address}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="field">
            <span>{localeText(locale, "Description (English)", "বর্ণনা (ইংরেজি)")}</span>
            <textarea
              rows={4}
              value={profileForm.descriptionEn}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  descriptionEn: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>{localeText(locale, "Description (Bangla)", "বর্ণনা (বাংলা)")}</span>
            <textarea
              rows={4}
              value={profileForm.descriptionBn}
              onChange={(event) =>
                setProfileForm((current) => ({
                  ...current,
                  descriptionBn: event.target.value,
                }))
              }
            />
          </label>

          <div className="inline-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={isSavingProfile}
            >
              {isSavingProfile
                ? localeText(locale, "Saving...", "সেভ হচ্ছে...")
                : localeText(locale, "Save vendor profile", "ভেন্ডর প্রোফাইল সেভ করুন")}
            </button>
          </div>
        </form>
      </article>

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Packages", "প্যাকেজ")}</p>
            <h3>
              {localeText(
                locale,
                "Publish offers that can be shown on your public vendor page.",
                "এমন অফার প্রকাশ করুন যা আপনার পাবলিক ভেন্ডর পেজে দেখানো যাবে।",
              )}
            </h3>
          </div>
        </div>

        <form className="auth-form" onSubmit={handlePackageSubmit}>
          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Package name (English)", "প্যাকেজের নাম (ইংরেজি)")}</span>
              <input
                type="text"
                value={packageForm.nameEn}
                onChange={(event) =>
                  setPackageForm((current) => ({
                    ...current,
                    nameEn: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>{localeText(locale, "Package name (Bangla)", "প্যাকেজের নাম (বাংলা)")}</span>
              <input
                type="text"
                value={packageForm.nameBn}
                onChange={(event) =>
                  setPackageForm((current) => ({
                    ...current,
                    nameBn: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="input-grid">
            <label className="field">
              <span>{localeText(locale, "Price (BDT)", "মূল্য (বিডিটি)")}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={packageForm.priceBdt}
                onChange={(event) =>
                  setPackageForm((current) => ({
                    ...current,
                    priceBdt: event.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          <label className="field">
            <span>{localeText(locale, "Description (English)", "বর্ণনা (ইংরেজি)")}</span>
            <textarea
              rows={3}
              value={packageForm.descriptionEn}
              onChange={(event) =>
                setPackageForm((current) => ({
                  ...current,
                  descriptionEn: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>{localeText(locale, "Description (Bangla)", "বর্ণনা (বাংলা)")}</span>
            <textarea
              rows={3}
              value={packageForm.descriptionBn}
              onChange={(event) =>
                setPackageForm((current) => ({
                  ...current,
                  descriptionBn: event.target.value,
                }))
              }
            />
          </label>

          <div className="inline-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={isCreatingPackage}
            >
              {isCreatingPackage
                ? localeText(locale, "Publishing...", "প্রকাশ করা হচ্ছে...")
                : localeText(locale, "Add package", "প্যাকেজ যোগ করুন")}
            </button>
          </div>
        </form>

        {data.packages.length ? (
          <div className="stack-list">
            {data.packages.map((vendorPackage) => (
              <article key={vendorPackage.id} className="mini-card mini-card-horizontal">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <h4>{vendorPackage.nameEn}</h4>
                      <p className="mini-text">
                        {vendorPackage.nameBn ??
                          localeText(locale, "Bangla name pending", "বাংলা নাম পরে আসবে")}
                      </p>
                    </div>
                    <span className="status-pill status-pill-gold">
                      {vendorPackage.priceBdt} BDT
                    </span>
                  </div>
                  <p className="mini-text">
                    {vendorPackage.descriptionEn ??
                      vendorPackage.descriptionBn ??
                      localeText(locale, "No package description yet.", "এখনও কোনো প্যাকেজ বর্ণনা নেই।")}
                  </p>
                  <div className="inline-actions">
                    <span className="tag">
                      {vendorPackage.isActive
                        ? localeText(locale, "Active", "সক্রিয়")
                        : localeText(locale, "Paused", "স্থগিত")}
                    </span>
                    <button
                      type="button"
                      className="button button-soft"
                      disabled={busyPackageId === vendorPackage.id}
                      onClick={() => handlePackageToggle(vendorPackage)}
                    >
                      {busyPackageId === vendorPackage.id
                        ? localeText(locale, "Updating...", "আপডেট হচ্ছে...")
                        : vendorPackage.isActive
                          ? localeText(locale, "Pause package", "প্যাকেজ স্থগিত করুন")
                          : localeText(locale, "Activate package", "প্যাকেজ চালু করুন")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <p className="section-kicker">
              {localeText(locale, "No packages yet", "এখনও কোনো প্যাকেজ নেই")}
            </p>
            <h2>
              {localeText(
                locale,
                "Add your first offer to make the vendor page more credible.",
                "আপনার প্রথম অফার যোগ করুন যাতে ভেন্ডর পেজ আরও বিশ্বাসযোগ্য হয়।",
              )}
            </h2>
          </div>
        )}
      </article>

      <article className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header">
          <div>
            <p className="section-kicker">{localeText(locale, "Leads", "লিড")}</p>
            <h3>{localeText(locale, "Recent vendor inquiries", "সাম্প্রতিক ভেন্ডর অনুসন্ধান")}</h3>
          </div>
        </div>

        {data.recentLeads.length ? (
          <div className="stack-list">
            {data.recentLeads.map((lead) => (
              <article key={lead.id} className="mini-card mini-card-horizontal">
                <div className="mini-card-body">
                  <div className="panel-header">
                    <div>
                      <h4>
                        {lead.requesterName ??
                          lead.memberProfile?.displayName ??
                          localeText(locale, "Lead", "লিড")}
                      </h4>
                      <p className="mini-text">
                        {[lead.requesterEmail, lead.requesterPhone].filter(Boolean).join(" • ") ||
                          localeText(locale, "Contact pending", "যোগাযোগ অপেক্ষমাণ")}
                      </p>
                    </div>
                    <span className="tag">{translateLeadStatus(lead.status, locale)}</span>
                  </div>
                  <p className="mini-text">
                    {lead.message ??
                      localeText(locale, "No lead message provided.", "কোনো লিড বার্তা দেওয়া হয়নি।")}
                  </p>
                  <div className="tag-list">
                    {lead.source ? <span className="tag">{lead.source}</span> : null}
                    {lead.memberProfile ? (
                      <span className="tag">{lead.memberProfile.displayId}</span>
                    ) : null}
                    {lead.weddingProject ? <span className="tag">{lead.weddingProject.title}</span> : null}
                  </div>
                  {leadActions(lead.status).length ? (
                    <div className="inline-actions">
                      {leadActions(lead.status).map((status) => (
                        <button
                        key={status}
                        type="button"
                          className="button button-soft"
                          disabled={busyLeadId === lead.id}
                          onClick={() => handleLeadStatusChange(lead.id, status)}
                        >
                          {busyLeadId === lead.id
                            ? localeText(locale, "Updating...", "আপডেট হচ্ছে...")
                            : translateLeadStatus(status, locale)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <p className="section-kicker">{localeText(locale, "No leads yet", "এখনও কোনো লিড নেই")}</p>
            <h2>
              {localeText(
                locale,
                "Public vendor pages and wedding planning flows will create leads here.",
                "পাবলিক ভেন্ডর পেজ এবং ওয়েডিং প্ল্যানিং ফ্লো থেকে এখানে লিড আসবে।",
              )}
            </h2>
          </div>
        )}
      </article>
    </section>
  );
}
