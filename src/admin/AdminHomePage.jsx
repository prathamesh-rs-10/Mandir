import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const EMPTY_STATE = {
  hero_title: "",
  hero_subtitle: "",
  location_tag: "",
  slogan: "",
  editorial_title: "",
  editorial_quote: "",
  editorial_body: "",
  concepts_title: "",
  concepts_subtitle: "",
  concepts_list: [],
  cta_title: "",
  cta_desc: "",
  cta_btn_primary_text: "",
  cta_btn_secondary_text: "",
};

export default function AdminHomePage({ showNotification }) {
  const [formData, setFormData] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    supabase
      .from("mandir_home_content")
      .select("*")
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setFormData({
            ...data,
            hero_title: data.hero_title ?? "",
            hero_subtitle: data.hero_subtitle ?? "",
            location_tag: data.location_tag ?? "",
            slogan: data.slogan ?? "",
            editorial_title: data.editorial_title ?? "",
            editorial_quote: data.editorial_quote ?? "",
            editorial_body: data.editorial_body ?? "",
            concepts_title: data.concepts_title ?? "",
            concepts_subtitle: data.concepts_subtitle ?? "",
            concepts_list: Array.isArray(data.concepts_list)
              ? data.concepts_list
              : [],
            cta_title: data.cta_title ?? "",
            cta_desc: data.cta_desc ?? "",
            cta_btn_primary_text: data.cta_btn_primary_text ?? "",
            cta_btn_secondary_text: data.cta_btn_secondary_text ?? "",
          });
        }
        setFetching(false);
      });
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConceptChange = (index, field, value) => {
    const updatedList = [...formData.concepts_list];
    updatedList[index] = { ...updatedList[index], [field]: value };
    setFormData((prev) => ({ ...prev, concepts_list: updatedList }));
  };

  const handleAddConcept = () => {
    setFormData((prev) => ({
      ...prev,
      concepts_list: [...prev.concepts_list, { num: "", title: "", desc: "" }],
    }));
  };

  const handleRemoveConcept = (index) => {
    setFormData((prev) => ({
      ...prev,
      concepts_list: prev.concepts_list.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id: formData.id || 1,
      hero_title: formData.hero_title,
      hero_subtitle: formData.hero_subtitle,
      location_tag: formData.location_tag,
      slogan: formData.slogan,
      editorial_title: formData.editorial_title,
      editorial_quote: formData.editorial_quote,
      editorial_body: formData.editorial_body,
      concepts_title: formData.concepts_title,
      concepts_subtitle: formData.concepts_subtitle,
      concepts_list: formData.concepts_list,
      cta_title: formData.cta_title,
      cta_desc: formData.cta_desc,
      cta_btn_primary_text: formData.cta_btn_primary_text,
      cta_btn_secondary_text: formData.cta_btn_secondary_text,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("mandir_home_content")
      .upsert(payload);
    setLoading(false);

    if (!error) {
      if (typeof showNotification === "function") {
        showNotification("मुख्य पृष्ठ माहिती यशस्वीरित्या सेव्ह झाली!");
      } else {
        alert("मुख्य पृष्ठ माहिती यशस्वीरित्या सेव्ह झाली!");
      }
    } else {
      if (typeof showNotification === "function") {
        showNotification("त्रुटी: " + error.message, "error");
      } else {
        alert("त्रुटी: " + error.message);
      }
    }
  };

  if (fetching) {
    return (
      <div className="p-8 text-center text-stone-500 font-medium">
        डेटा लोड करत आहे...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="border-b border-stone-200 pb-3">
        <h2 className="text-xl font-bold text-stone-800">
          मुख्य पृष्ठ व्यवस्थापन (Home Page CMS)
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          येथील सर्व बदल थेट डेटाबेसमध्ये जतन होतात आणि मुख्य पृष्ठावर प्रदर्शित
          होतात.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Hero Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-orange-800 border-b pb-2">
            १. मुख्य बॅनर (Hero Section)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                मंदिराचे मुख्य नाव (Hero Title)
              </label>
              <input
                type="text"
                value={formData.hero_title}
                onChange={(e) =>
                  handleFieldChange("hero_title", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                उपशीर्षक (Hero Subtitle)
              </label>
              <input
                type="text"
                value={formData.hero_subtitle}
                onChange={(e) =>
                  handleFieldChange("hero_subtitle", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                स्थान टॅग (Location Tag)
              </label>
              <input
                type="text"
                value={formData.location_tag}
                onChange={(e) =>
                  handleFieldChange("location_tag", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                घोषवाक्य (Slogan Badge)
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => handleFieldChange("slogan", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Editorial */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-orange-800 border-b pb-2">
            २. अग्रलेख व विचार (Editorial Section)
          </h3>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              अग्रलेख शीर्षक (Title)
            </label>
            <input
              type="text"
              value={formData.editorial_title}
              onChange={(e) =>
                handleFieldChange("editorial_title", e.target.value)
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              प्रमुख विचार / कोट (Quote)
            </label>
            <input
              type="text"
              value={formData.editorial_quote}
              onChange={(e) =>
                handleFieldChange("editorial_quote", e.target.value)
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              विस्तृत माहिती व प्रास्ताविक (Editorial Body)
            </label>
            <textarea
              rows="5"
              value={formData.editorial_body}
              onChange={(e) =>
                handleFieldChange("editorial_body", e.target.value)
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 3: Architecture Concepts */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 gap-2">
            <h3 className="text-base font-bold text-orange-800">
              ३. मंदिर संकल्पना कार्ड्स (Architecture Concepts)
            </h3>
            <button
              type="button"
              onClick={handleAddConcept}
              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold px-3 py-1.5 rounded-lg border border-orange-300 transition"
            >
              + नवीन कार्ड जोडा
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                विभाग शीर्षक
              </label>
              <input
                type="text"
                value={formData.concepts_title}
                onChange={(e) =>
                  handleFieldChange("concepts_title", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                उपशीर्षक
              </label>
              <input
                type="text"
                value={formData.concepts_subtitle}
                onChange={(e) =>
                  handleFieldChange("concepts_subtitle", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {formData.concepts_list.map((card, idx) => (
              <div
                key={idx}
                className="p-4 bg-orange-50/40 border border-orange-200 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="w-24">
                    <input
                      type="text"
                      placeholder="क्रमांक"
                      value={card.num || ""}
                      onChange={(e) =>
                        handleConceptChange(idx, "num", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border rounded text-xs bg-white font-semibold text-center"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="शीर्षक"
                      value={card.title || ""}
                      onChange={(e) =>
                        handleConceptChange(idx, "title", e.target.value)
                      }
                      className="w-full px-3 py-1.5 border rounded text-sm bg-white font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveConcept(idx)}
                    className="text-xs text-red-600 hover:text-red-800 p-1.5 rounded transition"
                  >
                    हटवा
                  </button>
                </div>
                <div>
                  <textarea
                    rows="2"
                    placeholder="माहिती / वर्णन"
                    value={card.desc || ""}
                    onChange={(e) =>
                      handleConceptChange(idx, "desc", e.target.value)
                    }
                    className="w-full px-3 py-1.5 border rounded text-xs bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Call to Action */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-orange-800 border-b pb-2">
            ४. सहभाग व आवाहन विभाग (Action CTA)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                आवाहन मुख्य शीर्षक
              </label>
              <input
                type="text"
                value={formData.cta_title}
                onChange={(e) => handleFieldChange("cta_title", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                आवाहन संदेश मजकूर
              </label>
              <textarea
                rows="3"
                value={formData.cta_desc}
                onChange={(e) => handleFieldChange("cta_desc", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                प्राथमिक बटण मजकूर
              </label>
              <input
                type="text"
                value={formData.cta_btn_primary_text}
                onChange={(e) =>
                  handleFieldChange("cta_btn_primary_text", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                दुय्यम बटण मजकूर
              </label>
              <input
                type="text"
                value={formData.cta_btn_secondary_text}
                onChange={(e) =>
                  handleFieldChange("cta_btn_secondary_text", e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-orange-200 shadow-xl flex items-center justify-between">
          <p className="text-xs text-stone-500">
            सर्व बदल त्वरित मुख्य पृष्ठावर लागू होतील.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow-md"
          >
            {loading ? "जतन करत आहे..." : "सर्व बदल सेव्ह करा"}
          </button>
        </div>
      </form>
    </div>
  );
}
