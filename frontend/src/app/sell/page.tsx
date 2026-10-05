"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

export default function SellCar() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    city: "Islamabad",
    cityArea: "",
    makeModelVersion: "",
    registeredIn: "Islamabad",
    exteriorColor: "White",
    mileage: "",
    price: "",
    description: "",
    mobileNumber: "",
    secondaryNumber: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 8);
      const combined = [...images, ...selectedFiles].slice(0, 8);
      setImages(combined);

      const previews = combined.map((file) => URL.createObjectURL(file));
      setImagePreviewUrls(previews);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, i) => i !== indexToRemove);
    const updatedUrls = imagePreviewUrls.filter((_, i) => i !== indexToRemove);
    setImages(updatedImages);
    setImagePreviewUrls(updatedUrls);
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const file of images) {
      const data = new FormData();
      data.append("file", file);
      try {
        const res = await fetch("http://localhost:8000/api/listings/upload-image", {
          method: "POST",
          body: data,
        });
        if (res.ok) {
          const result = await res.json();
          uploadedUrls.push(`http://localhost:8000${result.image_url}`);
        }
      } catch (err) {
        console.error("Failed to upload image", err);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to your account to post an ad.");
      showToast("Please log in to post an ad", "warning");
      setLoading(false);
      return;
    }

    try {
      const uploadedImageUrls = await uploadImages();
      const mainImageUrl = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : "";
      const extraImages = uploadedImageUrls.slice(1);

      const parts = formData.makeModelVersion.trim().split(" ");
      const make = parts[0] || "Vehicle";
      const model = parts.slice(1).join(" ") || "Model";

      const payload = {
        title: formData.makeModelVersion || "Car for Sale",
        price: parseFloat(formData.price) || 0,
        currency: "PKR",
        location: formData.cityArea ? `${formData.cityArea}, ${formData.city}` : formData.city,
        mileage: parseInt(formData.mileage) || 0,
        make: make,
        model: model,
        description: formData.description,
        owner_contact: formData.mobileNumber,
        color: formData.exteriorColor,
        registered_city: formData.registeredIn !== "Un-Registered" ? formData.registeredIn : null,
        image_url: mainImageUrl,
        extra_images: extraImages,
      };

      const res = await fetch("http://localhost:8000/api/listings/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to post ad.");
      }

      showToast("Listing published successfully! 🎉", "success");
      router.push("/my-ads");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      showToast(err.message || "Failed to post ad", "error");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.makeModelVersion.trim()) {
        showToast("Please enter Make, Model & Version", "warning");
        return;
      }
      if (!formData.mileage) {
        showToast("Please specify current mileage", "warning");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Dynamic Lakh price display helper
  const parsedPrice = parseFloat(formData.price) || 0;
  const lakhPrice = parsedPrice > 0 ? (parsedPrice / 100000).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Breadcrumb & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sky-700 mb-3 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-600" />
            </span>
            Simple 3-Step Process
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Sell Your Car on <span className="gradient-text-sky">VehicleWalay</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Reach verified car buyers across Pakistan. Free listing, takes less than 2 minutes.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="relative flex items-center justify-between">
            {/* Background line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0" />
            {/* Active connecting line */}
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full z-0 transition-all duration-500"
              style={{ width: `${(step - 1) * 45}%` }}
            />

            {[
              { num: 1, label: "Car Details", icon: "🚗" },
              { num: 2, label: "Add Photos", icon: "📸" },
              { num: 3, label: "Price & Details", icon: "💎" },
            ].map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                      isActive
                        ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white ring-4 ring-sky-100 scale-110"
                        : isPast
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
                        : "bg-white border border-slate-300 text-slate-500"
                    }`}
                  >
                    {isPast ? "✓" : s.num}
                  </div>
                  <span
                    className={`mt-2 text-xs font-bold tracking-wide transition-colors ${
                      isActive ? "text-sky-600" : isPast ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card Form Container */}
        <div className="rounded-[2rem] border border-slate-200/90 bg-white shadow-xl shadow-slate-900/[0.04] p-6 sm:p-10 relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: CAR INFORMATION */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Step 1: Vehicle Information
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Provide accurate specs to help prospective buyers match with your car.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Make Model Version */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Make / Model / Version <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="makeModelVersion"
                      value={formData.makeModelVersion}
                      onChange={handleInputChange}
                      placeholder="e.g. Honda Civic Oriel 1.8 i-VTEC, Toyota Corolla Altis 1.6"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all"
                      required
                    />
                    {/* Quick suggestion pills */}
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <span className="text-xs text-slate-400 self-center">Popular:</span>
                      {["Honda Civic", "Toyota Corolla", "Suzuki Swift", "KIA Sportage", "Hyundai Tucson"].map(
                        (pick) => (
                          <button
                            key={pick}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, makeModelVersion: pick })
                            }
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-800 transition-colors"
                          >
                            {pick}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      City Location <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all cursor-pointer"
                    >
                      <option value="Islamabad">Islamabad</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Multan">Multan</option>
                      <option value="Sialkot">Sialkot</option>
                      <option value="Gujranwala">Gujranwala</option>
                    </select>
                  </div>

                  {/* City Area */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Area / Neighborhood
                    </label>
                    <input
                      type="text"
                      name="cityArea"
                      value={formData.cityArea}
                      onChange={handleInputChange}
                      placeholder="e.g. DHA Phase 5, F-7, Gulberg"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all"
                    />
                  </div>

                  {/* Registered In */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Registration City
                    </label>
                    <select
                      name="registeredIn"
                      value={formData.registeredIn}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all cursor-pointer"
                    >
                      <option value="Islamabad">Islamabad</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Sindh">Sindh</option>
                      <option value="KPK">KPK</option>
                      <option value="Un-Registered">Un-Registered</option>
                    </select>
                  </div>

                  {/* Exterior Color */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Exterior Color
                    </label>
                    <select
                      name="exteriorColor"
                      value={formData.exteriorColor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all cursor-pointer"
                    >
                      <option value="White">White</option>
                      <option value="Black">Black</option>
                      <option value="Silver">Silver</option>
                      <option value="Grey">Grey</option>
                      <option value="Blue">Blue</option>
                      <option value="Red">Red</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Golden">Golden</option>
                    </select>
                  </div>

                  {/* Mileage */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Mileage (km) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="mileage"
                        value={formData.mileage}
                        onChange={handleInputChange}
                        placeholder="e.g. 45000"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        KM
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PHOTO UPLOAD */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Step 2: Upload Vehicle Photos
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Ads with clear photos get up to 8x more verified buyer responses. (Max 8 photos)
                  </p>
                </div>

                {/* Dropzone Card */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-sky-300 bg-sky-50/40 p-8 sm:p-12 text-center transition-all duration-300 hover:border-sky-500 hover:bg-sky-50"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 group-hover:scale-110 transition-transform">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-800">
                    Click to browse or drop your photos here
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Supports JPG, PNG, WEBP (Max 5MB each)
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs">
                    <span>Selected: {images.length} / 8 photos</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>

                {/* Photo Previews */}
                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {imagePreviewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`Vehicle Preview ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {index === 0 && (
                          <span className="absolute top-2 left-2 rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-black text-white shadow">
                            COVER PHOTO
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 flex items-center justify-center text-xs transition-colors shadow"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: PRICE & DESCRIPTION */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Step 3: Pricing & Contact Details
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Set a competitive price and write a transparent description to generate buyer trust.
                  </p>
                </div>

                {/* Price Input with Dynamic Lakh Tag */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Selling Price (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 3500000"
                      className="w-full px-4 py-4 bg-white border border-slate-300 rounded-2xl text-2xl font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                      PKR
                    </span>
                  </div>

                  {/* Dynamic Lakh Tag Badge */}
                  {lakhPrice && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-sky-50 border border-sky-200 px-4 py-2 text-xs font-bold text-sky-800">
                      <span>💎 Visual Preview:</span>
                      <span className="text-sm font-black text-sky-700">
                        PKR {lakhPrice} Lakh
                      </span>
                      <span className="ml-auto text-[11px] text-slate-500 font-medium">
                        (Formatted for Pakistani marketplace)
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Ad Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe vehicle condition: First owner, genuine paint, dealership maintained, spotless interior, fresh tires..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-sm font-medium transition-all resize-none"
                    required
                  />
                </div>

                {/* Phone Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Primary Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="03001234567"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Secondary Contact Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="secondaryNumber"
                      value={formData.secondaryNumber}
                      onChange={handleInputChange}
                      placeholder="03009876543"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-xs"
                >
                  ← Back
                </button>
              ) : (
                <Link
                  href="/"
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm shadow-md shadow-sky-500/25 hover:scale-[1.01] hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>Continue</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`shimmer-btn px-10 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 hover:scale-[1.01] transition-all flex items-center gap-2 ${
                    loading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Publishing Ad...</span>
                    </>
                  ) : (
                    <>
                      <span>Publish Listing Now</span>
                      <span>🚗</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
