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

  const CURRENT_YEAR = 2026;
  const YEARS = Array.from({ length: 37 }, (_, i) => 2026 - i);

  // Anti-fake / Odometer validation helper
  const checkMileageValidity = (
    mileageStr: string,
    modelYearStr: string,
    condition: string
  ): {
    isValid: boolean;
    status: "idle" | "valid" | "warning" | "error";
    message: string;
  } => {
    const trimmed = mileageStr.trim();
    if (!trimmed) {
      return { isValid: false, status: "idle", message: "" };
    }

    const val = Number(trimmed);
    if (isNaN(val) || val < 0 || !Number.isInteger(val)) {
      return {
        isValid: false,
        status: "error",
        message: "Please enter a valid whole number for mileage (km).",
      };
    }

    // 1. Obvious Dummy Sequences (e.g. 123, 1234, 12345, 321, 4321)
    const dummySequences = [
      "123",
      "1234",
      "12345",
      "123456",
      "1234567",
      "234",
      "345",
      "456",
      "567",
      "678",
      "789",
      "321",
      "4321",
      "54321",
      "987",
      "9876",
      "98765",
    ];
    if (dummySequences.includes(trimmed)) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Dummy sequence detected ('${trimmed}'). Fake listings are prevented. Please enter genuine odometer reading.`,
      };
    }

    // 2. Repetitive digits (e.g. 111, 222, 999, 1111, 99999, 0000)
    if (/^(\d)\1{2,}$/.test(trimmed)) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Suspicious repeating digit pattern ('${trimmed}'). Please enter genuine vehicle mileage.`,
      };
    }

    // 3. Brand New Car Checks
    if (condition === "New") {
      if (val > 500) {
        return {
          isValid: false,
          status: "error",
          message: `🚫 Brand new (zero meter) cars cannot exceed 500 km delivery mileage. Switch to 'Used' for driven cars.`,
        };
      }
      return {
        isValid: true,
        status: "valid",
        message: `✓ Showroom delivery / Zero meter mileage verified (${val} km).`,
      };
    }

    // 4. Used Car - Minimum Realistic Mileage
    if (val < 50) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Used vehicle cannot realistically have under 50 km. For brand new cars, select 'Brand New' condition.`,
      };
    }

    // 5. Model Year vs Mileage Anomaly (Odometer Rollback / Meter Tampering)
    const year = parseInt(modelYearStr) || CURRENT_YEAR;
    const age = Math.max(0, CURRENT_YEAR - year);

    if (age >= 10 && val < 3000) {
      return {
        isValid: false,
        status: "error",
        message: `⚠️ Odometer anomaly: A ${age}-year-old vehicle (${year}) cannot realistically have only ${val.toLocaleString()} km. Reading looks fake or rolled back.`,
      };
    }

    if (age >= 5 && val < 1500) {
      return {
        isValid: false,
        status: "error",
        message: `⚠️ Unusually low mileage for a ${year} vehicle (${val.toLocaleString()} km for ${age} years). Odometer rollback detected.`,
      };
    }

    if (age >= 2 && val < 500) {
      return {
        isValid: false,
        status: "error",
        message: `⚠️ Unrealistic mileage for a ${age}-year-old used vehicle (${val} km).`,
      };
    }

    // 6. Excessive / Impossible High Mileage
    if (val > 1000000) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Unrealistic mileage: Value exceeds 1,000,000 km. Please verify your odometer.`,
      };
    }

    const yearlyAvg = age > 0 ? Math.round(val / age) : val;
    if (age > 0 && yearlyAvg > 90000) {
      return {
        isValid: true,
        status: "warning",
        message: `⚠️ Exceptionally high usage: ~${yearlyAvg.toLocaleString()} km/year. Please ensure this is not a typo.`,
      };
    }

    return {
      isValid: true,
      status: "valid",
      message: `✓ Genuine odometer verified (~${yearlyAvg.toLocaleString()} km/year estimated usage).`,
    };
  };

  // Real-time Unusual Pricing Anomaly & Fraud Prevention Validator
  const checkPriceValidity = (
    priceStr: string,
    modelYearStr: string,
    condition: string
  ): {
    isValid: boolean;
    status: "idle" | "valid" | "warning" | "error";
    message: string;
    lakhFormatted?: string;
    croreFormatted?: string;
  } => {
    const trimmed = priceStr.trim();
    if (!trimmed) {
      return { isValid: false, status: "idle", message: "" };
    }

    const val = Number(trimmed);
    if (isNaN(val) || val < 0) {
      return {
        isValid: false,
        status: "error",
        message: "Please enter a valid numeric vehicle price in PKR.",
      };
    }

    // 1. Obvious Dummy Sequences (e.g., 123, 1234, 12345, 123456, 111111)
    const dummySequences = [
      "123",
      "1234",
      "12345",
      "123456",
      "1234567",
      "111111",
      "222222",
      "333333",
      "444444",
      "555555",
      "999999",
      "9999999",
      "12345678",
      "000000",
    ];
    if (dummySequences.includes(trimmed)) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Suspicious dummy price ('${trimmed}'). Fake listings are prevented. Please enter genuine asking price.`,
      };
    }

    // 2. Minimum realistic vehicle price (PKR 50,000)
    if (val < 50000) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Unusually low price: PKR ${val.toLocaleString()} is unrealistic. Minimum vehicle listing price is PKR 50,000. Low token prices (e.g. 5,000) are blocked to prevent clickbait ads.`,
      };
    }

    // 3. Maximum realistic price (PKR 100 Crore / 1,000,000,000)
    if (val > 1000000000) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Unusually high price: Exceeds PKR 100 Crore. Please verify your asking price.`,
      };
    }

    const year = parseInt(modelYearStr) || CURRENT_YEAR;
    const crore = val >= 10000000 ? (val / 10000000).toFixed(2) : null;
    const lakh = (val / 100000).toFixed(2);

    // 4. Anomaly warning for under-priced recent models (e.g. 2021-2026 car under 5 Lakh)
    if (year >= 2021 && val < 500000) {
      return {
        isValid: true,
        status: "warning",
        message: `⚠️ Unusually low price for a ${year} vehicle (PKR ${lakh} Lakh). Ads priced severely below market rate are flagged for AI scam verification.`,
        lakhFormatted: lakh,
        croreFormatted: crore || undefined,
      };
    }

    // 5. Brand New price anomaly (e.g. 2026 Brand New under 15 Lakh)
    if (condition === "New" && val < 1500000) {
      return {
        isValid: true,
        status: "warning",
        message: `⚠️ Unusually low price for a 2026 Brand New vehicle (PKR ${lakh} Lakh). Please verify this is not a down-payment only.`,
        lakhFormatted: lakh,
        croreFormatted: crore || undefined,
      };
    }

    return {
      isValid: true,
      status: "valid",
      message: crore
        ? `✓ Realistic asking price verified: PKR ${crore} Crore (PKR ${val.toLocaleString()})`
        : `✓ Realistic asking price verified: PKR ${lakh} Lakh (PKR ${val.toLocaleString()})`,
      lakhFormatted: lakh,
      croreFormatted: crore || undefined,
    };
  };

  // Real-time Deceptive / Scam Content Detection Validator
  const checkDescriptionValidity = (
    descStr: string
  ): {
    isValid: boolean;
    status: "idle" | "valid" | "warning" | "error";
    message: string;
    flaggedKeywords: string[];
  } => {
    const trimmed = descStr.trim();
    if (!trimmed) {
      return { isValid: false, status: "idle", message: "", flaggedKeywords: [] };
    }

    // 1. Minimum character requirement
    if (trimmed.length < 15) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Description is too brief (${trimmed.length}/15 chars). Transparent descriptions attract genuine buyers.`,
        flaggedKeywords: [],
      };
    }

    // 2. Dummy / repetitive spam patterns (e.g. asdfasdf, aaaaaa, 111111)
    if (/([a-zA-Z0-9])\1{5,}/.test(trimmed)) {
      return {
        isValid: false,
        status: "error",
        message: `🚫 Repetitive or dummy character spam detected. Please write genuine vehicle details.`,
        flaggedKeywords: [],
      };
    }

    // 3. Deceptive advance payment & wire scam keywords
    const scamKeywordDict = [
      "urgent money",
      "need money urgently",
      "send advance",
      "advance payment",
      "bayana online",
      "bayana",
      "token money online",
      "pehle advance",
      "western union",
      "easypaisa advance",
      "jazzcash advance",
      "transfer before delivery",
      "shipping available",
      "delivery to your doorstep",
      "whatsapp only",
    ];

    const lowerDesc = trimmed.toLowerCase();
    const matched = scamKeywordDict.filter((phrase) => lowerDesc.includes(phrase));

    if (matched.length > 0) {
      const labels = matched.map((m) => `"${m}"`).join(", ");
      return {
        isValid: false,
        status: "error",
        message: `⚠️ Deceptive Phrasing Flagged: High scam phrases detected (${labels}). Demanding advance payment or Bayana before physical inspection is strictly prohibited on VehicleWalay.`,
        flaggedKeywords: matched,
      };
    }

    if (trimmed.length < 35) {
      return {
        isValid: true,
        status: "warning",
        message: `⚠️ Good start, but adding details about tyres, inspection condition, token tax, and maintenance history will attract more buyers.`,
        flaggedKeywords: [],
      };
    }

    return {
      isValid: true,
      status: "valid",
      message: `✓ Transparent description verified. Detailed vehicle information builds buyer trust.`,
      flaggedKeywords: [],
    };
  };

  interface UploadedPhoto {
    id: string;
    file: File;
    previewUrl: string;
    serverUrl?: string;
    uploading: boolean;
    analyzed: boolean;
    aiConfigured?: boolean;
    faceDetected?: boolean;
    isVehicle?: boolean | null;
    privacyWarning?: string | null;
    aiFeedback?: string | null;
    error?: string | null;
  }

  const [formData, setFormData] = useState({
    condition: "Used", // "Used" | "New"
    modelYear: "2022",
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

  const mileageValidation = checkMileageValidity(
    formData.mileage,
    formData.modelYear,
    formData.condition
  );

  const priceValidation = checkPriceValidity(
    formData.price,
    formData.modelYear,
    formData.condition
  );

  const descValidation = checkDescriptionValidity(formData.description);

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    if (formData.condition === "New" && newYear !== "2026") {
      setFormData((prev) => ({
        ...prev,
        modelYear: newYear,
        condition: "Used",
      }));
      showToast(`Vehicles from ${newYear} must be listed as Used.`, "warning");
    } else {
      setFormData((prev) => ({ ...prev, modelYear: newYear }));
    }
  };

  const uploadSinglePhoto = async (photoId: string, file: File) => {
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/api/listings/upload-image", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        const result = await res.json();
        setPhotos((prev) =>
          prev.map((p) => {
            if (p.id === photoId) {
              return {
                ...p,
                serverUrl: `http://localhost:8000${result.image_url}`,
                uploading: false,
                analyzed: !!result.analyzed,
                aiConfigured: !!result.ai_configured,
                faceDetected: !!result.face_detected,
                isVehicle: result.is_vehicle,
                privacyWarning: result.privacy_warning,
                aiFeedback: result.ai_feedback,
              };
            }
            return p;
          })
        );
        if (result.face_detected) {
          showToast("👤 Human face detected in photo. Seller privacy alert!", "warning");
        } else if (result.is_vehicle === false) {
          showToast("⚠️ Non-vehicle photo detected: " + (result.ai_feedback || "Please upload car photo."), "warning");
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? { ...p, uploading: false, analyzed: false, isVehicle: null, error: "Upload failed" }
            : p
        )
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const availableSlots = 8 - photos.length;
      if (availableSlots <= 0) {
        showToast("Maximum of 8 photos reached.", "info");
        return;
      }

      const filesToAdd = selectedFiles.slice(0, availableSlots);
      const newPhotoObjects: UploadedPhoto[] = filesToAdd.map((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id,
          file,
          previewUrl: URL.createObjectURL(file),
          uploading: true,
          analyzed: false,
        };
      });

      setPhotos((prev) => [...prev, ...newPhotoObjects]);

      // Upload and analyze each in parallel with Vision AI
      newPhotoObjects.forEach((photoObj) => {
        uploadSinglePhoto(photoObj.id, photoObj.file);
      });
    }
  };

  const removePhoto = (idToRemove: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === idToRemove);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch (_) {}
      }
      return prev.filter((p) => p.id !== idToRemove);
    });
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

    // 1. Mileage validation
    const mileageCheck = checkMileageValidity(
      formData.mileage,
      formData.modelYear,
      formData.condition
    );
    if (!mileageCheck.isValid) {
      setError(mileageCheck.message);
      showToast(mileageCheck.message, "error");
      setLoading(false);
      setStep(1);
      return;
    }

    // 2. Price anomaly validation
    const priceCheck = checkPriceValidity(
      formData.price,
      formData.modelYear,
      formData.condition
    );
    if (!priceCheck.isValid) {
      setError(priceCheck.message);
      showToast(priceCheck.message, "error");
      setLoading(false);
      setStep(3);
      return;
    }

    // 3. Deceptive / Scam description validation
    const descCheck = checkDescriptionValidity(formData.description);
    if (!descCheck.isValid) {
      setError(descCheck.message);
      showToast(descCheck.message, "error");
      setLoading(false);
      setStep(3);
      return;
    }

    // 4. Check if photos still scanning
    const stillUploading = photos.some((p) => p.uploading);
    if (stillUploading) {
      setError("Please wait for all vehicle photos to finish AI vision scanning.");
      showToast("Photos still analyzing...", "info");
      setLoading(false);
      return;
    }

    try {
      const validServerUrls = photos
        .map((p) => p.serverUrl)
        .filter(Boolean) as string[];
      const mainImageUrl = validServerUrls.length > 0 ? validServerUrls[0] : "";
      const extraImages = validServerUrls.slice(1);

      const parts = formData.makeModelVersion.trim().split(" ");
      const make = parts[0] || "Vehicle";
      const model = parts.slice(1).join(" ") || "Model";

      const payload = {
        title: `${formData.makeModelVersion} ${formData.modelYear}`.trim(),
        price: parseFloat(formData.price) || 0,
        currency: "PKR",
        location: formData.cityArea ? `${formData.cityArea}, ${formData.city}` : formData.city,
        model_year: parseInt(formData.modelYear) || 2026,
        mileage: parseInt(formData.mileage) || 0,
        make: make,
        model: model,
        description: `${formData.condition === "New" ? "[Brand New / Zero Meter] " : ""}${formData.description}`,
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
      if (!formData.modelYear) {
        showToast("Please select Model Year", "warning");
        return;
      }
      if (formData.condition === "New" && formData.modelYear !== "2026") {
        showToast("Brand New condition is only valid for 2026 models.", "error");
        return;
      }
      if (!formData.mileage) {
        showToast("Please specify current mileage", "warning");
        return;
      }

      const mileageCheck = checkMileageValidity(
        formData.mileage,
        formData.modelYear,
        formData.condition
      );
      if (!mileageCheck.isValid) {
        showToast(mileageCheck.message, "error");
        return;
      }
    }

    if (step === 2) {
      if (photos.some((p) => p.uploading)) {
        showToast("Please wait for AI photo scanning to complete.", "info");
        return;
      }
      if (photos.some((p) => p.isVehicle === false)) {
        showToast("Please remove non-vehicle photos before proceeding.", "warning");
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

                {/* VEHICLE CONDITION: USED vs BRAND NEW */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Vehicle Condition <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      Brand New is restricted to 2026 models
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Used Car Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, condition: "Used" }))
                      }
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.condition === "Used"
                          ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-200/80 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          formData.condition === "Used"
                            ? "bg-sky-500 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        🚗
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Used Vehicle
                          </span>
                          {formData.condition === "Used" && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Driven, registered, or pre-owned car in Pakistan
                        </p>
                      </div>
                    </button>

                    {/* Brand New Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.modelYear !== "2026") {
                          setFormData((prev) => ({
                            ...prev,
                            condition: "New",
                            modelYear: "2026",
                          }));
                          showToast(
                            "Brand New applied (Model Year set to 2026)",
                            "info"
                          );
                        } else {
                          setFormData((prev) => ({ ...prev, condition: "New" }));
                        }
                      }}
                      className={`relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.condition === "New"
                          ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200/80 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          formData.condition === "New"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        ✨
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Brand New
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                            2026 ONLY
                          </span>
                          {formData.condition === "New" && (
                            <span className="ml-auto rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-black">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Zero meter showroom delivery (Max 500 km delivery mileage)
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Model Year */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Model Year <span className="text-rose-500">*</span>
                      </label>
                      {formData.condition === "New" && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Locked to 2026 for Brand New
                        </span>
                      )}
                    </div>
                    <select
                      name="modelYear"
                      value={formData.modelYear}
                      onChange={handleYearChange}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium text-sm transition-all cursor-pointer"
                    >
                      {YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} {yr === 2026 ? "(Current Year)" : ""}
                        </option>
                      ))}
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
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-800 transition-colors cursor-pointer"
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

                  {/* Empty spacer or secondary info */}
                  <div className="hidden md:block" />

                  {/* Mileage with Real-time Anti-Fake AI Verification */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Mileage (km) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        AI Odometer Fraud Prevention Active
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        name="mileage"
                        value={formData.mileage}
                        onChange={handleInputChange}
                        placeholder={
                          formData.condition === "New"
                            ? "e.g. 50 (Delivery km)"
                            : "e.g. 45000"
                        }
                        className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium text-sm transition-all ${
                          mileageValidation.status === "error"
                            ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                            : mileageValidation.status === "valid"
                            ? "border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            : mileageValidation.status === "warning"
                            ? "border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                            : "border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        }`}
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        KM
                      </span>
                    </div>

                    {/* Real-time Inline Feedback Badge */}
                    {mileageValidation.status !== "idle" && (
                      <div
                        className={`mt-2.5 p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-3 transition-all ${
                          mileageValidation.status === "error"
                            ? "bg-rose-50/90 border-rose-200 text-rose-800"
                            : mileageValidation.status === "warning"
                            ? "bg-amber-50/90 border-amber-200 text-amber-800"
                            : "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                        }`}
                      >
                        <span className="text-lg shrink-0">
                          {mileageValidation.status === "error"
                            ? "🚫"
                            : mileageValidation.status === "warning"
                            ? "⚠️"
                            : "✓"}
                        </span>
                        <div className="flex-1">
                          <p className="leading-snug">{mileageValidation.message}</p>
                          {mileageValidation.status === "error" && (
                            <p className="text-[11px] text-rose-600 font-normal mt-1">
                              VehicleWalay protects buyers against fake ads, meter rollback, and test inputs.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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
                    <span>Selected: {photos.length} / 8 photos</span>
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

                {/* AI Vision Security & Privacy Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 p-4 text-xs text-sky-950 flex items-start gap-3.5 shadow-xs">
                  <div className="h-9 w-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 text-base font-bold shadow-xs">
                    🛡️
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sky-900">
                      Real-time Vision AI Security & Privacy Inspection
                    </p>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Photos are automatically scanned by Vision AI to safeguard seller privacy (detecting human faces/selfies) and verify that genuine vehicle images are presented.
                    </p>
                  </div>
                </div>

                {/* Photo Previews with AI Detection Badges */}
                {photos.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className={`group relative rounded-2xl overflow-hidden border bg-slate-100 shadow-sm flex flex-col ${
                            photo.faceDetected
                              ? "border-amber-400 ring-2 ring-amber-200"
                              : photo.isVehicle === false
                              ? "border-rose-400 ring-2 ring-rose-200"
                              : "border-slate-200"
                          }`}
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                            <img
                              src={photo.previewUrl}
                              alt={`Vehicle Preview ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Cover photo badge */}
                            {index === 0 && (
                              <span className="absolute top-2 left-2 rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-black text-white shadow">
                                COVER PHOTO
                              </span>
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto(photo.id);
                              }}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 flex items-center justify-center text-xs transition-colors shadow"
                              title="Remove photo"
                            >
                              ✕
                            </button>

                            {/* Uploading Spinner Overlay */}
                            {photo.uploading && (
                              <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-white">
                                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span className="text-[11px] font-bold">Vision AI Scanning...</span>
                              </div>
                            )}
                          </div>

                          {/* AI Detection Status Footer */}
                          <div className="p-2.5 bg-white flex flex-col gap-1 border-t border-slate-100 text-left">
                            {photo.uploading ? (
                              <span className="text-[11px] text-slate-500 font-medium">
                                Analyzing image features...
                              </span>
                            ) : photo.faceDetected ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                                  <span>👤</span>
                                  <span>FACE DETECTED</span>
                                </span>
                                <p className="text-[10px] text-amber-700 font-medium leading-tight">
                                  Seller privacy warning: Avoid personal portraits/selfies.
                                </p>
                              </div>
                            ) : photo.isVehicle === false ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black">
                                  <span>⚠️</span>
                                  <span>NON-VEHICLE DETECTED</span>
                                </span>
                                <p className="text-[10px] text-rose-700 font-medium leading-tight">
                                  {photo.aiFeedback || "Image does not appear to show a motor vehicle."}
                                </p>
                              </div>
                            ) : photo.isVehicle === true && photo.analyzed ? (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <span>✓</span>
                                <span>Vehicle Verified</span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                  <span>ℹ️</span>
                                  <span>UNVERIFIED</span>
                                </span>
                                <p className="text-[10px] text-amber-600 font-normal leading-tight">
                                  {photo.aiFeedback || "Add GROQ_API_KEY in backend/.env for AI vision verification."}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Prominent Privacy Alert if Face Detected in any photo */}
                    {photos.some((p) => p.faceDetected) && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
                        <span className="text-xl shrink-0">👤</span>
                        <div className="flex-1">
                          <span className="font-bold text-amber-800">
                            Seller Privacy Alert:
                          </span>
                          <p className="mt-0.5 text-amber-700 leading-relaxed">
                            Vision AI detected human face(s) in one or more photos. To protect your personal safety and prevent identity leakage on a public marketplace, we strongly recommend removing personal photos or cropping portraits out before proceeding.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Prominent Warning if Non-Vehicle Detected */}
                    {photos.some((p) => p.isVehicle === false) && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-3 shadow-xs">
                        <span className="text-xl shrink-0">🚫</span>
                        <div className="flex-1">
                          <span className="font-bold text-rose-800">
                            Non-Vehicle Photo Detected:
                          </span>
                          <p className="mt-0.5 text-rose-700 leading-relaxed">
                            One or more photos do not show a motor vehicle. Please remove or replace them so your listing passes automatic inspection.
                          </p>
                        </div>
                      </div>
                    )}
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

                {/* Selling Price with Real-time Pricing Anomaly AI */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Selling Price (PKR) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      AI Pricing Anomaly Guard Active
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 3500000"
                      className={`w-full px-4 py-4 bg-white border rounded-2xl text-2xl font-black text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all ${
                        priceValidation.status === "error"
                          ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                          : priceValidation.status === "warning"
                          ? "border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                          : priceValidation.status === "valid"
                          ? "border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          : "border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      }`}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                      PKR
                    </span>
                  </div>

                  {/* Real-time Pricing Feedback Badge */}
                  {priceValidation.status !== "idle" && (
                    <div
                      className={`mt-3 p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-3 transition-all ${
                        priceValidation.status === "error"
                          ? "bg-rose-50/90 border-rose-200 text-rose-800"
                          : priceValidation.status === "warning"
                          ? "bg-amber-50/90 border-amber-200 text-amber-800"
                          : "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      <span className="text-lg shrink-0">
                        {priceValidation.status === "error"
                          ? "🚫"
                          : priceValidation.status === "warning"
                          ? "⚠️"
                          : "✓"}
                      </span>
                      <div className="flex-1">
                        <p className="leading-snug">{priceValidation.message}</p>
                        {priceValidation.lakhFormatted && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-700 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200">
                              Format: PKR {priceValidation.lakhFormatted} Lakh
                              {priceValidation.croreFormatted ? ` (${priceValidation.croreFormatted} Crore)` : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description with Deceptive / Scam Phrasing AI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Ad Description <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Anti-Scam Phrasing Guard Active
                    </span>
                  </div>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe vehicle condition: First owner, genuine bumper-to-bumper paint, dealership maintained, spotless interior, fresh tires..."
                    className={`w-full p-4 bg-slate-50 border rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm font-medium transition-all resize-none ${
                      descValidation.status === "error"
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                        : descValidation.status === "warning"
                        ? "border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                        : descValidation.status === "valid"
                        ? "border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        : "border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    }`}
                    required
                  />

                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 px-1">
                    <span>Write detailed vehicle condition (accidents, paint, engine health).</span>
                    <span>{formData.description.trim().length} chars (min 15)</span>
                  </div>

                  {/* Real-time Description Feedback Badge */}
                  {descValidation.status !== "idle" && (
                    <div
                      className={`mt-2.5 p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-3 transition-all ${
                        descValidation.status === "error"
                          ? "bg-rose-50/90 border-rose-200 text-rose-800"
                          : descValidation.status === "warning"
                          ? "bg-amber-50/90 border-amber-200 text-amber-800"
                          : "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      <span className="text-lg shrink-0">
                        {descValidation.status === "error"
                          ? "🚫"
                          : descValidation.status === "warning"
                          ? "⚠️"
                          : "✓"}
                      </span>
                      <div className="flex-1">
                        <p className="leading-snug">{descValidation.message}</p>
                        {descValidation.flaggedKeywords.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-xl bg-white/90 border border-rose-200 text-[11px] text-rose-700 font-normal">
                            <p className="font-bold text-rose-800 mb-0.5">🛡️ Buyer Protection Policy:</p>
                            <p>
                              Deceptive advance payment schemes (such as demanding early Bayana, JazzCash/EasyPaisa wire deposits, or urgent money transfers before test drives) are strictly blocked to protect car buyers.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

                {/* Safety & Integrity Guarantee Badge */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 flex items-start gap-3">
                  <span className="text-lg shrink-0">🛡️</span>
                  <div>
                    <span className="font-bold text-slate-800">
                      VehicleWalay Marketplace Integrity AI:
                    </span>
                    <p className="mt-0.5 text-slate-500 leading-relaxed">
                      Our platform safeguards transactions by cross-referencing mileage against vehicle age, verifying image authenticity, and screening asking prices against market anomalies.
                    </p>
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
