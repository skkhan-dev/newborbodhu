import { Controller, Get } from "@nestjs/common";

import { MetaService } from "./meta.service";

@Controller("meta")
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get("bootstrap")
  async getBootstrap() {
    const publicConfig = await this.metaService.getPublicConfig();

    return {
      locales: [
        { key: "en", label: "English" },
        { key: "bn", label: "Bangla" },
      ],
      memberLabels: {
        selfGenderOptions: ["Man", "Woman"],
        lookingForOptions: ["Man", "Woman"],
      },
      roles: [
        "member",
        "ghotok",
        "vendor",
        "admin",
        "super_admin",
      ],
      paymentMethods: publicConfig.paymentMethods,
      parityFocus: [
        "member_profile_review",
        "private_photo_requests",
        "membership_gating",
        "ghotok_credit_usage",
        "vendor_leads",
        "wedding_planning",
      ],
    };
  }

  @Get("public-config")
  getPublicConfig() {
    return this.metaService.getPublicConfig();
  }

  @Get("implementation-status")
  getImplementationStatus() {
    return {
      phase: "backend-foundation-and-core-workflows",
      completed: [
        "workspace_scaffold",
        "web_review_routes",
        "core_api_scaffold",
        "health_endpoint",
        "bootstrap_metadata_endpoint",
        "initial_prisma_schema",
        "typed_env_validation",
        "auth_module",
        "member_profile_module",
        "mailbox_module",
        "notifications_outbox",
        "media_module",
        "billing_foundation",
        "payment_confirmation_webhooks",
        "saved_searches_and_visitors",
        "ghotok_impersonation_and_credit_consumption",
        "admin_review_module",
        "vendor_directory_module",
        "wedding_planning_module",
        "ghotok_foundation_module",
        "public_profile_seo_pages",
        "legacy_migration_dry_run_tooling",
        "parity_test_plan",
      ],
      next: [
        "migration_load_jobs",
        "seo_landing_page_expansion",
        "react_native_apps",
      ],
    };
  }
}
