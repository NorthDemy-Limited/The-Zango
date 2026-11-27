"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, Lock, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface PasswordChangeCardProps {
  identifier: string;
  accentColor?: "red" | "blue" | "emerald";
  onSuccessToast?: (msg: string) => void;
}

export function PasswordChangeCard({
  identifier,
  accentColor = "red",
  onSuccessToast,
}: PasswordChangeCardProps) {
  const { updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getButtonStyles = () => {
    switch (accentColor) {
      case "blue":
        return "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20";
      case "emerald":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20";
      default:
        return "bg-[#84CC16] hover:bg-[#65A30D] text-black font-bold shadow-lime-500/20";
    }
  };

  const getFocusStyles = () => {
    switch (accentColor) {
      case "blue":
        return "focus:border-blue-600";
      case "emerald":
        return "focus:border-emerald-600";
      default:
        return "focus:border-[#84CC16]";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage("Please enter your current clearance passcode.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New passcode must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passcodes do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        updateUser({ mustChangePassword: false });
        setSuccessMessage("Your clearance passcode has been updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onSuccessToast) {
          onSuccessToast("Passcode updated successfully!");
        }
      } else {
        setErrorMessage(data.message || "Failed to update passcode.");
      }
    } catch {
      setErrorMessage("Network error while updating passcode. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] space-y-6">
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              Security & Clearance Passcode
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Update your newsroom clearance passcode. New passcode must be at least 8 characters.
          </p>
        </div>
        <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Active Clearance</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Current Clearance Passcode
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              required
              placeholder="Enter current passcode"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 ${getFocusStyles()} focus:outline-hidden transition-all text-slate-900 bg-white font-medium`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
              title={showCurrent ? "Hide passcode" : "Show passcode"}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                New Passcode
              </label>
              <span className={`text-[10px] font-bold ${newPassword.length >= 8 ? "text-emerald-600" : "text-slate-400"}`}>
                {newPassword.length}/8 min
              </span>
            </div>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 ${getFocusStyles()} focus:outline-hidden transition-all text-slate-900 bg-white font-medium`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
                title={showNew ? "Hide passcode" : "Show passcode"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Confirm New Passcode
              </label>
              {confirmPassword.length > 0 && (
                <span className={`text-[10px] font-bold ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                  {newPassword === confirmPassword ? "Match" : "Mismatch"}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                placeholder="Repeat new passcode"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 ${getFocusStyles()} focus:outline-hidden transition-all text-slate-900 bg-white font-medium`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
                title={showConfirm ? "Hide passcode" : "Show passcode"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating Passcode...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Save New Passcode</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

