import { VendorSignupForm } from "@/components/vendor-signup-form";

export default function VendorSignupPage() {
  return (
    <main className="page-shell">
      <section className="persona-hero auth-hero">
        <div>
          <p className="section-kicker">Vendor Registration</p>
          <h1>Join Borbodhu as a wedding vendor.</h1>
          <p className="hero-copy">
            This creates a real vendor account in the live test environment so packages, leads,
            and vendor self-service can be validated end to end.
          </p>
        </div>
      </section>

      <VendorSignupForm />
    </main>
  );
}
