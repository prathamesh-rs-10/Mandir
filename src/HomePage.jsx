import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const BUCKET_NAME = "temple-assets";

/**
 * Normalizes image paths to ensure valid rendering across
 * Supabase Storage public URLs, external URLs, and Base64 strings.
 */
function resolveImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // Return as-is if already an absolute HTTP(S) link or Base64 data URI
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Resolve relative Supabase storage paths (e.g. "home/hero-bg-123.jpg")
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(trimmed);
  return data?.publicUrl || trimmed;
}

export default function HomePage({ onNavigate }) {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHomeContent() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("mandir_home_content")
          .select("*")
          .limit(1)
          .single();

        if (fetchError) throw fetchError;

        if (isMounted && data) {
          // Normalize concepts_list if stored as a stringified JSON
          let parsedConcepts = [];
          if (Array.isArray(data.concepts_list)) {
            parsedConcepts = data.concepts_list;
          } else if (typeof data.concepts_list === "string") {
            try {
              parsedConcepts = JSON.parse(data.concepts_list);
            } catch {
              parsedConcepts = [];
            }
          }

          setHomeData({
            ...data,
            hero_image_url: resolveImageUrl(data.hero_image_url),
            concepts_list: parsedConcepts.map((item) => ({
              ...item,
              image_url: resolveImageUrl(item.image_url),
            })),
          });
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHomeContent();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/30 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-stone-600">माहिती लोड होत आहे...</p>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-stone-600 font-medium">
          {error ? `माहिती मिळवण्यात त्रुटी: ${error}` : "कोणतीही माहिती उपलब्ध नाही."}
        </p>
      </div>
    );
  }

  const hasConcepts =
    Array.isArray(homeData.concepts_list) && homeData.concepts_list.length > 0;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased">
      {/* 1. Hero Banner */}
      {homeData.show_hero_section !== false && (
        <section className="relative overflow-hidden bg-gradient-to-b from-orange-700 via-amber-700 to-amber-800 text-white py-24 px-4 text-center shadow-xl">
          {/* Background Layer with reduced blur and scale */}
          {homeData.hero_image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 filter blur-xs sm:blur-sm opacity-50 transition-all duration-700 pointer-events-none"
              style={{ backgroundImage: `url("${homeData.hero_image_url}")` }}
              aria-hidden="true"
            />
          )}

          {/* Dark Tint Overlay to maintain text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-orange-950/45 to-black/65 pointer-events-none" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-4xl mx-auto space-y-5">
            {homeData.location_tag && (
              <div className="inline-flex items-center gap-2 bg-black/40 border border-orange-200/40 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide backdrop-blur-md">
                <span>📍</span>
                <span>{homeData.location_tag}</span>
              </div>
            )}

            {homeData.hero_title && (
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-amber-50 drop-shadow-md leading-tight">
                {homeData.hero_title}
              </h1>
            )}

            {homeData.hero_subtitle && (
              <h2 className="text-lg sm:text-2xl font-semibold text-orange-100 max-w-2xl mx-auto drop-shadow">
                {homeData.hero_subtitle}
              </h2>
            )}

            {homeData.slogan && (
              <div className="pt-2">
                <span className="inline-block bg-orange-950/70 border border-amber-300/40 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg text-xs sm:text-sm md:text-base font-medium text-amber-100">
                  {homeData.slogan}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Editorial Vision */}
      {homeData.show_editorial_section !== false &&
        (homeData.editorial_title ||
          homeData.editorial_quote ||
          homeData.editorial_body) && (
          <section className="max-w-4xl mx-auto py-16 px-6">
            {homeData.editorial_title && (
              <div className="text-center mb-8">
                <span className="text-xs uppercase tracking-widest text-orange-700 font-bold bg-orange-100 px-3.5 py-1.5 rounded-full border border-orange-200">
                  {homeData.editorial_title}
                </span>
                <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-amber-400 mx-auto mt-3 rounded-full" />
              </div>
            )}

            {homeData.editorial_quote && (
              <div className="relative mb-8 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="text-4xl text-orange-400 font-serif absolute -top-4 left-6 bg-stone-50 px-2 rounded leading-none select-none">
                  “
                </div>
                <p className="text-lg sm:text-xl font-medium italic text-stone-800 leading-relaxed text-center">
                  {homeData.editorial_quote}
                </p>
              </div>
            )}

            {homeData.editorial_body && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm leading-relaxed text-base sm:text-lg text-stone-700 whitespace-pre-line text-justify sm:text-center">
                {homeData.editorial_body}
              </div>
            )}
          </section>
        )}

      {/* 3. Architectural Concept Grid */}
      {homeData.show_concepts_section !== false && hasConcepts && (
        <section className="bg-white py-16 px-6 border-y border-orange-100">
          <div className="max-w-6xl mx-auto">
            {(homeData.concepts_title || homeData.concepts_subtitle) && (
              <div className="text-center mb-12">
                {homeData.concepts_title && (
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                    {homeData.concepts_title}
                  </h2>
                )}
                {homeData.concepts_subtitle && (
                  <p className="text-stone-500 text-sm sm:text-base mt-2 max-w-xl mx-auto">
                    {homeData.concepts_subtitle}
                  </p>
                )}
                <div className="w-16 h-1 bg-orange-500 mx-auto mt-4 rounded-full" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {homeData.concepts_list.map((item, index) => (
                <div
                  key={index}
                  className="group bg-amber-50/40 hover:bg-white border border-amber-200/70 hover:border-orange-400 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between"
                >
                  {/* Card Image Banner */}
                  {item.image_url ? (
                    <div className="relative w-full h-48 overflow-hidden bg-stone-100">
                      <img
                        src={item.image_url}
                        alt={item.title || "Concept Image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {item.num && (
                        <span className="absolute top-3 left-3 text-xs font-bold text-orange-900 bg-white/90 backdrop-blur-sm border border-orange-200 px-3 py-1 rounded-md shadow-sm">
                          {item.num}
                        </span>
                      )}
                    </div>
                  ) : (
                    item.num && (
                      <div className="pt-6 px-6">
                        <span className="text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200 px-3 py-1 rounded-md inline-block">
                          {item.num}
                        </span>
                      </div>
                    )
                  )}

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    {item.title && (
                      <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-700 transition-colors">
                        {item.title}
                      </h3>
                    )}
                    {item.desc && (
                      <p className="text-sm text-stone-600 leading-relaxed">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Action CTA */}
      {homeData.show_cta_section !== false &&
        (homeData.cta_title ||
          homeData.cta_desc ||
          homeData.cta_btn_primary_text ||
          homeData.cta_btn_secondary_text) && (
          <section className="py-16 px-6 bg-gradient-to-b from-orange-50 to-amber-100/50">
            <div className="max-w-3xl mx-auto text-center bg-white border border-amber-200/90 rounded-3xl p-8 sm:p-12 shadow-lg">
              {homeData.cta_title && (
                <h3 className="text-2xl sm:text-3xl font-extrabold text-orange-950 mb-4 tracking-tight">
                  {homeData.cta_title}
                </h3>
              )}
              {homeData.cta_desc && (
                <p className="text-stone-600 mb-8 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                  {homeData.cta_desc}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {homeData.cta_btn_primary_text && (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate("donations")}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    {homeData.cta_btn_primary_text}
                  </button>
                )}
                {homeData.cta_btn_secondary_text && (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate("reports")}
                    className="bg-white hover:bg-stone-50 text-orange-900 font-bold px-7 py-3.5 border-2 border-orange-300 hover:border-orange-400 rounded-xl shadow-sm transition-all"
                  >
                    {homeData.cta_btn_secondary_text}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
    </div>
  );
}
