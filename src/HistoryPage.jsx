import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function HistoryPage() {
  const [config, setConfig] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistoryData() {
      const [configRes, historyRes] = await Promise.all([
        supabase.from('mandir_history_config').select('*').limit(1).single(),
        supabase
          .from('mandir_history')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
      ]);

      if (configRes.data) {
        setConfig(configRes.data);
      }

      if (historyRes.data) {
        setHistoryItems(historyRes.data);
      }

      setLoading(false);
    }

    fetchHistoryData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Dynamic Header */}
        {(config?.page_title || config?.page_subtitle) && (
          <div className="text-center space-y-3">
            {config.page_title && (
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                {config.page_title}
              </h1>
            )}
            {config.page_subtitle && (
              <p className="text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
                {config.page_subtitle}
              </p>
            )}
            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 mx-auto rounded-full mt-3" />
          </div>
        )}

        {/* Dynamic Introduction / Overview Card */}
        {(config?.intro_heading || config?.intro_body) && (
          <div className="bg-white border border-amber-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
            {config.intro_heading && (
              <h2 className="text-lg sm:text-xl font-bold text-orange-900 mb-3 border-b border-amber-100 pb-2">
                {config.intro_heading}
              </h2>
            )}
            {config.intro_body && (
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base whitespace-pre-line text-justify sm:text-left">
                {config.intro_body}
              </p>
            )}
          </div>
        )}

        {/* Vertical Timeline */}
        {historyItems.length > 0 && (
          <div className="relative border-l-2 border-orange-300 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-10">
            {historyItems.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline Node Icon */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-orange-600 border-4 border-stone-50 shadow" />

                <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-7 shadow-sm transition hover:shadow-md hover:border-orange-300 space-y-4">
                  {/* Era Badge & Order */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {item.era_period && (
                      <span className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
                        {item.era_period}
                      </span>
                    )}
                    {item.display_order !== null && item.display_order !== undefined && (
                      <span className="text-xs font-semibold text-stone-400">
                        टप्पा #{item.display_order}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  {item.title && (
                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-orange-900 transition-colors">
                      {item.title}
                    </h3>
                  )}

                  {/* Optional Historical Photograph */}
                  {item.image_url && (
                    <div className="overflow-hidden rounded-xl border border-stone-200">
                      <img
                        src={item.image_url}
                        alt={item.title || 'इतिहास संदर्भ'}
                        className="w-full max-h-72 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="text-stone-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                      {item.description}
                    </p>
                  )}

                  {/* Key Significance / Takeaway */}
                  {item.key_takeaway && (
                    <div className="bg-amber-50/70 border-l-4 border-amber-500 rounded-r-lg p-3 text-xs sm:text-sm text-stone-800 font-medium">
                      {item.key_takeaway}
                    </div>
                  )}

                  {/* Historical Source Citation */}
                  {item.source_reference && (
                    <div className="text-xs text-stone-500 italic pt-1 border-t border-stone-100">
                      संदर्भ: {item.source_reference}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}