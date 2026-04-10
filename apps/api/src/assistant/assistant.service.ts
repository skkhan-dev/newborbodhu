import { Injectable } from "@nestjs/common";
import {
  ApprovalStatus,
  GhotokStatus,
  LeadStatus,
  PaymentStatus,
  Prisma,
  ProfileStatus,
  RoleKey,
  VendorStatus,
} from "@prisma/client";

import { AdminService } from "../admin/admin.service";
import { AuthService } from "../auth/auth.service";
import { AuthActor } from "../common/types/auth-actor.type";
import { GhotokService } from "../ghotok/ghotok.service";
import { MailboxService } from "../mailbox/mailbox.service";
import { MemberProfilesService } from "../member-profiles/member-profiles.service";
import { PrismaService } from "../prisma/prisma.service";
import { SuperAdminService } from "../super-admin/super-admin.service";
import { VendorsService } from "../vendors/vendors.service";
import { WeddingService } from "../wedding/wedding.service";
import { QueryAssistantDto } from "./dto/query-assistant.dto";

type ConfirmationPayload = {
  type: string;
  payload: Record<string, unknown>;
  label: string;
  prompt: string;
};

type AssistantAnswer = {
  answer: string;
  bullets: string[];
  suggestions: string[];
  scope: string;
  confirmation?: ConfirmationPayload | null;
  choices?: Array<{
    label: string;
    confirmation?: ConfirmationPayload | null;
    query?: string;
  }>;
};

type AssistantQueryContext = {
  lastResponse?: AssistantAnswer | null;
};

type AssistantLocale = "en" | "bn";

@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly mailboxService: MailboxService,
    private readonly weddingService: WeddingService,
    private readonly adminService: AdminService,
    private readonly superAdminService: SuperAdminService,
    private readonly memberProfilesService: MemberProfilesService,
    private readonly vendorsService: VendorsService,
    private readonly ghotokService: GhotokService,
  ) {}

  async query(actor: AuthActor, dto: QueryAssistantDto): Promise<AssistantAnswer> {
    const query = (dto.query || "").trim();
    const locale = this.resolveAssistantLocale(dto.locale, query);
    const normalized = this.normalizeAssistantQuery(query);
    const context = (dto.context as AssistantQueryContext | undefined) ?? undefined;

    if (dto.confirmation?.type) {
      return this.localizeAssistantAnswer(
        locale,
        await this.executeConfirmedAction(actor, dto.confirmation.type, dto.confirmation.payload ?? {}, query),
      );
    }

    const contextual = await this.handleContextualFollowUp(actor, query, normalized, context);
    if (contextual) {
      return this.localizeAssistantAnswer(locale, contextual);
    }

    if (actor.roles.includes(RoleKey.MEMBER) && actor.memberProfileId) {
      const proposedAction = await this.planMemberAction(actor, query, normalized);
      if (proposedAction) return this.localizeAssistantAnswer(locale, proposedAction);

      if (this.matches(normalized, ["message from", "conversation with", "find message", "search message"])) {
        return this.localizeAssistantAnswer(locale, await this.searchMailbox(actor, query));
      }
      if (this.matches(normalized, ["message", "mailbox", "inbox", "unread"])) {
        return this.localizeAssistantAnswer(locale, await this.getMailboxSummary(actor));
      }
      if (this.matches(normalized, ["contact unlock", "unlocked contact", "contacts unlocked"])) {
        return this.localizeAssistantAnswer(locale, await this.getContactUnlockSummary(actor));
      }
      if (this.matches(normalized, ["membership", "plan", "subscription"])) {
        return this.localizeAssistantAnswer(locale, await this.getMembershipSummary(actor));
      }
      if (this.matches(normalized, ["saved search", "saved searches", "alert"])) {
        return this.localizeAssistantAnswer(locale, await this.getSavedSearchSummary(actor));
      }
      if (this.matches(normalized, ["wedding", "guest", "vendor", "shortlist"])) {
        return this.localizeAssistantAnswer(locale, await this.getWeddingSummary(actor));
      }
      if (this.matches(normalized, ["profile", "completion", "approval", "status"])) {
        return this.localizeAssistantAnswer(locale, await this.getProfileSummary(actor));
      }
      if (this.matches(normalized, ["attention", "today", "summary", "overview", "help me", "what should i do"])) {
        return this.localizeAssistantAnswer(locale, await this.getMemberAttentionSummary(actor));
      }
      return this.localizeAssistantAnswer(locale, await this.getMemberAttentionSummary(actor));
    }

    if (actor.roles.includes(RoleKey.VENDOR) && actor.vendorProfileId) {
      const proposedAction = await this.planVendorAction(actor, query, normalized);
      if (proposedAction) return this.localizeAssistantAnswer(locale, proposedAction);
      return this.localizeAssistantAnswer(locale, await this.getVendorSummary(actor, normalized));
    }

    if (actor.roles.includes(RoleKey.GHOTOK) && actor.ghotokProfileId) {
      const proposedAction = await this.planGhotokAction(actor, query, normalized);
      if (proposedAction) return this.localizeAssistantAnswer(locale, proposedAction);
      return this.localizeAssistantAnswer(locale, await this.getGhotokSummary(actor, normalized));
    }

    if (actor.roles.includes(RoleKey.ADMIN) || actor.roles.includes(RoleKey.SUPER_ADMIN)) {
      const proposedAction = await this.planAdminAction(actor, query, normalized);
      if (proposedAction) return this.localizeAssistantAnswer(locale, proposedAction);
      return this.localizeAssistantAnswer(locale, await this.getAdminSummary(normalized));
    }

    return this.localizeAssistantAnswer(locale, {
      answer: "I can help with dashboard summaries, mailbox, membership, wedding planning, vendor leads, and moderation once those areas are connected to your role.",
      bullets: [],
      suggestions: [
        "What needs my attention today?",
        "How many unread messages do I have?",
        "What is my membership status?",
      ],
      scope: "assistant",
      confirmation: null,
    });
  }

  private resolveAssistantLocale(preferredLocale?: string | null, query?: string) {
    if (preferredLocale === "bn") return "bn" as AssistantLocale;
    return /[\u0980-\u09FF]/.test(query ?? "") ? "bn" : ("en" as AssistantLocale);
  }

  private normalizeAssistantQuery(raw: string) {
    let normalized = raw.toLowerCase();
    const banglaPhraseMap: Array<[string, string]> = [
      ["আজ আমার কী করা উচিত", "what needs my attention today"],
      ["আজ কী করা উচিত", "what needs my attention today"],
      ["কি করা উচিত", "what should i do"],
      ["অপঠিত", "unread"],
      ["মেসেজ দিন", "message"],
      ["মেসেজ", "message"],
      ["বার্তা", "message"],
      ["কথোপকথন", "conversation"],
      ["ইনবক্স", "inbox"],
      ["মেম্বারশিপ", "membership"],
      ["সেভড সার্চ", "saved search"],
      ["সার্চ", "search"],
      ["ওয়েডিং", "wedding"],
      ["বিয়ে", "wedding"],
      ["ভেন্ডর", "vendor"],
      ["লিড", "lead"],
      ["প্রোফাইল", "profile"],
      ["রিভিউ", "review"],
      ["অনুমোদন", "approve"],
      ["অনুমোদিত", "approve"],
      ["বাতিল", "reject"],
      ["ছবি", "photo"],
      ["গেস্ট", "guest"],
      ["প্রজেক্ট", "project"],
      ["কন্টাক্ট", "contact"],
      ["আনলক", "unlock"],
      ["ইন্টারেস্ট", "interest"],
      ["ফেভারিট", "favorite"],
      ["ব্লক", "block"],
      ["ভেরিফিকেশন", "verification"],
      ["ইমেইল", "email"],
      ["সারাংশ", "summary"],
      ["কত", "how many"],
      ["বলুন", "tell"],
      ["পাঠান", "send"],
      ["দেখাও", "show"],
      ["দেখান", "show"],
      ["থামো", "stop"],
      ["বাতিল করুন", "cancel"],
      ["আবার বলুন", "repeat"],
    ];
    for (const [bangla, english] of banglaPhraseMap) {
      normalized = normalized.replaceAll(bangla.toLowerCase(), english);
    }
    return normalized;
  }

  private localizeAssistantAnswer(locale: AssistantLocale, answer: AssistantAnswer): AssistantAnswer {
    if (locale !== "bn") return answer;

    return {
      ...answer,
      answer: this.translateAssistantText(answer.answer),
      bullets: answer.bullets.map((bullet) => this.translateAssistantText(bullet)),
      suggestions: answer.suggestions.map((suggestion) => this.translateAssistantText(suggestion)),
      confirmation: answer.confirmation
        ? {
            ...answer.confirmation,
            label: this.translateAssistantText(answer.confirmation.label),
            prompt: this.translateAssistantText(answer.confirmation.prompt),
          }
        : answer.confirmation,
      choices: answer.choices?.map((choice) => ({
        ...choice,
        label: this.translateAssistantText(choice.label),
        query: choice.query ? this.translateAssistantText(choice.query) : choice.query,
        confirmation: choice.confirmation
          ? {
              ...choice.confirmation,
              label: this.translateAssistantText(choice.confirmation.label),
              prompt: this.translateAssistantText(choice.confirmation.prompt),
            }
          : choice.confirmation,
      })),
    };
  }

  private translateAssistantText(text: string) {
    const exactMap: Record<string, string> = {
      "What needs my attention today?": "আজ আমার কী বিষয়ে মনোযোগ দেওয়া দরকার?",
      "How many unread messages do I have?": "আমার কতটি অপঠিত মেসেজ আছে?",
      "What is my membership status?": "আমার মেম্বারশিপ স্ট্যাটাস কী?",
      "Summarize my wedding plan.": "আমার ওয়েডিং প্ল্যানের সারাংশ বলো।",
      "How many saved searches do I have?": "আমার কতটি সেভড সার্চ আছে?",
      "How many leads do I have?": "আমার কতটি লিড আছে?",
      "What is my billing status?": "আমার বিলিং স্ট্যাটাস কী?",
      "How many profiles are pending review?": "কতটি প্রোফাইল রিভিউয়ের অপেক্ষায় আছে?",
      "How many manual payments need review?": "কতটি ম্যানুয়াল পেমেন্ট রিভিউ দরকার?",
      "Confirm send message": "মেসেজ পাঠানো নিশ্চিত করুন",
      "Confirm create conversation": "কনভারসেশন খোলা নিশ্চিত করুন",
      "Confirm save search": "সার্চ সেভ করা নিশ্চিত করুন",
      "Confirm create project": "প্রজেক্ট তৈরি নিশ্চিত করুন",
      "Confirm shortlist vendor": "ভেন্ডর শর্টলিস্ট নিশ্চিত করুন",
      "Confirm submit for review": "রিভিউতে পাঠানো নিশ্চিত করুন",
      "Confirm add wedding guest": "ওয়েডিং গেস্ট যোগ করা নিশ্চিত করুন",
      "Confirm admin action": "অ্যাডমিন অ্যাকশন নিশ্চিত করুন",
      "Confirm vendor action": "ভেন্ডর অ্যাকশন নিশ্চিত করুন",
      "Cancel": "বাতিল",
      "Pick one of the matches below.": "নিচের মিলগুলোর মধ্যে একটি বেছে নিন।",
      "Pick one of the members below.": "নিচের মেম্বারদের মধ্যে একজন বেছে নিন।",
      "Pick a vendor below.": "নিচ থেকে একটি ভেন্ডর বেছে নিন।",
      "Pick a wedding project below.": "নিচ থেকে একটি ওয়েডিং প্রজেক্ট বেছে নিন।",
      "Pick a profile below.": "নিচ থেকে একটি প্রোফাইল বেছে নিন।",
      "Pick a photo below.": "নিচ থেকে একটি ছবি বেছে নিন।",
      "Pick a lead below.": "নিচ থেকে একটি লিড বেছে নিন।",
      "Send message": "মেসেজ পাঠান",
      "Create direct conversation": "ডাইরেক্ট কনভারসেশন খুলুন",
      "Shortlist vendor": "ভেন্ডর শর্টলিস্ট করুন",
      "Save search": "সার্চ সেভ করুন",
      "Create wedding project": "ওয়েডিং প্রজেক্ট তৈরি করুন",
      "Submit profile for review": "প্রোফাইল রিভিউতে পাঠান",
      "Send interest": "ইন্টারেস্ট পাঠান",
      "Add favorite": "ফেভারিটে যোগ করুন",
      "Block member": "মেম্বার ব্লক করুন",
      "Unlock contact": "কন্টাক্ট আনলক করুন",
      "Request photo access": "ফটো অ্যাক্সেস অনুরোধ করুন",
      "Add wedding guest": "ওয়েডিং গেস্ট যোগ করুন",
      "Approve profile": "প্রোফাইল অনুমোদন করুন",
      "Reject profile": "প্রোফাইল বাতিল করুন",
      "Approve manual payment": "ম্যানুয়াল পেমেন্ট অনুমোদন করুন",
      "Reject manual payment": "ম্যানুয়াল পেমেন্ট বাতিল করুন",
      "Approve photo": "ছবি অনুমোদন করুন",
      "Reject photo": "ছবি বাতিল করুন",
      "Mark open": "ওপেন করুন",
      "Mark responded": "রেসপন্ডেড করুন",
      "Mark booked": "বুকড করুন",
      "Mark closed rejected": "ক্লোজড রিজেক্টেড করুন",
    };
    if (exactMap[text]) return exactMap[text];

    const phraseMap: Array<[RegExp, string]> = [
      [/^Done\./g, "সম্পন্ন।"],
      [/^I can /g, "আমি পারি "],
      [/^I found /g, "আমি খুঁজে পেয়েছি "],
      [/^I could not find /g, "আমি খুঁজে পাইনি "],
      [/^You have /g, "আপনার আছে "],
      [/^There are /g, "এখন আছে "],
      [/^Your /g, "আপনার "],
      [/^Okay, I canceled that assistant step\./g, "ঠিক আছে, আমি ওই অ্যাসিস্ট্যান্ট ধাপটি বাতিল করেছি।"],
      [/^Nothing was changed\./g, "কিছুই পরিবর্তন করা হয়নি।"],
      [/unread conversation/g, "অপঠিত কনভারসেশন"],
      [/unread messages?/g, "অপঠিত মেসেজ"],
      [/saved search/g, "সেভড সার্চ"],
      [/wedding project/g, "ওয়েডিং প্রজেক্ট"],
      [/pending review/g, "রিভিউয়ের অপেক্ষায়"],
      [/manual payment/g, "ম্যানুয়াল পেমেন্ট"],
      [/billing status/g, "বিলিং স্ট্যাটাস"],
      [/profile/g, "প্রোফাইল"],
      [/member/g, "মেম্বার"],
      [/vendor/g, "ভেন্ডর"],
      [/lead/g, "লিড"],
      [/photo/g, "ছবি"],
      [/conversation/g, "কনভারসেশন"],
      [/message/g, "মেসেজ"],
    ];

    let output = text;
    for (const [pattern, replacement] of phraseMap) {
      output = output.replace(pattern, replacement);
    }
    return output;
  }

  private matches(normalized: string, phrases: string[]) {
    return phrases.some((phrase) => normalized.includes(phrase));
  }

  private ordinalIndex(normalized: string) {
    if (/\b(first|1st|one|1)\b/.test(normalized)) return 0;
    if (/\b(second|2nd|two|2)\b/.test(normalized)) return 1;
    if (/\b(third|3rd|three|3)\b/.test(normalized)) return 2;
    if (/\b(fourth|4th|four|4)\b/.test(normalized)) return 3;
    if (/\b(fifth|5th|five|5)\b/.test(normalized)) return 4;
    return null;
  }

  private async handleContextualFollowUp(
    actor: AuthActor,
    query: string,
    normalized: string,
    context?: AssistantQueryContext,
  ): Promise<AssistantAnswer | null> {
    const lastResponse = context?.lastResponse;
    if (!lastResponse) return null;
    const lastConfirmation = lastResponse.confirmation ?? null;

    if (this.matches(normalized, ["cancel", "never mind", "stop", "forget it"])) {
      return {
        answer: "Okay, I canceled that assistant step.",
        bullets: ["Nothing was changed."],
        suggestions: lastResponse.suggestions?.length
          ? lastResponse.suggestions
          : ["What needs my attention today?"],
        scope: "assistant",
        confirmation: null,
      };
    }

    if (this.matches(normalized, ["repeat", "say that again", "repeat that"])) {
      return {
        ...lastResponse,
        suggestions: lastResponse.suggestions?.length
          ? lastResponse.suggestions
          : ["What needs my attention today?"],
        confirmation: lastResponse.confirmation ?? null,
      };
    }

    if (this.matches(normalized, ["show me more", "more detail", "more details"])) {
      return {
        answer: `Here is more detail on ${lastResponse.scope.replace(/_/g, " ")}.`,
        bullets: lastResponse.bullets?.length
          ? lastResponse.bullets
          : [lastResponse.answer],
        suggestions: lastResponse.suggestions?.length
          ? lastResponse.suggestions
          : ["What needs my attention today?"],
        scope: lastResponse.scope,
        confirmation: lastResponse.confirmation ?? null,
        choices: lastResponse.choices,
      };
    }

    if (
      lastConfirmation &&
      this.matches(normalized, ["yes", "confirm", "do it", "go ahead", "ok", "okay", "proceed"])
    ) {
      return this.executeConfirmedAction(
        actor,
        lastConfirmation.type,
        lastConfirmation.payload ?? {},
        query,
      );
    }

    if (lastResponse.choices?.length) {
      const loweredQuery = normalized.toLowerCase();
      const index = this.ordinalIndex(normalized);
      if (index != null && lastResponse.choices[index]) {
        const choice = lastResponse.choices[index];
        if (choice.confirmation) {
          return this.executeConfirmedAction(
            actor,
            choice.confirmation.type,
            choice.confirmation.payload ?? {},
            query,
          );
        }
        if (choice.query) {
          return this.query(actor, {
            query: choice.query,
            mode: "voice-ready",
          });
        }
      }

      const labelMatchedChoice = lastResponse.choices.find((choice) =>
        choice.label
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((token) => token.length >= 3)
          .some((token) => loweredQuery.includes(token)),
      );
      if (labelMatchedChoice) {
        if (labelMatchedChoice.confirmation) {
          return this.executeConfirmedAction(
            actor,
            labelMatchedChoice.confirmation.type,
            labelMatchedChoice.confirmation.payload ?? {},
            query,
          );
        }
        if (labelMatchedChoice.query) {
          return this.query(actor, {
            query: labelMatchedChoice.query,
            mode: "voice-ready",
          });
        }
      }
    }

    const pronounMessageIntent = this.parseMessageIntent(query);
    if (
      pronounMessageIntent?.useLastTarget &&
      lastConfirmation?.payload &&
      typeof lastConfirmation.payload.targetMemberProfileId === "string"
    ) {
      const targetMemberProfileId = String(lastConfirmation.payload.targetMemberProfileId);
      const targetLabel =
        typeof lastConfirmation.payload.targetLabel === "string" && lastConfirmation.payload.targetLabel
          ? String(lastConfirmation.payload.targetLabel)
          : "that member";
      return {
        answer: `I can send that message to ${targetLabel}.`,
        bullets: [`Message: "${pronounMessageIntent.body}".`],
        suggestions: ["Confirm send message", "Cancel"],
        scope: "mailbox_action",
        confirmation: {
          type: "send_direct_message",
          payload: {
            targetMemberProfileId,
            targetLabel,
            body: pronounMessageIntent.body,
          },
          label: "Send message",
          prompt: `Send "${pronounMessageIntent.body}" to ${targetLabel}?`,
        },
      };
    }

    return null;
  }

  private sanitizeName(raw: string) {
    return raw
      .replace(/\b(start|open|create|send|message|conversation|chat|with|to|please|for|about)\b/gi, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private parseMessageIntent(raw: string) {
    const cleaned = raw.trim();
    const patterns = [
      /^(?:message|text|tell|send message to|send a message to)\s+(.+?)\s+(?:that\s+)?(.+)$/i,
      /^(?:message|text|tell)\s+(.+?)[:,-]\s*(.+)$/i,
      /^(?:মেসেজ|বার্তা|বলুন|টেক্সট)\s+(.+?)\s+(?:যে\s+)?(.+)$/i,
    ];
    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        return {
          target: this.sanitizeName(match[1] || ""),
          body: (match[2] || "").trim(),
          useLastTarget: false,
        };
      }
    }

    const pronounMatch = cleaned.match(/^(?:message|text|tell|reply to|মেসেজ|বার্তা|বলুন|টেক্সট)\s+(them|her|him|তাকে|তাদের)\s+(?:that|যে)?\s*(.+)$/i);
    if (pronounMatch) {
      return {
        target: "",
        body: (pronounMatch[2] || "").trim(),
        useLastTarget: true,
      };
    }

    return null;
  }

  private parseSavedSearchCriteria(raw: string) {
    const criteria: Record<string, unknown> = {
      source: "assistant",
      rawQuery: raw,
    };
    const normalized = raw.toLowerCase();

    const ageRange = normalized.match(/(\d{2})\s*(?:to|-)\s*(\d{2})/);
    if (ageRange) {
      criteria.ageMin = Number(ageRange[1]);
      criteria.ageMax = Number(ageRange[2]);
    }

    const religionMatch = raw.match(/\b(muslim|hindu|christian|buddhist)\b/i);
    if (religionMatch) criteria.religion = religionMatch[1];

    const countryMatch = raw.match(/\b(in|from|country)\s+([A-Za-z ]{3,40})$/i);
    if (countryMatch) criteria.currentCountryCode = countryMatch[2].trim();

    const professionMatch = raw.match(/\bdoctor|engineer|teacher|banker|software|developer|business\b/i);
    if (professionMatch) criteria.profession = professionMatch[0];

    if (normalized.includes("with photo") || normalized.includes("has photo")) {
      criteria.hasPhoto = true;
    }

    return criteria;
  }

  private parseWeddingProjectDraft(raw: string) {
    const cleaned = raw
      .replace(/^(create|start|new)\s+wedding\s+project/gi, "")
      .replace(/^(called|named)\s+/gi, "")
      .trim();

    const title = cleaned.split(/\b(on|in|for)\b/i)[0]?.trim() || "Wedding Project";
    const cityMatch = raw.match(/\bin\s+([A-Za-z ]{2,40})(?:\s+for|\s+on|$)/i);
    const guestMatch = raw.match(/\bfor\s+(\d{1,4})\s+(?:guests|people)\b/i);
    const isoDate = raw.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    const budgetMatch = raw.match(/\b(low|medium|premium|luxury|budget)\b/i);

    return {
      title,
      city: cityMatch?.[1]?.trim(),
      guestTarget: guestMatch ? Number(guestMatch[1]) : undefined,
      weddingDate: isoDate?.[1],
      budgetBand: budgetMatch?.[1]?.toUpperCase(),
    };
  }

  private parseWeddingGuestDraft(raw: string) {
    const cleaned = raw
      .replace(/^(add|create)\s+(a\s+)?(wedding\s+)?guest/gi, "")
      .trim();
    const guestName = cleaned.split(/\b(to|for|on|in)\b/i)[0]?.trim() || "Wedding Guest";
    const countMatch = raw.match(/\b(\d{1,3})\s+(?:guests|people)\b/i);
    return {
      guestName,
      guestCount: countMatch ? Number(countMatch[1]) : 1,
    };
  }

  private parseGenderHint(normalized: string): "MALE" | "FEMALE" | null {
    if (/\b(female|woman|girl|lady|bride)\b/i.test(normalized)) return "FEMALE";
    if (/\b(male|man|boy|groom)\b/i.test(normalized)) return "MALE";
    return null;
  }

  private parseManagedMemberDraft(raw: string) {
    const normalized = raw.toLowerCase();
    const cleaned = raw
      .replace(/^(create|add|new)\s+(a\s+)?managed\s+member/gi, "")
      .replace(/^(named|called)\s+/gi, "")
      .trim();
    const nameChunk = cleaned.split(/\b(female|male|looking for|phone|email|in)\b/i)[0]?.trim() || "";
    const [firstName = "", ...lastParts] = nameChunk.split(/\s+/).filter(Boolean);
    const lastName = lastParts.join(" ") || undefined;
    const gender = this.parseGenderHint(normalized);
    const lookingForMatch = normalized.match(/\blooking\s+for\s+(male|female|man|woman|boy|girl)\b/);
    let lookingFor = this.parseGenderHint(lookingForMatch?.[0] ?? "");
    if (!lookingFor && gender) {
      lookingFor = gender === "FEMALE" ? "MALE" : "FEMALE";
    }
    const email = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    const phone = raw.match(/(?:\+?\d[\d\s()-]{6,}\d)/)?.[0]?.trim();
    const country = raw.match(/\b(?:in|from)\s+([A-Za-z]{2,3})\b/i)?.[1]?.toUpperCase();

    return {
      firstName,
      lastName,
      gender,
      lookingFor,
      memberEmail: email,
      memberPhone: phone,
      currentCountryCode: country,
    };
  }

  private parseCreditsAmount(raw: string) {
    const amount = raw.match(/\b(\d{1,5})\b/);
    return amount ? Number(amount[1]) : null;
  }

  private async findMemberCandidates(
    actor: AuthActor,
    rawQuery: string,
  ) {
    const targetName = this.sanitizeName(rawQuery);
    if (!targetName) return [];
    return this.prisma.memberProfile.findMany({
      where: {
        id: { not: actor.memberProfileId! },
        OR: [
          { displayName: { contains: targetName, mode: "insensitive" } },
          { firstName: { contains: targetName, mode: "insensitive" } },
          { displayId: { contains: targetName, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        displayId: true,
        currentCity: true,
        currentCountryCode: true,
      },
      take: 5,
    });
  }

  private async planMemberAction(
    actor: AuthActor,
    query: string,
    normalized: string,
  ): Promise<AssistantAnswer | null> {
    if (this.matches(normalized, ["resend verification", "send verification", "verify my email"])) {
      return {
        answer: "I can resend your verification email.",
        bullets: ["This will send a fresh verification link to your account email address."],
        suggestions: ["Confirm resend verification", "How many unread messages do I have?"],
        scope: "member_action",
        confirmation: {
          type: "resend_verification",
          payload: {},
          label: "Resend verification email",
          prompt: "Send a new verification email to your account address?",
        },
      };
    }

    const messageIntent = this.parseMessageIntent(query);

    if (
      messageIntent ||
      this.matches(normalized, [
        "message ",
        "start conversation",
        "open conversation",
        "chat with",
        "send message to",
      ])
    ) {
      const targetName = messageIntent?.target || this.sanitizeName(query);
      if (!targetName) {
        return {
          answer: "Tell me who you want to message.",
          bullets: ["Try something like: message Ayesha Rahman."],
          suggestions: ["How many unread messages do I have?", "What needs my attention today?"],
          scope: "mailbox_action",
          confirmation: null,
        };
      }

      const candidates = await this.findMemberCandidates(actor, targetName);

      if (!candidates.length) {
        return {
          answer: `I could not find a member matching "${targetName}".`,
          bullets: [],
          suggestions: ["How many unread messages do I have?", "What needs my attention today?"],
          scope: "mailbox_action",
          confirmation: null,
        };
      }

      if (candidates.length > 1) {
        return {
          answer: `I found multiple members matching "${targetName}".`,
          bullets: candidates.map((candidate) => {
            const location = [candidate.currentCity, candidate.currentCountryCode].filter(Boolean).join(", ");
            return `${candidate.displayName} (${candidate.displayId})${location ? ` in ${location}` : ""}`;
          }),
          suggestions: ["Pick one of the matches below.", "How many unread messages do I have?"],
          scope: "mailbox_action",
          confirmation: null,
          choices: candidates.map((candidate) => ({
            label: `${candidate.displayName} (${candidate.displayId})`,
            confirmation: {
              type: messageIntent?.body ? "send_direct_message" : "create_direct_conversation",
              payload: {
                targetMemberProfileId: candidate.id,
                targetLabel: `${candidate.displayName} (${candidate.displayId})`,
                ...(messageIntent?.body ? { body: messageIntent.body } : {}),
              },
              label: messageIntent?.body ? "Send message" : "Create direct conversation",
              prompt: messageIntent?.body
                ? `Send "${messageIntent.body}" to ${candidate.displayName}?`
                : `Open a direct conversation with ${candidate.displayName}?`,
            },
          })),
        };
      }

      const match = candidates[0];
      return {
        answer: `I found ${match.displayName} (${match.displayId}).`,
        bullets: [
          messageIntent?.body
            ? `I can send this message: "${messageIntent.body}".`
            : "I can open or create a direct conversation with this member.",
        ],
        suggestions: [messageIntent?.body ? "Confirm send message" : "Confirm create conversation", "How many unread messages do I have?"],
        scope: "mailbox_action",
        confirmation: {
          type: messageIntent?.body ? "send_direct_message" : "create_direct_conversation",
          payload: {
            targetMemberProfileId: match.id,
            targetLabel: `${match.displayName} (${match.displayId})`,
            ...(messageIntent?.body ? { body: messageIntent.body } : {}),
          },
          label: messageIntent?.body ? "Send message" : "Create direct conversation",
          prompt: messageIntent?.body
            ? `Send "${messageIntent.body}" to ${match.displayName}?`
            : `Open a direct conversation with ${match.displayName}?`,
        },
      };
    }

    if (this.matches(normalized, ["shortlist vendor", "add vendor", "save vendor", "shortlist "])) {
      const vendorCandidates = await this.findVendorCandidates(actor.memberProfileId!, query);
      if (!vendorCandidates.length) {
        return {
          answer: "I could not find a vendor matching that request.",
          bullets: ["Try using the vendor business name."],
          suggestions: ["Summarize my wedding plan.", "What needs my attention today?"],
          scope: "wedding_action",
          confirmation: null,
        };
      }

      if (vendorCandidates.length > 1) {
        const projects = await this.prisma.weddingProject.findMany({
          where: { memberProfileId: actor.memberProfileId! },
          select: { id: true, title: true },
          orderBy: [{ weddingDate: "asc" }, { createdAt: "desc" }],
          take: 5,
        });
        return {
          answer: "I found multiple vendor matches.",
          bullets: vendorCandidates.map((candidate) => `${candidate.businessName}${candidate.categoryName ? ` (${candidate.categoryName})` : ""}`),
          suggestions: ["Pick a vendor below.", "Summarize my wedding plan."],
          scope: "wedding_action",
          confirmation: null,
          choices:
            projects.length === 1
              ? vendorCandidates.map((candidate) => ({
                  label: `${candidate.businessName}${candidate.categoryName ? ` (${candidate.categoryName})` : ""}`,
                  confirmation: {
                    type: "shortlist_vendor",
                    payload: {
                      weddingProjectId: projects[0].id,
                      weddingProjectTitle: projects[0].title,
                      vendorProfileId: candidate.id,
                      vendorLabel: candidate.businessName,
                    },
                    label: "Shortlist vendor",
                    prompt: `Add ${candidate.businessName} to "${projects[0].title}"?`,
                  },
                }))
              : [],
        };
      }

      const projects = await this.prisma.weddingProject.findMany({
        where: { memberProfileId: actor.memberProfileId! },
        select: { id: true, title: true },
        orderBy: [{ weddingDate: "asc" }, { createdAt: "desc" }],
        take: 5,
      });

      if (!projects.length) {
        return {
          answer: "You do not have a wedding project yet.",
          bullets: ["Create a wedding project before shortlisting vendors."],
          suggestions: ["Summarize my wedding plan.", "What needs my attention today?"],
          scope: "wedding_action",
          confirmation: null,
        };
      }

      if (projects.length > 1) {
        return {
          answer: `I found ${vendorCandidates[0].businessName}, but you have multiple wedding projects.`,
          bullets: projects.map((project) => project.title),
          suggestions: ["Pick a wedding project below.", "Summarize my wedding plan."],
          scope: "wedding_action",
          confirmation: null,
          choices: projects.map((project) => ({
            label: project.title,
            confirmation: {
              type: "shortlist_vendor",
              payload: {
                weddingProjectId: project.id,
                weddingProjectTitle: project.title,
                vendorProfileId: vendorCandidates[0].id,
                vendorLabel: vendorCandidates[0].businessName,
              },
              label: "Shortlist vendor",
              prompt: `Add ${vendorCandidates[0].businessName} to "${project.title}"?`,
            },
          })),
        };
      }

      const vendor = vendorCandidates[0];
      const project = projects[0];
      return {
        answer: `I found ${vendor.businessName} and your project "${project.title}".`,
        bullets: ["I can add this vendor to your shortlist."],
        suggestions: ["Confirm shortlist vendor", "Summarize my wedding plan."],
        scope: "wedding_action",
        confirmation: {
          type: "shortlist_vendor",
          payload: {
            weddingProjectId: project.id,
            weddingProjectTitle: project.title,
            vendorProfileId: vendor.id,
            vendorLabel: vendor.businessName,
          },
          label: "Shortlist vendor",
          prompt: `Add ${vendor.businessName} to "${project.title}"?`,
        },
      };
    }

    if (this.matches(normalized, ["save search", "create saved search", "save this search"])) {
      const name = query
        .replace(/^(save|create)\s+(this\s+)?search/gi, "")
        .replace(/^(called|named)\s+/gi, "")
        .trim() || "Assistant search";
      const criteriaJson = this.parseSavedSearchCriteria(query);
      return {
        answer: `I can save a search named "${name}".`,
        bullets: ["I parsed the request into search criteria and will save it with alerts enabled."],
        suggestions: ["Confirm save search", "How many saved searches do I have?"],
        scope: "saved_search_action",
        confirmation: {
          type: "create_saved_search",
          payload: {
            name,
            criteriaJson,
            alertEnabled: true,
          },
          label: "Save search",
          prompt: `Save a new search called "${name}"?`,
        },
      };
    }

    if (this.matches(normalized, ["create wedding project", "start wedding project", "new wedding project"])) {
      const draft = this.parseWeddingProjectDraft(query);
      return {
        answer: `I can create a wedding project named "${draft.title}".`,
        bullets: [
          draft.city ? `City: ${draft.city}.` : "City was not clearly detected.",
          draft.guestTarget ? `Guest target: ${draft.guestTarget}.` : "Guest target was not clearly detected.",
          draft.weddingDate ? `Date: ${draft.weddingDate}.` : "Date was not clearly detected.",
        ],
        suggestions: ["Confirm create project", "Summarize my wedding plan."],
        scope: "wedding_action",
        confirmation: {
          type: "create_wedding_project",
          payload: draft,
          label: "Create wedding project",
          prompt: `Create the wedding project "${draft.title}"?`,
        },
      };
    }

    if (this.matches(normalized, ["submit my profile for review", "submit profile for review", "submit for review"])) {
      return {
        answer: "I can submit your profile for review.",
        bullets: ["This will move your profile into the pending review workflow if it is complete enough."],
        suggestions: ["Confirm submit for review", "What needs my attention today?"],
        scope: "member_action",
        confirmation: {
          type: "submit_profile_for_review",
          payload: {},
          label: "Submit profile for review",
          prompt: "Submit your profile for review now?",
        },
      };
    }

    const memberActionDefinitions: Array<{
      phrases: string[];
      type:
        | "send_interest"
        | "add_favorite"
        | "block_member"
        | "unlock_contact"
        | "request_photo_access";
      label: string;
      promptBuilder: (name: string) => string;
    }> = [
      {
        phrases: ["send interest to", "interest ", "send an interest"],
        type: "send_interest",
        label: "Send interest",
        promptBuilder: (name) => `Send an interest to ${name}?`,
      },
      {
        phrases: ["favorite ", "add favorite", "save favorite"],
        type: "add_favorite",
        label: "Add favorite",
        promptBuilder: (name) => `Add ${name} to your favorites?`,
      },
      {
        phrases: ["block ", "block member", "hide member"],
        type: "block_member",
        label: "Block member",
        promptBuilder: (name) => `Block ${name}?`,
      },
      {
        phrases: ["unlock contact", "unlock details", "view contact"],
        type: "unlock_contact",
        label: "Unlock contact",
        promptBuilder: (name) => `Unlock contact details for ${name}?`,
      },
      {
        phrases: ["request photo", "photo request", "request private photo"],
        type: "request_photo_access",
        label: "Request photo access",
        promptBuilder: (name) => `Request photo access from ${name}?`,
      },
    ];

    const matchedMemberAction = memberActionDefinitions.find((item) =>
      this.matches(normalized, item.phrases),
    );
    if (matchedMemberAction) {
      const candidates = await this.findMemberCandidates(actor, query);
      if (!candidates.length) {
        return {
          answer: "I could not find a matching member for that action.",
          bullets: [],
          suggestions: ["Try the member display ID or full display name.", "What needs my attention today?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      if (candidates.length > 1) {
        return {
          answer: "I found multiple matching members.",
          bullets: candidates.map((candidate) => {
            const location = [candidate.currentCity, candidate.currentCountryCode].filter(Boolean).join(", ");
            return `${candidate.displayName} (${candidate.displayId})${location ? ` in ${location}` : ""}`;
          }),
          suggestions: ["Pick one of the members below."],
          scope: "member_action",
          confirmation: null,
          choices: candidates.map((candidate) => ({
            label: `${candidate.displayName} (${candidate.displayId})`,
            confirmation: {
              type: matchedMemberAction.type,
              payload: {
                targetMemberProfileId: candidate.id,
                targetLabel: `${candidate.displayName} (${candidate.displayId})`,
              },
              label: matchedMemberAction.label,
              prompt: matchedMemberAction.promptBuilder(candidate.displayName || candidate.displayId || "that member"),
            },
          })),
        };
      }

      const match = candidates[0];
      return {
        answer: `I found ${match.displayName} (${match.displayId}).`,
        bullets: [],
        suggestions: [`Confirm ${matchedMemberAction.label.toLowerCase()}`],
        scope: "member_action",
        confirmation: {
          type: matchedMemberAction.type,
          payload: {
            targetMemberProfileId: match.id,
            targetLabel: `${match.displayName} (${match.displayId})`,
          },
          label: matchedMemberAction.label,
          prompt: matchedMemberAction.promptBuilder(match.displayName || match.displayId || "that member"),
        },
      };
    }

    if (this.matches(normalized, ["add wedding guest", "create wedding guest", "add guest"])) {
      const draft = this.parseWeddingGuestDraft(query);
      const projects = await this.prisma.weddingProject.findMany({
        where: { memberProfileId: actor.memberProfileId! },
        select: { id: true, title: true },
        orderBy: [{ weddingDate: "asc" }, { createdAt: "desc" }],
        take: 5,
      });
      if (!projects.length) {
        return {
          answer: "You do not have a wedding project yet.",
          bullets: ["Create a wedding project before adding guests."],
          suggestions: ["Create wedding project", "Summarize my wedding plan."],
          scope: "wedding_action",
          confirmation: null,
        };
      }
      if (projects.length > 1) {
        return {
          answer: `I can add ${draft.guestName} as a wedding guest, but you have multiple wedding projects.`,
          bullets: projects.map((project) => project.title),
          suggestions: ["Pick a wedding project below."],
          scope: "wedding_action",
          confirmation: null,
          choices: projects.map((project) => ({
            label: project.title,
            confirmation: {
              type: "add_wedding_guest",
              payload: {
                weddingProjectId: project.id,
                weddingProjectTitle: project.title,
                guestName: draft.guestName,
                guestCount: draft.guestCount,
              },
              label: "Add wedding guest",
              prompt: `Add ${draft.guestName} to "${project.title}"?`,
            },
          })),
        };
      }
      return {
        answer: `I can add ${draft.guestName} to "${projects[0].title}".`,
        bullets: [`Guest count: ${draft.guestCount}.`],
        suggestions: ["Confirm add wedding guest", "Summarize my wedding plan."],
        scope: "wedding_action",
        confirmation: {
          type: "add_wedding_guest",
          payload: {
            weddingProjectId: projects[0].id,
            weddingProjectTitle: projects[0].title,
            guestName: draft.guestName,
            guestCount: draft.guestCount,
          },
          label: "Add wedding guest",
          prompt: `Add ${draft.guestName} to "${projects[0].title}"?`,
        },
      };
    }

    return null;
  }

  private async planGhotokAction(
    actor: AuthActor,
    query: string,
    normalized: string,
  ): Promise<AssistantAnswer | null> {
    if (this.matches(normalized, ["stop impersonation", "end impersonation", "close impersonation"])) {
      const active = await this.ghotokService.getActiveImpersonation(actor.userId);
      if (!active) {
        return {
          answer: "You do not have an active impersonation session right now.",
          bullets: [],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      const targetLabel = `${active.memberProfile?.displayName || active.memberProfile?.firstName || "that member"} (${active.memberProfile?.displayId || ""})`.trim();
      return {
        answer: `I can end your impersonation session for ${targetLabel}.`,
        bullets: [],
        suggestions: ["Confirm end impersonation", "How many members am I managing?"],
        scope: "ghotok_action",
        confirmation: {
          type: "end_ghotok_impersonation",
          payload: {
            sessionId: active.id,
            targetLabel,
          },
          label: "End impersonation",
          prompt: `End the active impersonation session for ${targetLabel}?`,
        },
      };
    }

    if (this.matches(normalized, ["start impersonation", "impersonate ", "log in as member", "act as member"])) {
      const target = this.sanitizeName(query);
      const managedMembers = await this.ghotokService.listManagedMembers(actor.userId);
      const candidates = managedMembers.filter((member) => {
        const label = [member.displayName, member.firstName, member.lastName, member.displayId].filter(Boolean).join(" ").toLowerCase();
        return !target || label.includes(target.toLowerCase());
      });
      if (!candidates.length) {
        return {
          answer: target
            ? `I could not find a managed member matching "${target}".`
            : "You do not have any managed members available for impersonation.",
          bullets: [],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      if (candidates.length > 1) {
        return {
          answer: `I found multiple managed members matching "${target}".`,
          bullets: candidates.map((member) => `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`),
          suggestions: ["Pick one of the matches below."],
          scope: "ghotok_action",
          confirmation: null,
          choices: candidates.slice(0, 5).map((member) => ({
            label: `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`,
            confirmation: {
              type: "start_ghotok_impersonation",
              payload: {
                memberProfileId: member.id,
                targetLabel: `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`,
              },
              label: "Start impersonation",
              prompt: `Start impersonation for ${member.displayName || member.firstName}?`,
            },
          })),
        };
      }
      const member = candidates[0];
      return {
        answer: `I found ${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId}).`,
        bullets: ["I can start an impersonation session for this managed member."],
        suggestions: ["Confirm start impersonation", "How many members am I managing?"],
        scope: "ghotok_action",
        confirmation: {
          type: "start_ghotok_impersonation",
          payload: {
            memberProfileId: member.id,
            targetLabel: `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`,
          },
          label: "Start impersonation",
          prompt: `Start impersonation for ${member.displayName || member.firstName}?`,
        },
      };
    }

    if (this.matches(normalized, ["link member", "assign member", "manage member"])) {
      const target = this.sanitizeName(query);
      const candidates = (await this.ghotokService.searchAllMembers(actor.userId, target)).filter((member) => !member.managedByGhotokId);
      if (!candidates.length) {
        return {
          answer: target
            ? `I could not find an available member matching "${target}".`
            : "I could not find any unassigned members to link.",
          bullets: [],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      if (candidates.length > 1) {
        return {
          answer: `I found multiple linkable members matching "${target}".`,
          bullets: candidates.map((member) => `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`),
          suggestions: ["Pick one of the matches below."],
          scope: "ghotok_action",
          confirmation: null,
          choices: candidates.slice(0, 5).map((member) => ({
            label: `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`,
            confirmation: {
              type: "link_ghotok_member",
              payload: {
                memberProfileId: member.id,
                targetLabel: `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`,
              },
              label: "Link member",
              prompt: `Link ${member.displayName || member.firstName} to your managed member list?`,
            },
          })),
        };
      }
      const member = candidates[0];
      return {
        answer: `I found ${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId}).`,
        bullets: ["I can link this member to your managed member list."],
        suggestions: ["Confirm link member", "How many members am I managing?"],
        scope: "ghotok_action",
        confirmation: {
          type: "link_ghotok_member",
          payload: {
            memberProfileId: member.id,
            targetLabel: `${member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ")} (${member.displayId})`,
          },
          label: "Link member",
          prompt: `Link ${member.displayName || member.firstName} to your managed member list?`,
        },
      };
    }

    if (this.matches(normalized, ["create managed member", "add managed member", "new managed member"])) {
      const draft = this.parseManagedMemberDraft(query);
      if (!draft.firstName || !draft.gender || !draft.lookingFor) {
        return {
          answer: "I need at least a first name, gender, and looking-for gender to create a managed member.",
          bullets: ["Try: create managed member Nabila Islam, female looking for male."],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      const fullName = [draft.firstName, draft.lastName].filter(Boolean).join(" ");
      return {
        answer: `I can create a managed member named ${fullName}.`,
        bullets: [
          `Gender: ${draft.gender.toLowerCase()}.`,
          `Looking for: ${draft.lookingFor.toLowerCase()}.`,
          draft.memberEmail ? `Email: ${draft.memberEmail}.` : "Email was not provided.",
        ],
        suggestions: ["Confirm create managed member", "How many members am I managing?"],
        scope: "ghotok_action",
        confirmation: {
          type: "create_ghotok_managed_member",
          payload: draft as unknown as Record<string, unknown>,
          label: "Create managed member",
          prompt: `Create managed member ${fullName}?`,
        },
      };
    }

    return null;
  }

  private async planAdminAction(
    actor: AuthActor,
    query: string,
    normalized: string,
  ): Promise<AssistantAnswer | null> {
    if (actor.roles.includes(RoleKey.SUPER_ADMIN)) {
      const superAdminAction = await this.planSuperAdminAction(actor, query, normalized);
      if (superAdminAction) return superAdminAction;
    }

    if (this.matches(normalized, ["approve profile", "reject profile"])) {
      const action = normalized.includes("reject") ? "reject_profile" : "approve_profile";
      const target = this.sanitizeName(query);
      const profiles = await this.prisma.memberProfile.findMany({
        where: {
          OR: [
            { displayName: { contains: target, mode: "insensitive" } },
            { displayId: { contains: target, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          displayName: true,
          displayId: true,
          approvalStatus: true,
        },
        take: 5,
      });
      if (!profiles.length) {
        return {
          answer: `I could not find a profile matching "${target}".`,
          bullets: [],
          suggestions: ["How many profiles are pending review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      if (profiles.length > 1) {
        return {
          answer: `I found multiple profiles matching "${target}".`,
          bullets: profiles.map((profile) => `${profile.displayName} (${profile.displayId}) - ${profile.approvalStatus.toLowerCase()}`),
          suggestions: ["Pick a profile below.", "How many profiles are pending review?"],
          scope: "admin_action",
          confirmation: null,
          choices: profiles.map((profile) => ({
            label: `${profile.displayName} (${profile.displayId})`,
            confirmation: {
              type: action,
              payload: {
                memberProfileId: profile.id,
                targetLabel: `${profile.displayName} (${profile.displayId})`,
              },
              label: action === "reject_profile" ? "Reject profile" : "Approve profile",
              prompt:
                action === "reject_profile"
                  ? `Reject ${profile.displayName}'s profile?`
                  : `Approve ${profile.displayName}'s profile?`,
            },
          })),
        };
      }
      const profile = profiles[0];
      return {
        answer: `I found ${profile.displayName} (${profile.displayId}).`,
        bullets: [`Current approval status: ${profile.approvalStatus.toLowerCase()}.`],
        suggestions: ["Confirm admin action", "How many profiles are pending review?"],
        scope: "admin_action",
        confirmation: {
          type: action,
          payload: {
            memberProfileId: profile.id,
            targetLabel: `${profile.displayName} (${profile.displayId})`,
          },
          label: action === "reject_profile" ? "Reject profile" : "Approve profile",
          prompt:
            action === "reject_profile"
              ? `Reject ${profile.displayName}'s profile?`
              : `Approve ${profile.displayName}'s profile?`,
        },
      };
    }

    if (this.matches(normalized, ["approve payment", "reject payment", "manual payment"])) {
      const payments = await this.prisma.payment.findMany({
        where: { status: PaymentStatus.MANUAL_REVIEW },
        select: {
          id: true,
          finalAmount: true,
          currency: true,
          user: { select: { email: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
      if (!payments.length) {
        return {
          answer: "There are no manual payments waiting for review right now.",
          bullets: [],
          suggestions: ["How many profiles are pending review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      const action = normalized.includes("reject") ? "reject_manual_payment" : "approve_manual_payment";
      const payment = payments[0];
      return {
        answer: `The oldest manual review payment is ${payment.currency} ${Number(payment.finalAmount).toFixed(2)} from ${payment.user?.email ?? "an unknown account"}.`,
        bullets: ["I can review that payment now."],
        suggestions: ["Confirm admin action", "How many manual payments need review?"],
        scope: "admin_action",
        confirmation: {
          type: action,
          payload: {
            paymentId: payment.id,
            targetLabel: `${payment.user?.email ?? "Unknown payer"} - ${payment.currency} ${Number(payment.finalAmount).toFixed(2)}`,
          },
          label: action === "reject_manual_payment" ? "Reject manual payment" : "Approve manual payment",
          prompt:
            action === "reject_manual_payment"
              ? `Reject the manual payment from ${payment.user?.email ?? "this account"}?`
              : `Approve the manual payment from ${payment.user?.email ?? "this account"}?`,
        },
      };
    }

    if (this.matches(normalized, ["approve photo", "reject photo", "moderate photo"])) {
      const action = normalized.includes("reject") ? "reject_photo" : "approve_photo";
      const target = this.sanitizeName(query);
      const photos = (await this.adminService.listPendingPhotos()).filter((photo) => {
        if (!target) return true;
        const label = [
          photo.memberProfile.displayName,
          photo.memberProfile.firstName,
          photo.memberProfile.displayId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return label.includes(target.toLowerCase());
      });
      if (!photos.length) {
        return {
          answer: target
            ? `I could not find any pending photos matching "${target}".`
            : "There are no pending photos waiting for review right now.",
          bullets: [],
          suggestions: ["How many profiles are pending review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      if (photos.length > 1) {
        return {
          answer: target
            ? `I found multiple pending photos matching "${target}".`
            : "I found multiple pending photos.",
          bullets: photos.slice(0, 5).map((photo) => {
            const targetLabel = `${photo.memberProfile.displayName || photo.memberProfile.firstName} (${photo.memberProfile.displayId})`;
            return `${targetLabel} - ${photo.mediaType.toLowerCase().replace(/_/g, " ")}.`;
          }),
          suggestions: ["Pick a photo below.", "How many profiles are pending review?"],
          scope: "admin_action",
          confirmation: null,
          choices: photos.slice(0, 5).map((photo) => {
            const targetLabel = `${photo.memberProfile.displayName || photo.memberProfile.firstName} (${photo.memberProfile.displayId})`;
            return {
              label: targetLabel,
              confirmation: {
                type: action,
                payload: {
                  mediaId: photo.id,
                  targetLabel,
                },
                label: action === "reject_photo" ? "Reject photo" : "Approve photo",
                prompt:
                  action === "reject_photo"
                    ? `Reject the pending photo for ${targetLabel}?`
                    : `Approve the pending photo for ${targetLabel}?`,
              },
            };
          }),
        };
      }
      const photo = photos[0];
      const targetLabel = `${photo.memberProfile.displayName || photo.memberProfile.firstName} (${photo.memberProfile.displayId})`;
      return {
        answer: `The oldest pending photo belongs to ${targetLabel}.`,
        bullets: [`Media type: ${photo.mediaType.toLowerCase().replace(/_/g, " ")}.`],
        suggestions: ["Confirm admin action", "How many profiles are pending review?"],
        scope: "admin_action",
        confirmation: {
          type: action,
          payload: {
            mediaId: photo.id,
            targetLabel,
          },
          label: action === "reject_photo" ? "Reject photo" : "Approve photo",
          prompt:
            action === "reject_photo"
              ? `Reject the pending photo for ${targetLabel}?`
              : `Approve the pending photo for ${targetLabel}?`,
        },
      };
    }

    return null;
  }

  private async planSuperAdminAction(
    actor: AuthActor,
    query: string,
    normalized: string,
  ): Promise<AssistantAnswer | null> {
    if (this.matches(normalized, ["approve ghotok", "reject ghotok", "suspend ghotok", "activate ghotok", "add credits to ghotok", "add ghotok credits"])) {
      const target = this.sanitizeName(query);
      const ghotoks = (await this.superAdminService.listGhotoks("ALL")).filter((ghotok) => {
        if (!target) return true;
        const label = [ghotok.displayName, ghotok.email, ghotok.phone].filter(Boolean).join(" ").toLowerCase();
        return label.includes(target.toLowerCase());
      });
      if (!ghotoks.length) {
        return {
          answer: target ? `I could not find a ghotok matching "${target}".` : "I could not find a matching ghotok.",
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }

      const amount = this.parseCreditsAmount(query);
      let actionType = "approve_ghotok";
      let label = "Approve ghotok";
      let promptBuilder = (name: string) => `Approve ${name}?`;
      if (normalized.includes("reject")) {
        actionType = "reject_ghotok";
        label = "Reject ghotok";
        promptBuilder = (name) => `Reject ${name}?`;
      } else if (normalized.includes("suspend")) {
        actionType = "set_ghotok_status";
        label = "Suspend ghotok";
        promptBuilder = (name) => `Suspend ${name}?`;
      } else if (normalized.includes("activate")) {
        actionType = "set_ghotok_status";
        label = "Activate ghotok";
        promptBuilder = (name) => `Set ${name} to active?`;
      } else if (normalized.includes("credit")) {
        if (!amount) {
          return {
            answer: "Tell me how many credits to add.",
            bullets: ["Try: add 25 credits to ghotok Sharmeen."],
            suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
            scope: "super_admin_action",
            confirmation: null,
          };
        }
        actionType = "add_ghotok_credits";
        label = "Add ghotok credits";
        promptBuilder = (name) => `Add ${amount} credits to ${name}?`;
      }

      const makeConfirmation = (ghotok: { id: string; displayName: string }) => ({
        type: actionType,
        payload: {
          ghotokId: ghotok.id,
          targetLabel: ghotok.displayName,
          ...(actionType === "set_ghotok_status" ? { status: normalized.includes("suspend") ? "SUSPENDED" : "ACTIVE" } : {}),
          ...(actionType === "add_ghotok_credits" ? { amount } : {}),
        },
        label,
        prompt: promptBuilder(ghotok.displayName),
      });

      if (ghotoks.length > 1) {
        return {
          answer: `I found multiple ghotoks matching "${target}".`,
          bullets: ghotoks.slice(0, 5).map((ghotok) => `${ghotok.displayName} - ${ghotok.status.toLowerCase()} - ${ghotok.creditBalance} credits`),
          suggestions: ["Pick one of the matches below."],
          scope: "super_admin_action",
          confirmation: null,
          choices: ghotoks.slice(0, 5).map((ghotok) => ({
            label: ghotok.displayName,
            confirmation: makeConfirmation(ghotok),
          })),
        };
      }

      const ghotok = ghotoks[0];
      return {
        answer: `I found ${ghotok.displayName}.`,
        bullets: [`Current status: ${ghotok.status.toLowerCase()}.`, `Credit balance: ${ghotok.creditBalance}.`],
        suggestions: ["Confirm super admin action", "What needs my attention today?"],
        scope: "super_admin_action",
        confirmation: makeConfirmation(ghotok),
      };
    }

    if (this.matches(normalized, ["approve vendor", "reject vendor", "activate vendor", "deactivate vendor", "set vendor status"])) {
      const target = this.sanitizeName(query);
      const vendors = (await this.superAdminService.listVendors("ALL")).filter((vendor) => {
        if (!target) return true;
        const label = [vendor.businessName, vendor.categoryName, vendor.user?.email].filter(Boolean).join(" ").toLowerCase();
        return label.includes(target.toLowerCase());
      });
      if (!vendors.length) {
        return {
          answer: target ? `I could not find a vendor matching "${target}".` : "I could not find a matching vendor.",
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }

      let actionType = "approve_vendor";
      let label = "Approve vendor";
      let promptBuilder = (name: string) => `Approve ${name}?`;
      if (normalized.includes("reject")) {
        actionType = "reject_vendor";
        label = "Reject vendor";
        promptBuilder = (name) => `Reject ${name}?`;
      } else if (normalized.includes("deactivate")) {
        actionType = "set_vendor_status";
        label = "Deactivate vendor";
        promptBuilder = (name) => `Set ${name} to inactive?`;
      } else if (normalized.includes("activate") || normalized.includes("set vendor status")) {
        actionType = "set_vendor_status";
        label = "Activate vendor";
        promptBuilder = (name) => `Set ${name} to active?`;
      }

      const makeConfirmation = (vendor: { id: string; businessName: string }) => ({
        type: actionType,
        payload: {
          vendorId: vendor.id,
          targetLabel: vendor.businessName,
          ...(actionType === "set_vendor_status" ? { status: normalized.includes("deactivate") ? "INACTIVE" : "ACTIVE" } : {}),
        },
        label,
        prompt: promptBuilder(vendor.businessName),
      });

      if (vendors.length > 1) {
        return {
          answer: `I found multiple vendors matching "${target}".`,
          bullets: vendors.slice(0, 5).map((vendor) => `${vendor.businessName} - ${vendor.status.toLowerCase()} - ${vendor._count.leads} leads`),
          suggestions: ["Pick one of the matches below."],
          scope: "super_admin_action",
          confirmation: null,
          choices: vendors.slice(0, 5).map((vendor) => ({
            label: vendor.businessName,
            confirmation: makeConfirmation(vendor),
          })),
        };
      }

      const vendor = vendors[0];
      return {
        answer: `I found ${vendor.businessName}.`,
        bullets: [`Current status: ${vendor.status.toLowerCase()}.`, `Lead count: ${vendor._count.leads}.`],
        suggestions: ["Confirm super admin action", "What needs my attention today?"],
        scope: "super_admin_action",
        confirmation: makeConfirmation(vendor),
      };
    }

    return null;
  }

  private async executeConfirmedAction(
    actor: AuthActor,
    type: string,
    payload: Record<string, unknown>,
    query: string,
  ): Promise<AssistantAnswer> {
    switch (type) {
      case "resend_verification": {
        await this.authService.resendVerificationLink(actor.userId);
        await this.logAssistantAction(actor, "assistant.resend_verification", "USER", actor.userId, {
          query,
        });
        return {
          answer: "Done. I sent a fresh verification email to your account address.",
          bullets: [],
          suggestions: ["How many unread messages do I have?", "What needs my attention today?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      case "create_direct_conversation": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        const targetMemberProfileId = String(payload.targetMemberProfileId || "");
        await this.mailboxService.createDirectConversation(actor, targetMemberProfileId);
        await this.logAssistantAction(actor, "assistant.create_direct_conversation", "CONVERSATION", targetMemberProfileId, {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I opened a direct conversation with ${String(payload.targetLabel || "that member")}.`,
          bullets: [],
          suggestions: ["How many unread messages do I have?", "What needs my attention today?"],
          scope: "mailbox_action",
          confirmation: null,
        };
      }
      case "send_direct_message": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        const targetMemberProfileId = String(payload.targetMemberProfileId || "");
        const conversation = await this.mailboxService.createDirectConversation(
          actor,
          targetMemberProfileId,
        );
        await this.mailboxService.sendMessage(
          actor,
          String((conversation as { id?: string }).id || ""),
          String(payload.body || ""),
        );
        await this.logAssistantAction(
          actor,
          "assistant.send_direct_message",
          "CONVERSATION",
          String((conversation as { id?: string }).id || ""),
          {
            query,
            targetLabel: String(payload.targetLabel || ""),
            body: String(payload.body || ""),
          },
        );
        return {
          answer: `Done. I sent your message to ${String(payload.targetLabel || "that member")}.`,
          bullets: [`Message: "${String(payload.body || "")}"`],
          suggestions: ["How many unread messages do I have?", "What needs my attention today?"],
          scope: "mailbox_action",
          confirmation: null,
        };
      }
      case "shortlist_vendor": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.weddingService.shortlistVendor(actor.userId, String(payload.weddingProjectId || ""), {
          vendorProfileId: String(payload.vendorProfileId || ""),
        });
        await this.logAssistantAction(
          actor,
          "assistant.shortlist_vendor",
          "WEDDING_PROJECT",
          String(payload.weddingProjectId || ""),
          {
            query,
            vendorProfileId: String(payload.vendorProfileId || ""),
            vendorLabel: String(payload.vendorLabel || ""),
          },
        );
        return {
          answer: `Done. I added ${String(payload.vendorLabel || "the vendor")} to ${String(payload.weddingProjectTitle || "your wedding project")}.`,
          bullets: [],
          suggestions: ["Summarize my wedding plan.", "What needs my attention today?"],
          scope: "wedding_action",
          confirmation: null,
        };
      }
      case "approve_profile": {
        if (!(actor.roles.includes(RoleKey.ADMIN) || actor.roles.includes(RoleKey.SUPER_ADMIN))) break;
        await this.adminService.approveProfile(actor.userId, String(payload.memberProfileId || ""), "Approved via assistant.");
        await this.logAssistantAction(actor, "assistant.approve_profile", "MEMBER_PROFILE", String(payload.memberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I approved ${String(payload.targetLabel || "that profile")}.`,
          bullets: [],
          suggestions: ["How many profiles are pending review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      case "reject_profile": {
        if (!(actor.roles.includes(RoleKey.ADMIN) || actor.roles.includes(RoleKey.SUPER_ADMIN))) break;
        await this.adminService.rejectProfile(actor.userId, String(payload.memberProfileId || ""), "Rejected via assistant.");
        await this.logAssistantAction(actor, "assistant.reject_profile", "MEMBER_PROFILE", String(payload.memberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I rejected ${String(payload.targetLabel || "that profile")}.`,
          bullets: [],
          suggestions: ["How many profiles are pending review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      case "approve_manual_payment": {
        if (!(actor.roles.includes(RoleKey.ADMIN) || actor.roles.includes(RoleKey.SUPER_ADMIN))) break;
        await this.adminService.approveManualPayment(String(payload.paymentId || ""), actor.userId, "Approved via assistant.");
        await this.logAssistantAction(actor, "assistant.approve_manual_payment", "PAYMENT", String(payload.paymentId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I approved ${String(payload.targetLabel || "that manual payment")}.`,
          bullets: [],
          suggestions: ["How many manual payments need review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      case "reject_manual_payment": {
        if (!(actor.roles.includes(RoleKey.ADMIN) || actor.roles.includes(RoleKey.SUPER_ADMIN))) break;
        await this.adminService.rejectManualPayment(String(payload.paymentId || ""), actor.userId, "Rejected via assistant.");
        await this.logAssistantAction(actor, "assistant.reject_manual_payment", "PAYMENT", String(payload.paymentId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I rejected ${String(payload.targetLabel || "that manual payment")}.`,
          bullets: [],
          suggestions: ["How many manual payments need review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      case "create_saved_search": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.memberProfilesService.createSavedSearch(actor.userId, {
          name: String(payload.name || "Assistant search"),
          criteriaJson: (payload.criteriaJson as Record<string, unknown>) || {},
          alertEnabled: Boolean(payload.alertEnabled),
        });
        await this.logAssistantAction(actor, "assistant.create_saved_search", "SEARCH_SAVE", actor.memberProfileId ?? actor.userId, {
          query,
          name: String(payload.name || ""),
        });
        return {
          answer: `Done. I saved "${String(payload.name || "that search")}".`,
          bullets: [Boolean(payload.alertEnabled) ? "Alerts are enabled for this search." : "Alerts are not enabled for this search."],
          suggestions: ["How many saved searches do I have?", "What needs my attention today?"],
          scope: "saved_search_action",
          confirmation: null,
        };
      }
      case "create_ghotok_managed_member": {
        if (!actor.roles.includes(RoleKey.GHOTOK)) break;
        const created = await this.ghotokService.createManagedMember(actor.userId, {
          firstName: String(payload.firstName || "").trim(),
          lastName: payload.lastName ? String(payload.lastName).trim() : undefined,
          gender: payload.gender as any,
          lookingFor: payload.lookingFor as any,
          memberEmail: payload.memberEmail ? String(payload.memberEmail).trim() : undefined,
          memberPhone: payload.memberPhone ? String(payload.memberPhone).trim() : undefined,
          currentCountryCode: payload.currentCountryCode ? String(payload.currentCountryCode).trim() : undefined,
        });
        if (!created) {
          throw new Error("Managed member creation did not return a profile.");
        }
        await this.logAssistantAction(actor, "assistant.create_ghotok_managed_member", "MEMBER_PROFILE", created.id, {
          query,
          displayName: created.displayName,
        });
        return {
          answer: `Done. I created managed member ${created.displayName || created.firstName}.`,
          bullets: [`Display ID: ${created.displayId}.`],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      case "link_ghotok_member": {
        if (!actor.roles.includes(RoleKey.GHOTOK)) break;
        await this.ghotokService.linkExistingMember(actor.userId, String(payload.memberProfileId || ""));
        await this.logAssistantAction(actor, "assistant.link_ghotok_member", "MEMBER_PROFILE", String(payload.memberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I linked ${String(payload.targetLabel || "that member")} to your managed list.`,
          bullets: [],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      case "start_ghotok_impersonation": {
        if (!actor.roles.includes(RoleKey.GHOTOK)) break;
        await this.ghotokService.startImpersonation(actor.userId, String(payload.memberProfileId || ""), {
          reason: "Started via assistant.",
        });
        await this.logAssistantAction(actor, "assistant.start_ghotok_impersonation", "MEMBER_PROFILE", String(payload.memberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I started impersonation for ${String(payload.targetLabel || "that member")}.`,
          bullets: ["You can now continue member actions in the managed member context."],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      case "end_ghotok_impersonation": {
        if (!actor.roles.includes(RoleKey.GHOTOK)) break;
        await this.ghotokService.endImpersonation(actor.userId, String(payload.sessionId || ""), {
          reason: "Ended via assistant.",
        });
        await this.logAssistantAction(actor, "assistant.end_ghotok_impersonation", "GHOTOK_IMPERSONATION_SESSION", String(payload.sessionId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I ended the impersonation session for ${String(payload.targetLabel || "that member")}.`,
          bullets: [],
          suggestions: ["How many members am I managing?", "What is my wallet balance?"],
          scope: "ghotok_action",
          confirmation: null,
        };
      }
      case "create_wedding_project": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.weddingService.createProject(actor.userId, {
          title: String(payload.title || "Wedding Project"),
          weddingDate: payload.weddingDate ? String(payload.weddingDate) : undefined,
          city: payload.city ? String(payload.city) : undefined,
          budgetBand: payload.budgetBand ? String(payload.budgetBand) : undefined,
          guestTarget: payload.guestTarget ? Number(payload.guestTarget) : undefined,
        });
        await this.logAssistantAction(actor, "assistant.create_wedding_project", "WEDDING_PROJECT", actor.memberProfileId ?? actor.userId, {
          query,
          title: String(payload.title || ""),
        });
        return {
          answer: `Done. I created the wedding project "${String(payload.title || "Wedding Project")}".`,
          bullets: [],
          suggestions: ["Summarize my wedding plan.", "What needs my attention today?"],
          scope: "wedding_action",
          confirmation: null,
        };
      }
      case "approve_ghotok": {
        if (!actor.roles.includes(RoleKey.SUPER_ADMIN)) break;
        await this.superAdminService.approveGhotok(actor.userId, String(payload.ghotokId || ""), "Approved via assistant.");
        await this.logAssistantAction(actor, "assistant.approve_ghotok", "GHOTOK_PROFILE", String(payload.ghotokId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I approved ${String(payload.targetLabel || "that ghotok")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }
      case "reject_ghotok": {
        if (!actor.roles.includes(RoleKey.SUPER_ADMIN)) break;
        await this.superAdminService.rejectGhotok(actor.userId, String(payload.ghotokId || ""), "Rejected via assistant.");
        await this.logAssistantAction(actor, "assistant.reject_ghotok", "GHOTOK_PROFILE", String(payload.ghotokId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I rejected ${String(payload.targetLabel || "that ghotok")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }
      case "set_ghotok_status": {
        if (!actor.roles.includes(RoleKey.SUPER_ADMIN)) break;
        await this.superAdminService.setGhotokStatus(actor.userId, String(payload.ghotokId || ""), payload.status as GhotokStatus, "Updated via assistant.");
        await this.logAssistantAction(actor, "assistant.set_ghotok_status", "GHOTOK_PROFILE", String(payload.ghotokId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
          status: String(payload.status || ""),
        });
        return {
          answer: `Done. I updated ${String(payload.targetLabel || "that ghotok")} to ${String(payload.status || "").toLowerCase()}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }
      case "add_ghotok_credits": {
        if (!actor.roles.includes(RoleKey.SUPER_ADMIN)) break;
        const result = await this.superAdminService.addGhotokCredits(actor.userId, String(payload.ghotokId || ""), Number(payload.amount || 0), "Added via assistant.");
        await this.logAssistantAction(actor, "assistant.add_ghotok_credits", "GHOTOK_PROFILE", String(payload.ghotokId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
          amount: Number(payload.amount || 0),
          newBalance: result.newBalance,
        });
        return {
          answer: `Done. I added ${Number(payload.amount || 0)} credits to ${String(payload.targetLabel || "that ghotok")}.`,
          bullets: [`New balance: ${result.newBalance}.`],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }
      case "approve_vendor": {
        if (!actor.roles.includes(RoleKey.SUPER_ADMIN)) break;
        await this.superAdminService.approveVendor(actor.userId, String(payload.vendorId || ""), "Approved via assistant.");
        await this.logAssistantAction(actor, "assistant.approve_vendor", "VENDOR_PROFILE", String(payload.vendorId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I approved ${String(payload.targetLabel || "that vendor")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }
      case "reject_vendor": {
        if (!actor.roles.includes(RoleKey.SUPER_ADMIN)) break;
        await this.superAdminService.rejectVendor(actor.userId, String(payload.vendorId || ""), "Rejected via assistant.");
        await this.logAssistantAction(actor, "assistant.reject_vendor", "VENDOR_PROFILE", String(payload.vendorId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I rejected ${String(payload.targetLabel || "that vendor")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }
      case "set_vendor_status": {
        if (!actor.roles.includes(RoleKey.SUPER_ADMIN)) break;
        await this.superAdminService.setVendorStatus(actor.userId, String(payload.vendorId || ""), payload.status as VendorStatus, "Updated via assistant.");
        await this.logAssistantAction(actor, "assistant.set_vendor_status", "VENDOR_PROFILE", String(payload.vendorId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
          status: String(payload.status || ""),
        });
        return {
          answer: `Done. I updated ${String(payload.targetLabel || "that vendor")} to ${String(payload.status || "").toLowerCase()}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many profiles are pending review?"],
          scope: "super_admin_action",
          confirmation: null,
        };
      }
      case "add_wedding_guest": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.weddingService.addGuest(actor.userId, String(payload.weddingProjectId || ""), {
          guestName: String(payload.guestName || "Wedding Guest"),
          guestCount: Number(payload.guestCount || 1),
        });
        await this.logAssistantAction(actor, "assistant.add_wedding_guest", "WEDDING_PROJECT", String(payload.weddingProjectId || ""), {
          query,
          guestName: String(payload.guestName || ""),
          guestCount: Number(payload.guestCount || 1),
        });
        return {
          answer: `Done. I added ${String(payload.guestName || "the guest")} to ${String(payload.weddingProjectTitle || "your wedding project")}.`,
          bullets: [],
          suggestions: ["Summarize my wedding plan.", "What needs my attention today?"],
          scope: "wedding_action",
          confirmation: null,
        };
      }
      case "submit_profile_for_review": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.memberProfilesService.submitForReview(actor.userId);
        await this.logAssistantAction(actor, "assistant.submit_profile_for_review", "MEMBER_PROFILE", actor.memberProfileId ?? actor.userId, {
          query,
        });
        return {
          answer: "Done. I submitted your profile for review.",
          bullets: ["Your profile is now in the moderation queue."],
          suggestions: ["What needs my attention today?", "How many unread messages do I have?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      case "send_interest": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.memberProfilesService.sendInterest(actor.userId, String(payload.targetMemberProfileId || ""));
        await this.logAssistantAction(actor, "assistant.send_interest", "MEMBER_PROFILE", String(payload.targetMemberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I sent an interest to ${String(payload.targetLabel || "that member")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many unread messages do I have?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      case "add_favorite": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.memberProfilesService.addFavorite(actor.userId, String(payload.targetMemberProfileId || ""));
        await this.logAssistantAction(actor, "assistant.add_favorite", "MEMBER_PROFILE", String(payload.targetMemberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I added ${String(payload.targetLabel || "that member")} to your favorites.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many unread messages do I have?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      case "block_member": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.memberProfilesService.blockMember(actor.userId, String(payload.targetMemberProfileId || ""));
        await this.logAssistantAction(actor, "assistant.block_member", "MEMBER_PROFILE", String(payload.targetMemberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I blocked ${String(payload.targetLabel || "that member")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many unread messages do I have?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      case "unlock_contact": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.memberProfilesService.unlockContact(actor.userId, String(payload.targetMemberProfileId || ""));
        await this.logAssistantAction(actor, "assistant.unlock_contact", "MEMBER_PROFILE", String(payload.targetMemberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I unlocked contact details for ${String(payload.targetLabel || "that member")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many unread messages do I have?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      case "request_photo_access": {
        if (!actor.roles.includes(RoleKey.MEMBER)) break;
        await this.memberProfilesService.createPhotoRequest(actor.userId, String(payload.targetMemberProfileId || ""));
        await this.logAssistantAction(actor, "assistant.request_photo_access", "MEMBER_PROFILE", String(payload.targetMemberProfileId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I requested photo access from ${String(payload.targetLabel || "that member")}.`,
          bullets: [],
          suggestions: ["What needs my attention today?", "How many unread messages do I have?"],
          scope: "member_action",
          confirmation: null,
        };
      }
      case "update_vendor_lead_status": {
        if (!actor.roles.includes(RoleKey.VENDOR)) break;
        await this.vendorsService.updateLeadStatus(actor.userId, String(payload.leadId || ""), {
          status: payload.status as LeadStatus,
        });
        await this.logAssistantAction(actor, "assistant.update_vendor_lead_status", "VENDOR_LEAD", String(payload.leadId || ""), {
          query,
          status: String(payload.status || ""),
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I updated ${String(payload.targetLabel || "that lead")} to ${String(payload.status || "the requested status").toLowerCase().replace(/_/g, " ")}.`,
          bullets: [],
          suggestions: ["How many leads do I have?", "What needs my attention today?"],
          scope: "vendor_action",
          confirmation: null,
        };
      }
      case "approve_photo": {
        if (!(actor.roles.includes(RoleKey.ADMIN) || actor.roles.includes(RoleKey.SUPER_ADMIN))) break;
        await this.adminService.moderatePhoto(actor.userId, String(payload.mediaId || ""), "approve", "Approved via assistant.");
        await this.logAssistantAction(actor, "assistant.approve_photo", "PROFILE_MEDIA", String(payload.mediaId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I approved the pending photo for ${String(payload.targetLabel || "that profile")}.`,
          bullets: [],
          suggestions: ["How many profiles are pending review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
      case "reject_photo": {
        if (!(actor.roles.includes(RoleKey.ADMIN) || actor.roles.includes(RoleKey.SUPER_ADMIN))) break;
        await this.adminService.moderatePhoto(actor.userId, String(payload.mediaId || ""), "reject", "Rejected via assistant.");
        await this.logAssistantAction(actor, "assistant.reject_photo", "PROFILE_MEDIA", String(payload.mediaId || ""), {
          query,
          targetLabel: String(payload.targetLabel || ""),
        });
        return {
          answer: `Done. I rejected the pending photo for ${String(payload.targetLabel || "that profile")}.`,
          bullets: [],
          suggestions: ["How many profiles are pending review?", "What needs my attention today?"],
          scope: "admin_action",
          confirmation: null,
        };
      }
    }

    return {
      answer: `I couldn't confirm that action from "${query}".`,
      bullets: ["Please try again with a supported request."],
      suggestions: ["What needs my attention today?"],
      scope: "assistant",
      confirmation: null,
    };
  }

  private async planVendorAction(
    actor: AuthActor,
    query: string,
    normalized: string,
  ): Promise<AssistantAnswer | null> {
    const leadStatusMap: Array<{ phrases: string[]; status: LeadStatus; label: string }> = [
      { phrases: ["mark lead open", "open lead"], status: LeadStatus.OPEN, label: "open" },
      { phrases: ["mark lead responded", "responded lead", "mark responded"], status: LeadStatus.RESPONDED, label: "responded" },
      { phrases: ["mark lead booked", "book lead", "mark booked"], status: LeadStatus.BOOKED, label: "booked" },
      { phrases: ["reject lead", "close rejected", "mark lead rejected"], status: LeadStatus.CLOSED_REJECTED, label: "closed rejected" },
    ];

    const match = leadStatusMap.find((item) => this.matches(normalized, item.phrases));
    if (!match) return null;

    const target = this.sanitizeName(query);
    const leads = await this.prisma.vendorLead.findMany({
      where: { vendorProfileId: actor.vendorProfileId! },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        id: true,
        status: true,
        requesterName: true,
        requesterEmail: true,
        weddingProject: { select: { title: true } },
      },
    });
    const filteredLeads = leads.filter((lead) => {
      if (!target) return true;
      const label = [
        lead.requesterName,
        lead.requesterEmail,
        lead.weddingProject?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return label.includes(target.toLowerCase());
    });

    if (!filteredLeads.length) {
      return {
        answer: target
          ? `I could not find any leads matching "${target}".`
          : "You do not have any vendor leads yet.",
        bullets: [],
        suggestions: ["How many leads do I have?", "What needs my attention today?"],
        scope: "vendor_action",
        confirmation: null,
      };
    }

    if (filteredLeads.length > 1) {
      return {
        answer: target
          ? `I found multiple leads matching "${target}".`
          : "I found multiple matching leads.",
        bullets: filteredLeads.slice(0, 5).map((lead) => {
          const targetLabel = `${lead.requesterName || lead.requesterEmail || "Unknown requester"}${lead.weddingProject?.title ? ` for ${lead.weddingProject.title}` : ""}`;
          return `${targetLabel} - ${lead.status.toLowerCase().replace(/_/g, " ")}.`;
        }),
        suggestions: ["Pick a lead below.", "How many leads do I have?"],
        scope: "vendor_action",
        confirmation: null,
        choices: filteredLeads.slice(0, 5).map((lead) => {
          const targetLabel = `${lead.requesterName || lead.requesterEmail || "Unknown requester"}${lead.weddingProject?.title ? ` for ${lead.weddingProject.title}` : ""}`;
          return {
            label: targetLabel,
            confirmation: {
              type: "update_vendor_lead_status",
              payload: {
                leadId: lead.id,
                status: match.status,
                targetLabel,
              },
              label: `Mark ${match.label}`,
              prompt: `Update ${targetLabel} to ${match.label}?`,
            },
          };
        }),
      };
    }

    const lead = filteredLeads[0];
    const targetLabel = `${lead.requesterName || lead.requesterEmail || "Unknown requester"}${lead.weddingProject?.title ? ` for ${lead.weddingProject.title}` : ""}`;
    return {
      answer: `The oldest lead is from ${targetLabel}.`,
      bullets: [`Current status: ${lead.status.toLowerCase().replace(/_/g, " ")}.`],
      suggestions: ["Confirm vendor action", "How many leads do I have?"],
      scope: "vendor_action",
      confirmation: {
        type: "update_vendor_lead_status",
        payload: {
          leadId: lead.id,
          status: match.status,
          targetLabel,
        },
        label: `Mark ${match.label}`,
        prompt: `Update this lead to ${match.label}?`,
      },
    };
  }

  private async logAssistantAction(
    actor: AuthActor,
    action: string,
    targetType: string,
    targetId: string | null,
    metadataJson: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.userId,
        actorRole: actor.roles[0] ?? null,
        targetType,
        targetId,
        action,
        description: "Confirmed assistant action",
        metadataJson,
      },
    });
  }

  private async findVendorCandidates(memberProfileId: string, rawQuery: string) {
    const vendorName = this.sanitizeName(rawQuery);
    return this.prisma.vendorProfile.findMany({
      where: {
        status: VendorStatus.ACTIVE,
        OR: [
          { businessName: { contains: vendorName, mode: "insensitive" } },
          { categoryName: { contains: vendorName, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        businessName: true,
        categoryName: true,
      },
      take: 5,
    });
  }

  private async getMailboxSummary(actor: AuthActor): Promise<AssistantAnswer> {
    const conversations = await this.prisma.conversationParticipant.findMany({
      where: { userId: actor.userId, isActive: true },
      include: {
        conversation: {
          include: {
            messages: {
              where: { deletedAt: null },
              orderBy: { sentAt: "desc" },
              take: 1,
            },
            participants: {
              include: {
                memberProfile: {
                  select: {
                    firstName: true,
                    displayName: true,
                    displayId: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 12,
    });

    const unread = conversations.filter((participant) => {
      const lastMessage = participant.conversation.messages[0];
      return lastMessage && lastMessage.senderUserId !== actor.userId && lastMessage.id !== participant.lastReadMessageId;
    });

    const latestUnread = unread.slice(0, 3).map((participant) => {
      const counterpart = participant.conversation.participants.find((item) => item.userId !== actor.userId);
      return counterpart?.memberProfile?.displayName || counterpart?.memberProfile?.firstName || "a member";
    });

    return {
      answer:
        unread.length === 0
          ? "You have no unread mailbox conversations right now."
          : `You have ${unread.length} unread conversation${unread.length === 1 ? "" : "s"} right now.`,
      bullets: unread.length
        ? [
            latestUnread.length ? `Unread from ${latestUnread.join(", ")}.` : "You have unread messages waiting.",
            `You have ${conversations.length} active conversation${conversations.length === 1 ? "" : "s"} in total.`,
          ]
        : [`You have ${conversations.length} active conversation${conversations.length === 1 ? "" : "s"} in total.`],
      suggestions: ["What needs my attention today?", "Summarize my wedding plan.", "What is my membership status?"],
      scope: "mailbox",
      confirmation: null,
    };
  }

  private async searchMailbox(actor: AuthActor, rawQuery: string): Promise<AssistantAnswer> {
    const keyword = rawQuery
      .replace(/^(find|show|search|summarize)\s+/i, "")
      .replace(/\b(messages?|conversation)\b/gi, "")
      .replace(/\b(from|with|about)\b/gi, "")
      .trim();

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId: actor.userId } },
        messages: keyword
          ? { some: { deletedAt: null, body: { contains: keyword, mode: "insensitive" } } }
          : undefined,
      },
      include: {
        participants: {
          include: {
            memberProfile: { select: { displayName: true, firstName: true, displayId: true } },
            user: { select: { email: true } },
          },
        },
        messages: {
          where: {
            deletedAt: null,
            ...(keyword ? { body: { contains: keyword, mode: "insensitive" } } : {}),
          },
          orderBy: { sentAt: "desc" },
          take: 3,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    const counterpartMatches = conversations.filter((conversation) => {
      if (!keyword) return true;
      const counterpart = conversation.participants.find((participant) => participant.userId !== actor.userId);
      const label = [
        counterpart?.memberProfile?.displayName,
        counterpart?.memberProfile?.firstName,
        counterpart?.memberProfile?.displayId,
        counterpart?.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return label.includes(keyword.toLowerCase()) || conversation.messages.length > 0;
    });

    if (!counterpartMatches.length) {
      return {
        answer: `I could not find any recent mailbox conversations matching "${keyword || rawQuery}".`,
        bullets: [],
        suggestions: ["How many unread messages do I have?", "What needs my attention today?", "Summarize my wedding plan."],
        scope: "mailbox_search",
        confirmation: null,
      };
    }

    return {
      answer: `I found ${counterpartMatches.length} conversation match${counterpartMatches.length === 1 ? "" : "es"} for "${keyword || rawQuery}".`,
      bullets: counterpartMatches.slice(0, 3).map((conversation) => {
        const counterpart = conversation.participants.find((participant) => participant.userId !== actor.userId);
        const label = counterpart?.memberProfile?.displayName || counterpart?.memberProfile?.firstName || counterpart?.user?.email || "a member";
        const latest = conversation.messages[0];
        const excerpt = latest?.body ? latest.body.slice(0, 110) : "No recent message preview available.";
        return `${label}: ${excerpt}`;
      }),
      suggestions: ["How many unread messages do I have?", "What needs my attention today?", "What is my membership status?"],
      scope: "mailbox_search",
      confirmation: null,
    };
  }

  private async getMembershipSummary(actor: AuthActor): Promise<AssistantAnswer> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId: actor.userId, status: "ACTIVE" },
      include: {
        membershipPlan: {
          select: {
            nameEn: true,
            durationDays: true,
            supportTier: true,
            messageEnabled: true,
            contactViewEnabled: true,
          },
        },
      },
      orderBy: { endsAt: "desc" },
    });

    if (!membership) {
      return {
        answer: "You are currently on the free tier with no active paid membership.",
        bullets: ["Messaging and contact unlocks may be limited until you upgrade."],
        suggestions: ["How many unread messages do I have?", "What needs my attention today?", "Summarize my account."],
        scope: "membership",
        confirmation: null,
      };
    }

    const endsAt = membership.endsAt
      ? membership.endsAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "with no expiry date on file";

    return {
      answer: `Your active membership is ${membership.membershipPlan.nameEn} and it runs until ${endsAt}.`,
      bullets: [
        membership.membershipPlan.messageEnabled ? "Messaging is enabled on your plan." : "Messaging is not enabled on your current plan.",
        membership.membershipPlan.contactViewEnabled ? "Contact viewing is enabled on your plan." : "Contact viewing is not enabled on your current plan.",
        membership.membershipPlan.supportTier ? `Support tier: ${membership.membershipPlan.supportTier}.` : "No support tier is configured for this plan.",
      ],
      suggestions: ["How many unread messages do I have?", "What needs my attention today?", "Summarize my wedding plan."],
      scope: "membership",
      confirmation: null,
    };
  }

  private async getSavedSearchSummary(actor: AuthActor): Promise<AssistantAnswer> {
    const savedSearches = await this.prisma.searchSave.findMany({
      where: { memberProfileId: actor.memberProfileId! },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { name: true, updatedAt: true, alertEnabled: true },
    });

    const alertCount = savedSearches.filter((item) => item.alertEnabled).length;

    return {
      answer:
        savedSearches.length === 0
          ? "You do not have any saved searches yet."
          : `You have ${savedSearches.length} recent saved search${savedSearches.length === 1 ? "" : "es"}, and ${alertCount} of them have alerts turned on.`,
      bullets: savedSearches.slice(0, 3).map((item) => {
        const updatedAt = item.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${item.name} was updated on ${updatedAt}${item.alertEnabled ? " with alerts enabled" : ""}.`;
      }),
      suggestions: ["What needs my attention today?", "How many unread messages do I have?", "Summarize my wedding plan."],
      scope: "saved_searches",
      confirmation: null,
    };
  }

  private async getContactUnlockSummary(actor: AuthActor): Promise<AssistantAnswer> {
    const unlocks = await this.prisma.contactUnlock.findMany({
      where: { viewerMemberProfileId: actor.memberProfileId! },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        targetMemberProfile: {
          select: {
            displayName: true,
            displayId: true,
            currentCity: true,
            currentCountryCode: true,
          },
        },
      },
    });

    if (!unlocks.length) {
      return {
        answer: "You have not unlocked any member contacts yet.",
        bullets: [],
        suggestions: ["What is my membership status?", "How many unread messages do I have?", "What needs my attention today?"],
        scope: "contacts",
        confirmation: null,
      };
    }

    return {
      answer: `You have unlocked ${unlocks.length} recent contact${unlocks.length === 1 ? "" : "s"}.`,
      bullets: unlocks.slice(0, 3).map((unlock) => {
        const profile = unlock.targetMemberProfile;
        const location = [profile.currentCity, profile.currentCountryCode].filter(Boolean).join(", ");
        return `${profile.displayName} (${profile.displayId})${location ? ` in ${location}` : ""}.`;
      }),
      suggestions: ["How many unread messages do I have?", "What is my membership status?", "Summarize my wedding plan."],
      scope: "contacts",
      confirmation: null,
    };
  }

  private async getWeddingSummary(actor: AuthActor): Promise<AssistantAnswer> {
    const projects = await this.prisma.weddingProject.findMany({
      where: { memberProfileId: actor.memberProfileId! },
      include: {
        guestEntries: { select: { guestCount: true, invited: true, confirmed: true } },
        shortlists: { select: { id: true } },
      },
      orderBy: [{ weddingDate: "asc" }, { createdAt: "desc" }],
      take: 3,
    });

    if (!projects.length) {
      return {
        answer: "You do not have a wedding project yet.",
        bullets: ["Create one to track guest lists, vendors, and planning progress."],
        suggestions: ["What needs my attention today?", "How many unread messages do I have?", "What is my membership status?"],
        scope: "wedding",
        confirmation: null,
      };
    }

    const primary = projects[0];
    const guestTarget = primary.guestTarget ?? 0;
    const invitedCount = primary.guestEntries.filter((item) => item.invited).length;
    const confirmedCount = primary.guestEntries.filter((item) => item.confirmed).length;
    const totalGuests = primary.guestEntries.reduce((sum, item) => sum + (item.guestCount || 1), 0);

    return {
      answer: `Your main wedding project is "${primary.title}" and it is currently ${primary.status.toLowerCase().replace(/_/g, " ")}.`,
      bullets: [
        primary.weddingDate
          ? `Wedding date: ${primary.weddingDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`
          : "Wedding date has not been set yet.",
        guestTarget
          ? `Guest target: ${guestTarget}; currently tracking ${totalGuests} guests with ${invitedCount} invited and ${confirmedCount} confirmed.`
          : `Currently tracking ${totalGuests} guests with ${invitedCount} invited and ${confirmedCount} confirmed.`,
        `You have ${primary.shortlists.length} shortlisted vendor${primary.shortlists.length === 1 ? "" : "s"} for this project.`,
      ],
      suggestions: ["What needs my attention today?", "How many unread messages do I have?", "Summarize my membership."],
      scope: "wedding",
      confirmation: null,
    };
  }

  private async getProfileSummary(actor: AuthActor): Promise<AssistantAnswer> {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { id: actor.memberProfileId! },
      select: { displayName: true, displayId: true, profileCompletionPct: true, status: true, approvalStatus: true },
    });

    return {
      answer: `${profile?.displayName ?? "Your profile"} is ${profile?.profileCompletionPct ?? 0}% complete and is currently ${profile?.status?.toLowerCase().replace(/_/g, " ")}.`,
      bullets: [
        `Approval status: ${profile?.approvalStatus?.toLowerCase().replace(/_/g, " ") ?? "unknown"}.`,
        `Profile ID: ${profile?.displayId ?? "not available"}.`,
      ],
      suggestions: ["What needs my attention today?", "What is my membership status?", "How many unread messages do I have?"],
      scope: "profile",
      confirmation: null,
    };
  }

  private async getMemberAttentionSummary(actor: AuthActor): Promise<AssistantAnswer> {
    const [
      profile,
      pendingPhotoRequests,
      unreadConversations,
      activeMembership,
      weddingProjects,
      savedSearchAlerts,
    ] = await Promise.all([
      this.prisma.memberProfile.findUnique({
        where: { id: actor.memberProfileId! },
        select: { displayName: true, profileCompletionPct: true, approvalStatus: true },
      }),
      this.prisma.photoAccessRequest.count({ where: { ownerMemberProfileId: actor.memberProfileId!, status: "PENDING" } }),
      this.prisma.conversationParticipant.findMany({
        where: { userId: actor.userId, isActive: true },
        include: {
          conversation: {
            include: {
              messages: { where: { deletedAt: null }, orderBy: { sentAt: "desc" }, take: 1 },
            },
          },
        },
      }).then((items) =>
        items.filter((participant) => {
          const lastMessage = participant.conversation.messages[0];
          return lastMessage && lastMessage.senderUserId !== actor.userId && lastMessage.id !== participant.lastReadMessageId;
        }).length,
      ),
      this.prisma.membership.findFirst({ where: { userId: actor.userId, status: "ACTIVE" }, select: { endsAt: true, membershipPlan: { select: { nameEn: true } } }, orderBy: { endsAt: "desc" } }),
      this.prisma.weddingProject.count({ where: { memberProfileId: actor.memberProfileId! } }),
      this.prisma.searchSave.count({ where: { memberProfileId: actor.memberProfileId!, alertEnabled: true } }),
    ]);

    const bullets: string[] = [];
    if ((profile?.profileCompletionPct ?? 0) < 60) bullets.push(`Your profile is ${profile?.profileCompletionPct ?? 0}% complete, so finishing it should be your top priority.`);
    if (unreadConversations > 0) bullets.push(`You have ${unreadConversations} unread conversation${unreadConversations === 1 ? "" : "s"}.`);
    if (pendingPhotoRequests > 0) bullets.push(`You have ${pendingPhotoRequests} pending photo request${pendingPhotoRequests === 1 ? "" : "s"} to review.`);
    if (!activeMembership) bullets.push("You are currently on the free tier with no active paid membership.");
    if (savedSearchAlerts > 0) bullets.push(`You have ${savedSearchAlerts} saved search alert${savedSearchAlerts === 1 ? "" : "s"} turned on.`);
    if (weddingProjects === 0) bullets.push("You have not created a wedding project yet.");
    if (!bullets.length) bullets.push("Your account looks healthy right now with no urgent member tasks detected.");

    return {
      answer: `Here is what needs your attention today, ${profile?.displayName ?? "member"}.`,
      bullets,
      suggestions: ["How many unread messages do I have?", "What is my membership status?", "Summarize my wedding plan."],
      scope: "member_overview",
      confirmation: null,
    };
  }

  private async getGhotokSummary(actor: AuthActor, normalized: string): Promise<AssistantAnswer> {
    const [managedMembers, activeMembers, wallet, recentNewMembers] = await Promise.all([
      this.prisma.memberProfile.count({ where: { managedByGhotokId: actor.ghotokProfileId! } }),
      this.prisma.memberProfile.count({ where: { managedByGhotokId: actor.ghotokProfileId!, status: ProfileStatus.ACTIVE } }),
      this.prisma.ghotokCreditWallet.findUnique({ where: { ghotokProfileId: actor.ghotokProfileId! }, select: { balance: true } }),
      this.prisma.memberProfile.count({
        where: {
          managedByGhotokId: actor.ghotokProfileId!,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const answer = this.matches(normalized, ["wallet", "balance"])
      ? `Your current ghotok wallet balance is ${Number(wallet?.balance ?? 0).toFixed(2)}.`
      : `You are currently managing ${managedMembers} member${managedMembers === 1 ? "" : "s"}.`;

    return {
      answer,
      bullets: [
        `${activeMembers} managed profile${activeMembers === 1 ? "" : "s"} are active right now.`,
        `${recentNewMembers} new managed member${recentNewMembers === 1 ? "" : "s"} were added in the last 7 days.`,
        `Wallet balance: ${Number(wallet?.balance ?? 0).toFixed(2)}.`,
      ],
      suggestions: ["What needs my attention today?", "How many members am I managing?", "What is my wallet balance?"],
      scope: "ghotok",
      confirmation: null,
    };
  }

  private async getAdminSummary(normalized: string): Promise<AssistantAnswer> {
    const [pendingProfiles, pendingManualPayments, activeProfiles, pendingGhotoks, pendingVendors] = await Promise.all([
      this.prisma.memberProfile.count({ where: { approvalStatus: ApprovalStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.MANUAL_REVIEW } }),
      this.prisma.memberProfile.count({ where: { status: ProfileStatus.ACTIVE } }),
      this.prisma.ghotokProfile.count({ where: { status: GhotokStatus.PENDING_REVIEW } }),
      this.prisma.vendorProfile.count({ where: { status: VendorStatus.PENDING_REVIEW } }),
    ]);

    const answer = this.matches(normalized, ["payment"])
      ? `There are ${pendingManualPayments} manual payment${pendingManualPayments === 1 ? "" : "s"} waiting for review.`
      : this.matches(normalized, ["ghotok"])
        ? `There are ${pendingGhotoks} ghotok${pendingGhotoks === 1 ? "" : "s"} waiting for review right now.`
        : this.matches(normalized, ["vendor"])
          ? `There are ${pendingVendors} vendor${pendingVendors === 1 ? "" : "s"} waiting for review right now.`
          : `There are ${pendingProfiles} member profile${pendingProfiles === 1 ? "" : "s"} waiting for moderation right now.`;

    return {
      answer,
      bullets: [
        `${pendingManualPayments} manual payment${pendingManualPayments === 1 ? "" : "s"} need review.`,
        `${activeProfiles} member profile${activeProfiles === 1 ? "" : "s"} are active.`,
        `${pendingGhotoks} ghotok${pendingGhotoks === 1 ? "" : "s"} and ${pendingVendors} vendor${pendingVendors === 1 ? "" : "s"} are pending review.`,
      ],
      suggestions: ["What needs my attention today?", "How many manual payments need review?", "How many profiles are pending review?", "How many ghotoks are pending review?"],
      scope: "admin",
      confirmation: null,
    };
  }

  private async getVendorSummary(actor: AuthActor, normalized: string): Promise<AssistantAnswer> {
    const [vendor, leadCounts, recentLead] = await Promise.all([
      this.prisma.vendorProfile.findUnique({
        where: { id: actor.vendorProfileId! },
        select: { businessName: true, status: true, billingStatus: true, categoryName: true },
      }),
      this.prisma.vendorLead.groupBy({
        by: ["status"],
        where: { vendorProfileId: actor.vendorProfileId! },
        _count: { status: true },
      }),
      this.prisma.vendorLead.findFirst({
        where: { vendorProfileId: actor.vendorProfileId! },
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
          requesterName: true,
          source: true,
          createdAt: true,
          weddingProject: { select: { title: true } },
        },
      }),
    ]);

    const totalLeads = leadCounts.reduce((sum, item) => sum + item._count.status, 0);
    const openLeads = leadCounts.find((item) => item.status === LeadStatus.OPEN)?._count.status ?? 0;
    const newLeads = leadCounts.find((item) => item.status === LeadStatus.NEW)?._count.status ?? 0;
    const bookedLeads = leadCounts.find((item) => item.status === LeadStatus.BOOKED)?._count.status ?? 0;

    const answer = this.matches(normalized, ["lead", "inquiry", "enquiry"])
      ? `${vendor?.businessName ?? "Your vendor profile"} has ${totalLeads} lead${totalLeads === 1 ? "" : "s"}, including ${newLeads} new and ${openLeads} open.`
      : `${vendor?.businessName ?? "Your vendor profile"} is ${vendor?.status.toLowerCase() ?? "active"} with ${vendor?.billingStatus.toLowerCase() ?? "unknown"} billing status.`;

    const latestLeadLine = recentLead
      ? `Latest lead: ${recentLead.requesterName || "Unknown requester"}${recentLead.weddingProject?.title ? ` for ${recentLead.weddingProject.title}` : ""}, ${recentLead.status.toLowerCase().replace(/_/g, " ")}.`
      : "No vendor leads yet.";

    return {
      answer,
      bullets: [
        `Billing status: ${vendor?.billingStatus.toLowerCase().replace(/_/g, " ") ?? "unknown"}.`,
        `${bookedLeads} lead${bookedLeads === 1 ? "" : "s"} are booked.`,
        latestLeadLine,
      ],
      suggestions: ["What needs my attention today?", "How many leads do I have?", "What is my billing status?"],
      scope: "vendor",
      confirmation: null,
    };
  }
}
