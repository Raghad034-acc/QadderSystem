"use client";

import { useMemo, useState } from "react";

type StepStatus = "idle" | "loading" | "success" | "error";

const BACKEND_URL = "http://127.0.0.1:8000";

function toPublicImageUrl(path?: string | null) {
  if (!path) return "";
  const normalized = path.replaceAll("\\", "/");
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return `${BACKEND_URL}/${normalized}`;
}

function prettyLabel(value?: string | null) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Home() {
  const [step1Response, setStep1Response] = useState<any>(null);
  const [step2Response, setStep2Response] = useState<any>(null);
  const [step3Response, setStep3Response] = useState<any>(null);
  const [step4Response, setStep4Response] = useState<any>(null);
  const [step5Response, setStep5Response] = useState<any>(null);
  const [step6Response, setStep6Response] = useState<any>(null);

  const [caseId, setCaseId] = useState("");
  const [userProfileId, setUserProfileId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [step1File, setStep1File] = useState<File | null>(null);
  const [step2File, setStep2File] = useState<File | null>(null);

  const [step1Status, setStep1Status] = useState<StepStatus>("idle");
  const [step2Status, setStep2Status] = useState<StepStatus>("idle");
  const [step3Status, setStep3Status] = useState<StepStatus>("idle");
  const [step4Status, setStep4Status] = useState<StepStatus>("idle");
  const [step5Status, setStep5Status] = useState<StepStatus>("idle");
  const [step6Status, setStep6Status] = useState<StepStatus>("idle");

  const [step1Message, setStep1Message] = useState("");
  const [step2Message, setStep2Message] = useState("");
  const [step3Message, setStep3Message] = useState("");
  const [step4Message, setStep4Message] = useState("");
  const [step5Message, setStep5Message] = useState("");
  const [step6Message, setStep6Message] = useState("");

  const [loadingStep1, setLoadingStep1] = useState(false);
  const [loadingStep2, setLoadingStep2] = useState(false);
  const [loadingStep3, setLoadingStep3] = useState(false);
  const [loadingStep4, setLoadingStep4] = useState(false);
  const [loadingStep5, setLoadingStep5] = useState(false);
  const [loadingStep6, setLoadingStep6] = useState(false);

  const step2PreviewUrl = useMemo(() => {
    if (!step2File) return "";
    return URL.createObjectURL(step2File);
  }, [step2File]);

  const step4AnnotatedUrl = useMemo(() => {
    return toPublicImageUrl(step4Response?.step4_result?.annotated_image_path);
  }, [step4Response]);

  const step4Damages = step4Response?.step4_result?.damages || [];


  const step5AnnotatedUrl = useMemo(() => {
    return toPublicImageUrl(step5Response?.step5_result?.damage_parts_annotated_path);
  }, [step5Response]);

  const step5MaskUrl = useMemo(() => {
    return toPublicImageUrl(step5Response?.step5_result?.parts_mask_path);
  }, [step5Response]);

  const step5OverlayUrl = useMemo(() => {
    return toPublicImageUrl(step5Response?.step5_result?.parts_overlay_path);
  }, [step5Response]);

  const step5Damages = step5Response?.step5_result?.damages || [];
  const step6Damages = step6Response?.step6_result?.damages || [];

  const getBadgeClasses = (status: StepStatus) => {
    if (status === "success") return "bg-green-600 text-white";
    if (status === "error") return "bg-red-600 text-white";
    if (status === "loading") return "bg-yellow-500 text-black";
    return "bg-gray-700 text-white";
  };

  const getBadgeText = (status: StepStatus) => {
    if (status === "success") return "Completed";
    if (status === "error") return "Failed";
    if (status === "loading") return "Running";
    return "Not Started";
  };

  const getMessageBoxClasses = (status: StepStatus) => {
    if (status === "success") return "bg-green-900/40 border border-green-700";
    if (status === "error") return "bg-red-900/40 border border-red-700";
    if (status === "loading") return "bg-yellow-900/30 border border-yellow-700";
    return "bg-gray-800 border border-gray-700";
  };

  const resetStep3And4 = () => {
    setStep3Response(null);
    setStep4Response(null);
    setStep3Status("idle");
    setStep4Status("idle");
    setStep3Message("");
    setStep4Message("");
  };
  const resetStep5And6 = () => {
  setStep5Response(null);
  setStep6Response(null);
  setStep5Status("idle");
  setStep6Status("idle");
  setStep5Message("");
  setStep6Message("");
};

  const handleStep1 = async () => {
    if (!step1File) {
      setStep1Status("error");
      setStep1Message("Please choose a PDF file first.");
      return;
    }

    try {
      setLoadingStep1(true);
      setStep1Status("loading");
      setStep1Message("Uploading Najm report...");

      const formData = new FormData();
      formData.append("user_profile_id", userProfileId);
      formData.append("vehicle_id", vehicleId);
      formData.append("file", step1File);

      const res = await fetch(`${BACKEND_URL}/step1/upload-najm-report`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setStep1Response(data);

      if (res.ok && data.case_id) {
        setStep1Status("success");
        setStep1Message("Step1 completed successfully.");
        setCaseId(data.case_id);
      } else {
        setStep1Status("error");
        setStep1Message(data?.detail?.message || data?.detail || "Step1 failed.");
      }
    } catch {
      setStep1Status("error");
      setStep1Message("Failed to connect to backend in Step1.");
    } finally {
      setLoadingStep1(false);
    }
  };

const handleStep3 = async (currentCaseId: string) => {
  try {
    setLoadingStep3(true);
    setStep3Status("loading");
    setStep3Message("Step3 is analyzing the overall damage severity...");

    const formData = new FormData();
    formData.append("case_id", currentCaseId);

    const res = await fetch(`${BACKEND_URL}/step3/predict-severity`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setStep3Response(data);

    if (!res.ok) {
      setStep3Status("error");
      setStep3Message(data?.detail || "Step3 failed.");
      return false;
    }

    const severityEn =
      data?.step3_result?.severity_en ||
      data?.prediction?.severity?.en ||
      data?.severity?.en ||
      "";

    const severityAr =
      data?.step3_result?.severity_ar ||
      data?.prediction?.severity?.ar ||
      data?.severity?.ar ||
      "";

    const confidence =
      data?.step3_result?.severity_confidence ||
      data?.prediction?.confidence ||
      0;

    const decision =
      data?.step3_result?.decision ||
      data?.decision ||
      data?.message ||
      "";

    const normalizedSeverity = String(severityEn).toLowerCase();
    const normalizedDecision = String(decision).toLowerCase();

    const isRejected =
      normalizedSeverity === "high" ||
      normalizedSeverity === "severe" ||
      normalizedDecision.includes("reject") ||
      normalizedDecision.includes("rejected");

    if (isRejected) {
      setStep3Status("error");
      setStep3Message(
        `Step3 rejected this case. Severity: ${severityAr || severityEn || "High"}`
      );
      return false;
    }

    setStep3Status("success");
    setStep3Message(
      `Step3 finished successfully. Overall severity: ${severityAr || severityEn || "Unknown"}.`
    );
    return true;
  } catch {
    setStep3Status("error");
    setStep3Message("Failed to connect to backend in Step3.");
    return false;
  } finally {
    setLoadingStep3(false);
  }
};
  

  const handleStep4 = async (currentCaseId: string) => {
    try {
      setLoadingStep4(true);
      setStep4Status("loading");
      setStep4Message("Step4 is detecting the damage types and preparing crops...");

      const formData = new FormData();
      formData.append("case_id", currentCaseId);

      const res = await fetch(`${BACKEND_URL}/step4/detect-damage-type`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setStep4Response(data);

      if (res.ok) {
        const count = data?.step4_result?.damages_count ?? 0;
        setStep4Status("success");
        setStep4Message(`Step4 finished successfully. ${count} damage area${count === 1 ? "" : "s"} detected.`);
        return true;
      }

      setStep4Status("error");
      setStep4Message(data?.detail || "Step4 failed.");
      return false;
    } catch {
      setStep4Status("error");
      setStep4Message("Failed to connect to backend in Step4.");
      return false;
    } finally {
      setLoadingStep4(false);
    }
  };
  const handleStep5 = async (currentCaseId: string) => {
  try {
    setLoadingStep5(true);
    setStep5Status("loading");
    setStep5Message("Step5 is detecting damaged parts for each damage area...");

    const formData = new FormData();
    formData.append("case_id", currentCaseId);

    const res = await fetch(`${BACKEND_URL}/step5/detect-damage-part`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setStep5Response(data);

    if (!res.ok) {
      setStep5Status("error");
      setStep5Message(data?.detail || "Step5 failed.");
      return false;
    }

    const count = data?.step5_result?.damages_count ?? 0;
    setStep5Status("success");
    setStep5Message(`Step5 finished successfully. ${count} damage part result${count === 1 ? "" : "s"} extracted.`);
    return true;
  } catch {
    setStep5Status("error");
    setStep5Message("Failed to connect to backend in Step5.");
    return false;
  } finally {
    setLoadingStep5(false);
  }
};
  const handleStep6 = async (currentCaseId: string) => {
  try {
    setLoadingStep6(true);
    setStep6Status("loading");
    setStep6Message("Step6 is predicting severity for each detected damage...");

    const formData = new FormData();
    formData.append("case_id", currentCaseId);

    const res = await fetch(`${BACKEND_URL}/step6/predict-damage-severity`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setStep6Response(data);

    if (!res.ok) {
      setStep6Status("error");
      setStep6Message(data?.detail || "Step6 failed.");
      return false;
    }

    const count = data?.step6_result?.damages_count ?? 0;
    setStep6Status("success");
    setStep6Message(`Step6 finished successfully. ${count} damage severity result${count === 1 ? "" : "s"} predicted.`);
    return true;
  } catch {
    setStep6Status("error");
    setStep6Message("Failed to connect to backend in Step6.");
    return false;
  } finally {
    setLoadingStep6(false);
  }
};
  const handleStep2 = async () => {
    if (!step2File) {
      setStep2Status("error");
      setStep2Message("Please choose an image first.");
      return;
    }

    if (!caseId) {
      setStep2Status("error");
      setStep2Message("Case ID is required.");
      return;
    }

    try {
      resetStep3And4();

      setLoadingStep2(true);
      setStep2Status("loading");
      setStep2Message("Uploading image and verifying the correct damage side...");

      const formData = new FormData();
      formData.append("case_id", caseId);
      formData.append("file", step2File);

      const res = await fetch(`${BACKEND_URL}/step2/upload-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setStep2Response(data);

      if (!res.ok) {
        setStep2Status("error");
        setStep2Message(data?.detail || "Step2 failed.");
        return;
      }

      const accepted = data?.step2_result?.is_accepted;

      if (!accepted) {
        setStep2Status("error");
        setStep2Message(
          `Step2 completed but image rejected: ${data?.step2_result?.rejection_reason || "unknown reason"}`
        );
        return;
      }

      setStep2Status("success");
      setStep2Message("Step2 completed and image accepted. Starting Step3 automatically...");

      const step3Ok = await handleStep3(caseId);
      if (!step3Ok) return;

      setStep2Message("Step2 completed and image accepted. Step3 finished. Starting Step4 automatically...");
      const step4Ok = await handleStep4(caseId);
      if (!step4Ok) return;

      setStep2Message("Step4 finished. Starting Step5 automatically...");
      const step5Ok = await handleStep5(caseId);
      if (!step5Ok) return;

      setStep2Message("Step5 finished. Starting Step6 automatically...");
      await handleStep6(caseId);

      setStep2Message("All steps from Step2 to Step6 completed successfully.");
    } catch {
      setStep2Status("error");
      setStep2Message("Failed to connect to backend in Step2.");
    } finally {
      setLoadingStep2(false);
    }
  };

  const severityEn = step3Response?.step3_result?.severity_en;
  const severityAr = step3Response?.step3_result?.severity_ar;
  const severityConfidence = step3Response?.step3_result?.severity_confidence;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Qadder Test Dashboard</h1>
          <p className="text-gray-300">
            Upload the Najm report, then upload the car image. After Step2 accepts the image, Step3 and Step4 will run automatically.
          </p>

          <div className="flex gap-4 flex-wrap">
            <div className="border border-gray-700 rounded-xl px-4 py-3 min-w-[220px]">
              <p className="text-sm text-gray-400">Step1 Status</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getBadgeClasses(step1Status)}`}>
                {getBadgeText(step1Status)}
              </span>
            </div>

            <div className="border border-gray-700 rounded-xl px-4 py-3 min-w-[220px]">
              <p className="text-sm text-gray-400">Step2 Status</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getBadgeClasses(step2Status)}`}>
                {getBadgeText(step2Status)}
              </span>
            </div>

            <div className="border border-gray-700 rounded-xl px-4 py-3 min-w-[220px]">
              <p className="text-sm text-gray-400">Step3 Status</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getBadgeClasses(step3Status)}`}>
                {getBadgeText(step3Status)}
              </span>
            </div>

            <div className="border border-gray-700 rounded-xl px-4 py-3 min-w-[220px]">
              <p className="text-sm text-gray-400">Step4 Status</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getBadgeClasses(step4Status)}`}>
                {getBadgeText(step4Status)}
              </span>
            </div>
             <div className="border border-gray-700 rounded-xl px-4 py-3 min-w-[220px]">
              <p className="text-sm text-gray-400">Step5 Status</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getBadgeClasses(step5Status)}`}>
                {getBadgeText(step5Status)}
              </span>
            </div>
            <div className="border border-gray-700 rounded-xl px-4 py-3 min-w-[220px]">
             <p className="text-sm text-gray-400">Step6 Status</p>
             <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getBadgeClasses(step6Status)}`}>
               {getBadgeText(step6Status)}
             </span>
           </div>

            <div className="border border-gray-700 rounded-xl px-4 py-3 min-w-[320px]">
              <p className="text-sm text-gray-400">Current Case ID</p>
              <p className="mt-2 break-all text-sm">{caseId || "No case yet"}</p>
            </div>
          </div>
        </div>

        <section className="border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-semibold">Step1 - Upload Najm Report</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getBadgeClasses(step1Status)}`}>
              {getBadgeText(step1Status)}
            </span>
          </div>

          <input
            placeholder="User Profile ID"
            className="w-full bg-black border border-gray-600 rounded-lg p-3"
            value={userProfileId}
            onChange={(e) => setUserProfileId(e.target.value)}
          />

          <input
            placeholder="Vehicle ID"
            className="w-full bg-black border border-gray-600 rounded-lg p-3"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-4">
            <input type="file" accept=".pdf" onChange={(e) => setStep1File(e.target.files?.[0] || null)} />

            <button
              onClick={handleStep1}
              disabled={loadingStep1}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-3 rounded-lg"
            >
              {loadingStep1 ? "Uploading..." : "Upload Step1"}
            </button>
          </div>

          {step1Message && (
            <div className={`rounded-lg p-3 text-sm ${getMessageBoxClasses(step1Status)}`}>
              {step1Message}
            </div>
          )}

          {step1Status === "success" && caseId && (
            <div className="rounded-lg p-3 bg-blue-900/30 border border-blue-700 text-sm">
              Step1 finished. Case ID has been filled automatically into Step2.
            </div>
          )}

          {step1Response && (
            <pre className="bg-gray-100 text-black rounded-lg p-4 text-sm overflow-auto">
              {JSON.stringify(step1Response, null, 2)}
            </pre>
          )}
        </section>

        <section className="border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-semibold">Step2 - Upload Image</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getBadgeClasses(step2Status)}`}>
              {getBadgeText(step2Status)}
            </span>
          </div>

          <input
            placeholder="Case ID"
            className="w-full bg-black border border-gray-600 rounded-lg p-3"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-4">
            <input type="file" accept="image/*" onChange={(e) => setStep2File(e.target.files?.[0] || null)} />

            <button
              onClick={handleStep2}
              disabled={loadingStep2 || loadingStep3 || loadingStep4}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-5 py-3 rounded-lg"
            >
              {loadingStep2 || loadingStep3 || loadingStep4 ? "Processing..." : "Upload Step2"}
            </button>
          </div>

          {step2Message && (
            <div className={`rounded-lg p-3 text-sm ${getMessageBoxClasses(step2Status)}`}>
              {step2Message}
            </div>
          )}

          {step2Response?.step2_result?.is_accepted === true && (
            <div className="rounded-lg p-4 bg-green-900/30 border border-green-700 space-y-2 text-sm">
              <p><span className="text-gray-300">Image status:</span> Accepted</p>
              <p><span className="text-gray-300">Matched side:</span> {prettyLabel(step2Response?.step2_result?.accepted_side)}</p>
              <p><span className="text-gray-300">Accepted source:</span> {prettyLabel(step2Response?.step2_result?.accepted_source)}</p>
            </div>
          )}

          {step2Response?.step2_result?.is_accepted === false && (
            <div className="rounded-lg p-4 bg-red-900/30 border border-red-700 text-sm">
              Image rejected. Reason: <span className="font-semibold">{step2Response?.step2_result?.rejection_reason || "unknown"}</span>
            </div>
          )}

          {step2PreviewUrl && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Uploaded image preview</h3>
              <img
                src={step2PreviewUrl}
                alt="Uploaded vehicle"
                className="w-full max-w-2xl rounded-xl border border-gray-700 object-contain"
              />
            </div>
          )}
        </section>

        <section className="border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-semibold">Step3 - Overall Severity</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getBadgeClasses(step3Status)}`}>
              {getBadgeText(step3Status)}
            </span>
          </div>

          {step3Message && (
            <div className={`rounded-lg p-3 text-sm ${getMessageBoxClasses(step3Status)}`}>
              {step3Message}
            </div>
          )}

          {step3Response?.step3_result && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-700 p-4 bg-zinc-900">
                <p className="text-sm text-gray-400">Severity</p>
                <p className="text-2xl font-bold mt-2">{severityAr || prettyLabel(severityEn)}</p>
                <p className="text-sm text-gray-400 mt-1">{prettyLabel(severityEn)}</p>
              </div>

              <div className="rounded-xl border border-gray-700 p-4 bg-zinc-900">
                <p className="text-sm text-gray-400">Confidence</p>
                <p className="text-2xl font-bold mt-2">
                  {typeof severityConfidence === "number" ? `${(severityConfidence * 100).toFixed(1)}%` : "—"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-700 p-4 bg-zinc-900">
                <p className="text-sm text-gray-400">Decision</p>
                <p className="text-2xl font-bold mt-2">{prettyLabel(step3Response?.step3_result?.severity_status)}</p>
              </div>
            </div>
          )}
        </section>

        <section className="border border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-semibold">Step4 - Damage Types</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getBadgeClasses(step4Status)}`}>
              {getBadgeText(step4Status)}
            </span>
          </div>

          {step4Message && (
            <div className={`rounded-lg p-3 text-sm ${getMessageBoxClasses(step4Status)}`}>
              {step4Message}
            </div>
          )}

          {step4AnnotatedUrl && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Annotated damage image</h3>
              <img
                src={step4AnnotatedUrl}
                alt="Annotated damage result"
                className="w-full max-w-3xl rounded-xl border border-gray-700 object-contain"
              />
              <p className="text-xs text-gray-400 break-all">{step4Response?.step4_result?.annotated_image_path}</p>
            </div>
          )}

          {step4Status === "success" && (
            <div className="rounded-xl border border-gray-700 bg-zinc-900 p-4">
              <p className="text-sm text-gray-400">Detected damage areas</p>
              <p className="text-3xl font-bold mt-2">{step4Response?.step4_result?.damages_count ?? 0}</p>
            </div>
          )}

          {step4Damages.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {step4Damages.map((damage: any) => (
                <div key={damage.damage_no} className="rounded-2xl border border-gray-700 bg-zinc-900 overflow-hidden">
                  {damage.crop_path ? (
                    <img
                      src={toPublicImageUrl(damage.crop_path)}
                      alt={`Damage ${damage.damage_no}`}
                      className="w-full h-64 object-cover border-b border-gray-700"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500 border-b border-gray-700">
                      No crop preview
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold">Damage #{damage.damage_no}</h4>
                      <span className="px-3 py-1 rounded-full bg-red-700/70 text-sm">
                        {damage.damage_type_ar || prettyLabel(damage.damage_type_en)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">English type</p>
                        <p className="font-medium">{prettyLabel(damage.damage_type_en)}</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Confidence</p>
                        <p className="font-medium">
                          {typeof damage.damage_confidence === "number"
                            ? `${(damage.damage_confidence * 100).toFixed(1)}%`
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">Mask pixels</p>
                        <p className="font-medium">{damage.mask_pixels ?? "—"}</p>
                      </div>

                      <div>
                        <p className="text-gray-400">Area ratio</p>
                        <p className="font-medium">
                          {typeof damage.area_ratio === "number" ? damage.area_ratio.toFixed(4) : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-400">Bounding box</p>
                      <p className="font-medium break-all">{JSON.stringify(damage.bbox_xyxy || [])}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="border border-gray-700 rounded-2xl p-6 space-y-4">
  <div className="flex items-center justify-between flex-wrap gap-3">
    <h2 className="text-2xl font-semibold">Step5 - Damage Parts</h2>
    <span className={`px-3 py-1 rounded-full text-sm ${getBadgeClasses(step5Status)}`}>
      {getBadgeText(step5Status)}
    </span>
  </div>

  {loadingStep5 && (
    <p className="text-sm text-gray-400">
      Step5 is running automatically...
    </p>
  )}

  {step5Message && (
    <div className={`rounded-lg p-3 text-sm ${getMessageBoxClasses(step5Status)}`}>
      {step5Message}
    </div>
  )}

  {(step5AnnotatedUrl || step5OverlayUrl || step5MaskUrl) && (
    <div className="grid gap-4 md:grid-cols-3">
      {step5AnnotatedUrl && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Annotated Parts Image</h3>
          <img
            src={step5AnnotatedUrl}
            alt="Step5 annotated parts"
            className="w-full rounded-xl border border-gray-700 object-contain"
          />
        </div>
      )}

      {step5OverlayUrl && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Parts Overlay</h3>
          <img
            src={step5OverlayUrl}
            alt="Step5 parts overlay"
            className="w-full rounded-xl border border-gray-700 object-contain"
          />
        </div>
      )}

      {step5MaskUrl && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Parts Mask</h3>
          <img
            src={step5MaskUrl}
            alt="Step5 parts mask"
            className="w-full rounded-xl border border-gray-700 object-contain"
          />
        </div>
      )}
    </div>
  )}

  {step5Damages.length > 0 && (
    <div className="grid gap-4 md:grid-cols-2">
      {step5Damages.map((damage: any) => (
        <div
          key={damage.damage_no}
          className="rounded-2xl border border-gray-700 bg-zinc-900 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-lg font-semibold">Damage #{damage.damage_no}</h4>
            <span className="px-3 py-1 rounded-full bg-indigo-700/70 text-sm">
              {damage.part_name_ar || prettyLabel(damage.part_name_en)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Part</p>
              <p className="font-medium">{prettyLabel(damage.part_name_en)}</p>
            </div>

            <div>
              <p className="text-gray-400">Vote Label</p>
              <p className="font-medium">{prettyLabel(damage.vote_label)}</p>
            </div>

            <div>
              <p className="text-gray-400">Vote Ratio</p>
              <p className="font-medium">
                {typeof damage.vote_ratio === "number"
                  ? `${(damage.vote_ratio * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Part Status</p>
              <p className="font-medium">{prettyLabel(damage.part_status)}</p>
            </div>
          </div>

          <div className="text-sm">
            <p className="text-gray-400">Reason</p>
            <p className="font-medium break-words">
              {damage.part_reason || "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
   <section className="border border-gray-700 rounded-2xl p-6 space-y-4">
  <div className="flex items-center justify-between flex-wrap gap-3">
    <h2 className="text-2xl font-semibold">
      Step6 - Damage Severity Per Damage
    </h2>
    <span className={`px-3 py-1 rounded-full text-sm ${getBadgeClasses(step6Status)}`}>
      {getBadgeText(step6Status)}
    </span>
  </div>

  {loadingStep6 && (
    <p className="text-sm text-gray-400">
      Step6 is running automatically...
    </p>
  )}

  {step6Message && (
    <div className={`rounded-lg p-3 text-sm ${getMessageBoxClasses(step6Status)}`}>
      {step6Message}
    </div>
  )}

  {step6Damages.length > 0 && (
    <div className="grid gap-4 md:grid-cols-2">
      {step6Damages.map((damage: any) => (
        <div
          key={damage.damage_no}
          className="rounded-2xl border border-gray-700 bg-zinc-900 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-lg font-semibold">
              Damage #{damage.damage_no}
            </h4>

            <span className="px-3 py-1 rounded-full bg-emerald-700/70 text-sm">
              {damage.severity_ar || prettyLabel(damage.severity_en)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Severity</p>
              <p className="font-medium">
                {prettyLabel(damage.severity_en)}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Status</p>
              <p className="font-medium">
                {prettyLabel(damage.severity_status)}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Arabic Severity</p>
              <p className="font-medium">
                {damage.severity_ar || "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-400">Confidence</p>
              <p className="font-medium">
                {typeof damage.severity_confidence === "number"
                  ? `${(damage.severity_confidence * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
      </div>
    </main>
  );
}


