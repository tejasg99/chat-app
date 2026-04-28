"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Flag } from "lucide-react";

import api from "@/lib/axios";
import { ApiResponse, IReport, ReportReason, ReportTargetType } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// ─── Schema ───────────────────────────────────────────────────────────────────
const reportSchema = z.object({
  reason: z.enum(
    ["spam", "harassment", "hate_speech", "inappropriate_content", "other"],
    { error: "Please select a reason." },
  ),
  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

// ─── Reason labels ────────────────────────────────────────────────────────────
const REASON_OPTIONS: {
  value: ReportReason;
  label: string;
  description: string;
}[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Unsolicited or repetitive content",
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "Targeted abuse or bullying",
  },
  {
    value: "hate_speech",
    label: "Hate speech",
    description: "Discriminatory or hateful language",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate content",
    description: "Offensive or explicit material",
  },
  {
    value: "other",
    label: "Other",
    description: "Something else not listed above",
  },
];

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  /** Display name of what is being reported — shown in the header */
  targetLabel?: string;
}

export function ReportModal({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: undefined, description: "" },
  });

  const {
    watch,
    formState: { isSubmitting },
  } = form;
  const selectedReason = watch("reason");
  const description = watch("description") ?? "";

  async function onSubmit(values: ReportFormData) {
    try {
      const { data } = await api.post<ApiResponse<IReport>>("/reports", {
        targetType,
        targetId,
        reason: values.reason,
        ...(values.description?.trim()
          ? { description: values.description.trim() }
          : {}),
      });
      if (!data.data) throw new Error(data.message);

      toast.success(
        "Report submitted. Thank you for keeping the community safe.",
      );
      form.reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to submit report.";
      toast.error(message);
    }
  }

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent
        className="
          sm:max-w-md
          bg-surface-container-lowest
          border-0 shadow-ambient
          rounded-2xl p-0 overflow-hidden
        "
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Flag className="w-4 h-4 text-destructive" />
            </div>
            <DialogTitle className="font-heading text-lg font-bold text-foreground">
              Report {targetType === "user" ? "user" : "message"}
            </DialogTitle>
          </div>
          {targetLabel && (
            <p className="text-xs text-muted-foreground mt-1 ml-10">
              {targetLabel}
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* ── Reason selector ── */}
            <div className="px-6 pt-5 pb-2">
              <Label className="text-sm font-medium text-foreground mb-3 block">
                What&apos;s the issue?
              </Label>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-1.5">
                        {REASON_OPTIONS.map((option) => {
                          const isSelected = field.value === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className={`
                                w-full flex items-start gap-3 px-3 py-2.5
                                rounded-xl text-left transition-smooth
                                ${
                                  isSelected
                                    ? "bg-surface-container-high"
                                    : "hover:bg-surface-container-low"
                                }
                              `}
                            >
                              {/* Radio indicator */}
                              <div
                                className={`
                                  mt-0.5 w-4 h-4 rounded-full border-2 shrink-0
                                  flex items-center justify-center transition-smooth
                                  ${
                                    isSelected
                                      ? "border-brand-primary"
                                      : "border-muted-foreground/40"
                                  }
                                `}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {option.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {option.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-destructive mt-1.5 px-1" />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Optional description ── */}
            <div className="px-6 pt-2 pb-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">
                      Additional details{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in more detail…"
                        rows={3}
                        className="
                          resize-none
                          bg-surface-container
                          border-0 rounded-xl
                          text-sm text-foreground
                          placeholder:text-muted-foreground
                          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                          transition-smooth
                        "
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormMessage className="text-xs text-destructive" />
                      <span
                        className={`
                          text-[10px] ml-auto
                          ${
                            description.length > 450
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }
                        `}
                      >
                        {description.length}/500
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* ── Footer ── */}
            <div className="px-6 pb-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="
                  flex-1 h-10 rounded-full
                  text-sm text-muted-foreground
                  hover:bg-surface-container-low
                  transition-smooth
                "
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedReason}
                className="
                  flex-1 h-10 rounded-full
                  bg-destructive hover:bg-destructive/90
                  text-white text-sm font-medium
                  transition-smooth disabled:opacity-50
                "
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5 mr-1.5" />
                    Submit report
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
