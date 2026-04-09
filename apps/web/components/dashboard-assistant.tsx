"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { apiRequest, getErrorMessage } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import type { PublicLocale } from "@/lib/locale";
import { localeText } from "@/lib/public-page-locale";

type AssistantResponse = {
  answer: string;
  bullets: string[];
  suggestions: string[];
  scope: string;
  confirmation?: {
    type: string;
    payload: Record<string, unknown>;
    label: string;
    prompt: string;
  } | null;
  choices?: Array<{
    label: string;
    confirmation?: {
      type: string;
      payload: Record<string, unknown>;
      label: string;
      prompt: string;
    } | null;
    query?: string;
  }>;
};

type TranscriptItem =
  | { role: "user"; text: string }
  | { role: "assistant"; response: AssistantResponse };

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }
}

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<SpeechRecognitionResult>;
};

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function roleHeadline(user: AuthUser | null) {
  if (!user) return "Ask AI";
  if (user.roles.includes("SUPER_ADMIN")) return "Ask AI about platform health";
  if (user.roles.includes("ADMIN")) return "Ask AI about moderation and payments";
  if (user.roles.includes("GHOTOK")) return "Ask AI about your managed members";
  if (user.roles.includes("VENDOR")) return "Ask AI about your leads, billing, and vendor workspace";
  return "Ask AI about your account, messages, and wedding plan";
}

function defaultSuggestions(user: AuthUser | null) {
  if (!user) return [];
  if (user.roles.includes("SUPER_ADMIN") || user.roles.includes("ADMIN")) {
    return [
      "What needs my attention today?",
      "How many manual payments need review?",
      "How many profiles are pending review?",
    ];
  }
  if (user.roles.includes("GHOTOK")) {
    return [
      "What needs my attention today?",
      "How many members am I managing?",
      "What is my wallet balance?",
    ];
  }
  if (user.roles.includes("VENDOR")) {
    return [
      "What needs my attention today?",
      "How many leads do I have?",
      "What is my billing status?",
    ];
  }
  return [
    "What needs my attention today?",
    "How many unread messages do I have?",
    "What is my membership status?",
  ];
}

function localizeSuggestion(locale: PublicLocale | null, suggestion: string) {
  return localeText(
    locale,
    suggestion,
    suggestion
      .replace("What needs my attention today?", "আজ আমার কী বিষয়ে মনোযোগ দেওয়া দরকার?")
      .replace("How many unread messages do I have?", "আমার কতটি অপঠিত মেসেজ আছে?")
      .replace("What is my membership status?", "আমার মেম্বারশিপ স্ট্যাটাস কী?")
      .replace("How many manual payments need review?", "কতটি ম্যানুয়াল পেমেন্ট রিভিউ দরকার?")
      .replace("How many profiles are pending review?", "কতটি প্রোফাইল রিভিউয়ের অপেক্ষায় আছে?")
      .replace("How many members am I managing?", "আমি কতজন মেম্বার ম্যানেজ করছি?")
      .replace("What is my wallet balance?", "আমার ওয়ালেট ব্যালেন্স কত?")
      .replace("How many leads do I have?", "আমার কতটি লিড আছে?")
      .replace("What is my billing status?", "আমার বিলিং স্ট্যাটাস কী?")
      .replace("Summarize my wedding plan.", "আমার ওয়েডিং প্ল্যানের সারাংশ বলো।")
      .replace("How many saved searches do I have?", "আমার কতটি সেভড সার্চ আছে?")
      .replace("Confirm send message", "মেসেজ পাঠানো নিশ্চিত করুন")
      .replace("Confirm create conversation", "কনভারসেশন খোলা নিশ্চিত করুন")
      .replace("Confirm save search", "সার্চ সেভ করা নিশ্চিত করুন")
      .replace("Confirm create project", "প্রজেক্ট তৈরি নিশ্চিত করুন")
      .replace("Confirm shortlist vendor", "ভেন্ডর শর্টলিস্ট নিশ্চিত করুন")
      .replace("Confirm submit for review", "রিভিউতে পাঠানো নিশ্চিত করুন")
      .replace("Confirm add wedding guest", "ওয়েডিং গেস্ট যোগ করা নিশ্চিত করুন")
      .replace("Confirm admin action", "অ্যাডমিন অ্যাকশন নিশ্চিত করুন")
      .replace("Confirm vendor action", "ভেন্ডর অ্যাকশন নিশ্চিত করুন")
      .replace("Cancel", "বাতিল"),
  );
}

export function DashboardAssistant({
  accessToken,
  user,
  locale = null,
  open = true,
  onClose,
}: {
  accessToken: string;
  user: AuthUser;
  locale?: PublicLocale | null;
  open?: boolean;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [history, setHistory] = useState<TranscriptItem[]>([]);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [drivingMode, setDrivingMode] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const suggestions = useMemo(
    () => response?.suggestions?.length ? response.suggestions : defaultSuggestions(user),
    [response?.suggestions, user],
  );

  async function ask(nextQuery?: string) {
    const prompt = (nextQuery ?? query).trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError(null);
    setHistory((current) => [...current, { role: "user", text: prompt }]);

    try {
      const result = await apiRequest<AssistantResponse>("/assistant/query", {
        method: "POST",
        token: accessToken,
        body: {
          query: prompt,
          mode: drivingMode ? "driving" : "voice-ready",
          locale,
          context: response ? { lastResponse: response } : undefined,
        },
      });
      setResponse(result);
      setHistory((current) => [...current, { role: "assistant", response: result }]);
      setQuery("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function confirmAction() {
    if (!response?.confirmation || busy) return;
    const confirmation = response.confirmation;
    setBusy(true);
    setError(null);
    setHistory((current) => [
      ...current,
      { role: "user", text: confirmation.prompt },
    ]);

    try {
      const result = await apiRequest<AssistantResponse>("/assistant/query", {
        method: "POST",
        token: accessToken,
        body: {
          query: query || confirmation.prompt,
          mode: drivingMode ? "driving" : "voice-ready",
          locale,
          confirmation: {
            type: confirmation.type,
            payload: confirmation.payload,
          },
        },
      });
      setResponse(result);
      setHistory((current) => [...current, { role: "assistant", response: result }]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function chooseOption(choice: NonNullable<AssistantResponse["choices"]>[number]) {
    if (busy) return;
    if (choice.confirmation) {
      setBusy(true);
      setError(null);
      setHistory((current) => [...current, { role: "user", text: choice.label }]);
      try {
        const result = await apiRequest<AssistantResponse>("/assistant/query", {
          method: "POST",
          token: accessToken,
          body: {
            query: choice.confirmation.prompt,
            mode: drivingMode ? "driving" : "voice-ready",
            locale,
            confirmation: {
              type: choice.confirmation.type,
              payload: choice.confirmation.payload,
            },
          },
        });
        setResponse(result);
        setHistory((current) => [...current, { role: "assistant", response: result }]);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (choice.query) {
      await ask(choice.query);
    }
  }

  function startVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || listening) {
      return;
    }

    const recognition = new Recognition();
    recognition.lang = locale === "bn" ? "bn-BD" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
      if (transcript) {
        setQuery(transcript);
        void ask(transcript);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function stopSpeaking() {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  }

  function repeatReply() {
    if (!response?.answer || typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(
      [response.answer, ...response.bullets].join(" "),
    );
    utterance.rate = drivingMode ? 0.95 : 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!speakReplies || !response?.answer || typeof window === "undefined") {
      return;
    }

    const spokenBullets = drivingMode ? response.bullets.slice(0, 2) : response.bullets;
    const utterance = new SpeechSynthesisUtterance(
      [response.answer, ...spokenBullets].join(" "),
    );
    utterance.rate = drivingMode ? 0.95 : 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [drivingMode, response, speakReplies]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <section
      className="dashboard-panel dashboard-panel-wide"
      style={{
        position: "fixed",
        top: 88,
        right: 20,
        width: "min(520px, calc(100vw - 32px))",
        maxHeight: "calc(100vh - 110px)",
        overflow: "auto",
        zIndex: 60,
        boxShadow: "0 18px 44px rgba(17, 24, 39, 0.18)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="panel-header">
        <div>
          <p className="section-kicker">{localeText(locale, "Voice Assistant", "ভয়েস অ্যাসিস্ট্যান্ট")}</p>
          <h2>{localeText(locale, roleHeadline(user), "আপনার ভয়েস সহকারীকে জিজ্ঞাসা করুন")}</h2>
          <p className="mini-text" style={{ marginTop: 6 }}>
            {localeText(
              locale,
              "Ask questions by text or voice. Phase 1 focuses on reliable answers from your live dashboard data.",
              "লিখে বা ভয়েসে প্রশ্ন করুন। ফেজ ১ আপনার লাইভ ড্যাশবোর্ড ডেটা থেকে নির্ভরযোগ্য উত্তর দেওয়ার ওপর ফোকাস করছে।",
            )}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="button button-soft"
            style={{ fontSize: "0.8rem", padding: "7px 12px" }}
            onClick={onClose}
          >
            {localeText(locale, "Close", "বন্ধ")}
          </button>
        ) : null}
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
          <input
            type="checkbox"
            checked={speakReplies}
            onChange={(event) => setSpeakReplies(event.target.checked)}
          />
          {localeText(locale, "Speak replies", "উত্তর পড়ে শোনাও")}
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
          <input
            type="checkbox"
            checked={drivingMode}
            onChange={(event) => setDrivingMode(event.target.checked)}
          />
          {localeText(locale, "Driving mode", "ড্রাইভিং মোড")}
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void ask();
            }
          }}
          placeholder={localeText(locale, "What needs my attention today?", "আজ আমার কী বিষয়ে মনোযোগ দেওয়া দরকার?")}
          style={{
            flex: "1 1 360px",
            minHeight: 46,
            borderRadius: 12,
            border: "1px solid var(--line)",
            padding: "0 14px",
            fontSize: "0.96rem",
            background: "#fff",
          }}
        />
        <button
          type="button"
          className="button button-soft"
          onClick={startVoiceInput}
          disabled={busy || listening}
        >
          {listening ? localeText(locale, "Listening…", "শুনছি…") : localeText(locale, "Mic", "মাইক")}
        </button>
        <button
          type="button"
          className="button button-soft"
          onClick={stopSpeaking}
          disabled={busy && !response}
        >
          {localeText(locale, "Stop voice", "ভয়েস বন্ধ")}
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => void ask()}
          disabled={busy || !query.trim()}
        >
          {busy ? localeText(locale, "Thinking…", "ভাবছি…") : localeText(locale, "Ask AI", "AI-কে জিজ্ঞাসা করুন")}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="button button-soft"
            style={{ fontSize: "0.8rem", padding: "7px 12px" }}
            onClick={() => void ask(suggestion)}
            disabled={busy}
          >
            {localizeSuggestion(locale, suggestion)}
          </button>
        ))}
      </div>

      {error ? <div className="error-banner" style={{ marginTop: 14 }}>{error}</div> : null}

      {response ? (
        <article
          className="mini-card"
          style={{
            marginTop: 16,
            border: "1px solid var(--line)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,244,246,0.92))",
          }}
        >
          <div className="mini-card-body">
            <div className="panel-header">
              <div>
                <p className="section-kicker">{localeText(locale, "Assistant reply", "অ্যাসিস্ট্যান্টের উত্তর")}</p>
                <h3 style={{ marginBottom: 6 }}>{response.answer}</h3>
              </div>
              <span className="tag tag-light">{response.scope.replace(/_/g, " ")}</span>
            </div>
            {response.bullets.length ? (
              <ul style={{ margin: "10px 0 0 18px", color: "var(--muted)", lineHeight: 1.6 }}>
                {response.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {response.choices?.length ? (
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {response.choices.map((choice) => (
                  <button
                    key={choice.label}
                    type="button"
                    className="button button-soft"
                    style={{ fontSize: "0.8rem", padding: "7px 12px" }}
                    onClick={() => void chooseOption(choice)}
                    disabled={busy}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            ) : null}
            {response.confirmation ? (
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <span className="mini-text" style={{ fontWeight: 600 }}>
                  {response.confirmation.prompt}
                </span>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void confirmAction()}
                  disabled={busy}
                >
                  {busy ? localeText(locale, "Working…", "কাজ হচ্ছে…") : response.confirmation.label}
                </button>
              </div>
            ) : null}
            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="button button-soft"
                style={{ fontSize: "0.8rem", padding: "7px 12px" }}
                onClick={repeatReply}
                disabled={!response?.answer}
              >
                {localeText(locale, "Repeat", "আবার বলো")}
              </button>
              <button
                type="button"
                className="button button-soft"
                style={{ fontSize: "0.8rem", padding: "7px 12px" }}
                onClick={() => void ask("cancel")}
                disabled={busy}
              >
                {localeText(locale, "Cancel", "বাতিল")}
              </button>
              {drivingMode ? (
                <span className="mini-text" style={{ alignSelf: "center" }}>
                  {localeText(
                    locale,
                    "Driving mode keeps spoken replies shorter and easier to follow.",
                    "ড্রাইভিং মোডে ভয়েস উত্তর ছোট এবং সহজ রাখা হয়।",
                  )}
                </span>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}

      {history.length > 1 ? (
        <article className="mini-card" style={{ marginTop: 14 }}>
          <div className="mini-card-body">
            <div className="panel-header">
              <div>
                <p className="section-kicker">{localeText(locale, "Session", "সেশন")}</p>
                <h3 style={{ marginBottom: 6 }}>{localeText(locale, "Recent assistant flow", "সাম্প্রতিক অ্যাসিস্ট্যান্ট ফ্লো")}</h3>
              </div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {history.slice(-6).map((item, index) =>
                item.role === "user" ? (
                  <div key={`${item.role}-${index}`} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--line-soft)" }}>
                    <strong style={{ display: "block", fontSize: "0.78rem", marginBottom: 4 }}>{localeText(locale, "You", "আপনি")}</strong>
                    <span>{item.text}</span>
                  </div>
                ) : (
                  <div key={`${item.role}-${index}`} style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,244,246,0.9)" }}>
                    <strong style={{ display: "block", fontSize: "0.78rem", marginBottom: 4 }}>{localeText(locale, "Assistant", "অ্যাসিস্ট্যান্ট")}</strong>
                    <span>{item.response.answer}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}
