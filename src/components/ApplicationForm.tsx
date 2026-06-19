'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building2, 
  Briefcase, 
  Calendar, 
  Link2, 
  FileText, 
  Clock, 
  BellRing, 
  Info, 
  Trash2 
} from 'lucide-react';
import type { IApplication } from './ApplicationList';

interface ApplicationFormProps {
  application?: IApplication;
  onCreated?: (newApp?: IApplication) => void;
  onUpdated?: (updatedApp?: IApplication) => void;
  onCancel?: () => void;
  onDelete?: (app: IApplication) => void;
  onDirtyChange?: (dirty: boolean) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  isDemo?: boolean;
}

const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;
type Status = (typeof VALID_STATUSES)[number];

interface FormFields {
  company: string;
  role: string;
  status: Status;
  appliedDate: string;
  jobUrl: string;
  notes: string;
  snoozedUntil: string;
}

interface FormErrors {
  company?: string;
  role?: string;
  submit?: string;
}

const initialFields: FormFields = {
  company: '',
  role: '',
  status: 'Applied',
  appliedDate: '',
  jobUrl: '',
  notes: '',
  snoozedUntil: '',
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  fontSize: '14px',
  padding: '10px 12px',
  border: `1px solid ${hasError ? 'var(--color-rejected-dot)' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '4px',
};

export default function ApplicationForm({
  application,
  onCreated,
  onUpdated,
  onCancel,
  onDelete,
  onDirtyChange,
  showToast,
  isDemo = false,
}: ApplicationFormProps) {
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const companyInputRef = useRef<HTMLInputElement>(null);

  // Sync with application prop when it changes (for edit mode) and handle autofocus
  useEffect(() => {
    if (application) {
      setFields({
        company: application.company,
        role: application.role,
        status: application.status,
        appliedDate: application.appliedDate ? new Date(application.appliedDate).toISOString().substring(0, 10) : '',
        jobUrl: application.jobUrl ?? '',
        notes: application.notes ?? '',
        snoozedUntil: application.snoozedUntil ? new Date(application.snoozedUntil).toISOString() : '',
      });
    } else {
      setFields(initialFields);
    }

    // Autofocus after a short delay to accommodate transition animations
    const timer = setTimeout(() => {
      if (companyInputRef.current) {
        companyInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [application]);

  const isDirty = useMemo(() => {
    if (application) {
      const origAppliedDate = application.appliedDate ? new Date(application.appliedDate).toISOString().substring(0, 10) : '';
      const origSnoozedUntil = application.snoozedUntil ? new Date(application.snoozedUntil).toISOString() : '';
      return (
        fields.company !== application.company ||
        fields.role !== application.role ||
        fields.status !== application.status ||
        fields.appliedDate !== origAppliedDate ||
        fields.jobUrl !== (application.jobUrl ?? '') ||
        fields.notes !== (application.notes ?? '') ||
        fields.snoozedUntil !== origSnoozedUntil
      );
    } else {
      return (
        fields.company !== '' ||
        fields.role !== '' ||
        fields.status !== 'Applied' ||
        fields.appliedDate !== '' ||
        fields.jobUrl !== '' ||
        fields.notes !== '' ||
        fields.snoozedUntil !== ''
      );
    }
  }, [fields, application]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function handleDeleteClick() {
    if (application && onDelete) {
      onDelete(application);
    }
  }

  const isDisabled =
    submitting ||
    fields.company.trim() === '' ||
    fields.role.trim() === '';

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value as never }));
    if (name === 'company' || name === 'role') {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleFocus(
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    e.currentTarget.style.borderColor = 'var(--color-accent)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
  }

  function handleBlur(
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const name = e.currentTarget.name;
    const hasError =
      (name === 'company' && !!errors.company) ||
      (name === 'role' && !!errors.role);
    e.currentTarget.style.borderColor = hasError ? 'var(--color-rejected-dot)' : 'var(--color-border)';
    e.currentTarget.style.boxShadow = 'none';
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fields.company.trim()) errs.company = 'Company is required.';
    if (!fields.role.trim()) errs.role = 'Role is required.';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    if (isDemo) {
      const demoResponse: IApplication = {
        _id: application?._id || `demo-${Math.random().toString(36).substr(2, 9)}`,
        userId: 'demo',
        company: fields.company.trim(),
        role: fields.role.trim(),
        status: fields.status as any,
        appliedDate: fields.appliedDate ? new Date(fields.appliedDate).toISOString() : undefined,
        jobUrl: fields.jobUrl.trim() || undefined,
        notes: fields.notes.trim() || undefined,
        source: application?.source || 'manual',
        lastUpdated: new Date().toISOString(),
        createdAt: application?.createdAt || new Date().toISOString(),
        ...(fields.snoozedUntil ? { snoozedUntil: fields.snoozedUntil } : {}),
      };

      setTimeout(() => {
        setSubmitting(false);
        if (application) {
          showToast?.('[Demo Sandbox] Internship updated ✓', 'success');
          onUpdated?.(demoResponse);
        } else {
          setFields(initialFields);
          showToast?.('[Demo Sandbox] Internship added ✓', 'success');
          onCreated?.(demoResponse);
        }
      }, 300);
      return;
    }

    try {
      const body: Record<string, string | null> = {
        company: fields.company.trim(),
        role: fields.role.trim(),
        status: fields.status,
        appliedDate: fields.appliedDate,
        jobUrl: fields.jobUrl.trim(),
        notes: fields.notes.trim(),
        snoozedUntil: fields.snoozedUntil || null,
      };

      const url = application ? `/api/applications/${application._id}` : '/api/applications';
      const method = application ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          (data as { error?: string }).error ||
          `Request failed with status ${res.status}.`;
        setErrors({ submit: message });
        showToast?.(message, 'error');
        return;
      }

      if (application) {
        showToast?.('Internship updated ✓', 'success');
        onUpdated?.();
      } else {
        setFields(initialFields);
        showToast?.('Internship added ✓', 'success');
        onCreated?.();
      }
    } catch {
      const message = 'Network error. Please try again.';
      setErrors({ submit: message });
      showToast?.(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        width: '100%',
      }}
    >
      {/* Metadata Line */}
      {application && (
        <div
          suppressHydrationWarning
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginBottom: '4px',
            borderBottom: '1px dashed var(--color-border)',
            paddingBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} style={{ opacity: 0.6 }} />
            <span>
              Added {new Date(application.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {application.lastUpdated && application.lastUpdated !== application.createdAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} style={{ opacity: 0.6 }} />
              <span>
                Last updated {new Date(application.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status Segmented Picker */}
      <div style={{ marginBottom: '4px' }}>
        <span style={labelStyle}>Status</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {VALID_STATUSES.map((s) => {
            const isActive = fields.status === s;
            let activeBg = 'var(--color-applied-bg)';
            let activeText = 'var(--color-applied-text)';
            let activeDot = 'var(--color-applied-dot)';
            if (s === 'Interview') {
              activeBg = 'var(--color-interview-bg)';
              activeText = 'var(--color-interview-text)';
              activeDot = 'var(--color-interview-dot)';
            } else if (s === 'Offer') {
              activeBg = 'var(--color-offer-bg)';
              activeText = 'var(--color-offer-text)';
              activeDot = 'var(--color-offer-dot)';
            } else if (s === 'Rejected') {
              activeBg = 'var(--color-rejected-bg)';
              activeText = 'var(--color-rejected-text)';
              activeDot = 'var(--color-rejected-dot)';
            }
            
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setFields((prev) => ({ ...prev, status: s }));
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: `1.5px solid ${isActive ? activeDot : 'var(--color-border)'}`,
                  background: isActive ? activeBg : 'var(--color-surface)',
                  color: isActive ? activeText : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isActive ? activeDot : 'var(--color-text-muted)',
                    marginBottom: '4px',
                    transition: 'all 150ms ease',
                  }}
                />
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Company */}
      <div>
        <label htmlFor="company" style={labelStyle}>
          Company <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: errors.company ? 'var(--color-rejected-dot)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Building2 size={16} />
          </div>
          <input
            id="company"
            name="company"
            ref={companyInputRef}
            type="text"
            value={fields.company}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete="organization"
            aria-required="true"
            aria-describedby={errors.company ? 'company-error' : undefined}
            aria-invalid={!!errors.company}
            placeholder="e.g. Google"
            style={{
              ...inputStyle(!!errors.company),
              paddingLeft: '38px',
            }}
          />
        </div>
        {errors.company && (
          <span
            id="company-error"
            role="alert"
            style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#EF4444' }}
          >
            {errors.company}
          </span>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" style={labelStyle}>
          Role / Position <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: errors.role ? 'var(--color-rejected-dot)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Briefcase size={16} />
          </div>
          <input
            id="role"
            name="role"
            type="text"
            value={fields.role}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-required="true"
            aria-describedby={errors.role ? 'role-error' : undefined}
            aria-invalid={!!errors.role}
            placeholder="e.g. Software Engineering Intern"
            style={{
              ...inputStyle(!!errors.role),
              paddingLeft: '38px',
            }}
          />
        </div>
        {errors.role && (
          <span
            id="role-error"
            role="alert"
            style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#EF4444' }}
          >
            {errors.role}
          </span>
        )}
      </div>

      {/* Applied Date */}
      <div>
        <label htmlFor="appliedDate" style={labelStyle}>
          Application Date
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Calendar size={16} />
          </div>
          <input
            id="appliedDate"
            name="appliedDate"
            type="date"
            value={fields.appliedDate}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              ...inputStyle(false),
              paddingLeft: '38px',
            }}
          />
        </div>
      </div>

      {/* Job URL */}
      <div>
        <label htmlFor="jobUrl" style={labelStyle}>
          Posting URL <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Link2 size={16} />
          </div>
          <input
            id="jobUrl"
            name="jobUrl"
            type="url"
            value={fields.jobUrl}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="https://..."
            style={{
              ...inputStyle(false),
              paddingLeft: '38px',
            }}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" style={labelStyle}>
          Notes <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
        </label>
        <div style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '12px',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <FileText size={16} />
          </div>
          <textarea
            id="notes"
            name="notes"
            value={fields.notes}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            rows={3}
            placeholder="Recruiter contact, stipend, interview notes…"
            style={{
              ...inputStyle(false),
              paddingLeft: '38px',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </div>
      </div>

      {/* Snooze section */}
      {application && fields.status === 'Applied' && (
        <div
          style={{
            marginTop: '4px',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellRing size={16} style={{ color: 'var(--color-interview-dot)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Snooze Follow-up Reminders
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Temporarily silence email notifications for this internship. Reminders will resume automatically after the snooze period.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '2px' }}>
            {[
              { label: 'None', days: 0 },
              { label: '1 Wk', days: 7 },
              { label: '2 Wks', days: 14 },
              { label: '30 Days', days: 30 },
            ].map((opt) => {
              let isActive = false;
              if (opt.days === 0) {
                isActive = !fields.snoozedUntil;
              } else if (fields.snoozedUntil) {
                const snoozeTime = new Date(fields.snoozedUntil).getTime();
                const nowTime = new Date().getTime();
                const daysDiff = Math.round((snoozeTime - nowTime) / (1000 * 60 * 60 * 24));
                isActive = Math.abs(daysDiff - opt.days) <= 1;
              }

              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    if (opt.days === 0) {
                      setFields((prev) => ({ ...prev, snoozedUntil: '' }));
                    } else {
                      const d = new Date();
                      d.setDate(d.getDate() + opt.days);
                      setFields((prev) => ({ ...prev, snoozedUntil: d.toISOString() }));
                    }
                  }}
                  style={{
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? 'var(--color-interview-dot)' : 'var(--color-border)'}`,
                    background: isActive ? 'var(--color-interview-bg)' : 'var(--color-surface)',
                    color: isActive ? 'var(--color-interview-text)' : 'var(--color-text-secondary)',
                    transition: 'all 120ms ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {fields.snoozedUntil && (
            <div style={{ fontSize: '11px', color: 'var(--color-interview-text)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 500 }}>
              <Info size={12} />
              <span>
                Snoozed until {new Date(fields.snoozedUntil).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Submit error */}
      {errors.submit && (
        <span
          role="alert"
          aria-live="polite"
          style={{ fontSize: '12px', color: '#EF4444' }}
        >
          {errors.submit}
        </span>
      )}

      {/* Action buttons - Sticky to bottom */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '16px 0 0',
          marginTop: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        {application && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="hover-btn-danger"
            style={{
              height: '42px',
              padding: '0 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '10px',
              border: '1px solid var(--color-rejected-dot)',
              background: 'transparent',
              color: 'var(--color-rejected-dot)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-rejected-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
        <div style={{ display: 'flex', gap: '12px', flex: application ? undefined : 1, justifyContent: 'flex-end', width: application ? undefined : '100%' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                height: '42px',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                flex: application ? undefined : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-text-muted)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.background = 'var(--color-surface)';
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isDisabled}
            style={{
              height: '42px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.6 : 1,
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #1e40af 100%)',
              color: '#FFFFFF',
              boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              flex: application ? undefined : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
              }
            }}
          >
            {submitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg
                  style={{
                    animation: 'spin 1s linear infinite',
                    width: '16px',
                    height: '16px',
                  }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Saving…</span>
              </div>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
