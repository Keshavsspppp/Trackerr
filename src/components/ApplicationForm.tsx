'use client';

import { useState, useEffect, useRef } from 'react';
import type { IApplication } from './ApplicationList';

interface ApplicationFormProps {
  application?: IApplication;
  onCreated?: (newApp?: IApplication) => void;
  onUpdated?: (updatedApp?: IApplication) => void;
  onCancel?: () => void;
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
      const body: Record<string, string> = {
        company: fields.company.trim(),
        role: fields.role.trim(),
        status: fields.status,
        appliedDate: fields.appliedDate,
        jobUrl: fields.jobUrl.trim(),
        notes: fields.notes.trim(),
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
        gap: '16px',
        width: '100%',
      }}
    >
      {/* Company */}
      <div>
        <label htmlFor="company" style={labelStyle}>
          Company <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
        </label>
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
          style={inputStyle(!!errors.company)}
        />
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
          style={inputStyle(!!errors.role)}
        />
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

      {/* Status */}
      <div>
        <label htmlFor="status" style={labelStyle}>
          Status
        </label>
        <select
          id="status"
          name="status"
          value={fields.status}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ ...inputStyle(false), cursor: 'pointer' }}
        >
          {VALID_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Applied Date */}
      <div>
        <label htmlFor="appliedDate" style={labelStyle}>
          Application Date
        </label>
        <input
          id="appliedDate"
          name="appliedDate"
          type="date"
          value={fields.appliedDate}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={inputStyle(false)}
        />
      </div>

      {/* Job URL */}
      <div>
        <label htmlFor="jobUrl" style={labelStyle}>
          Posting URL <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
        </label>
        <input
          id="jobUrl"
          name="jobUrl"
          type="url"
          value={fields.jobUrl}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="https://..."
          style={inputStyle(false)}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" style={labelStyle}>
          Notes <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          value={fields.notes}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={3}
          placeholder="Recruiter contact, stipend, interview notes…"
          style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

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

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
          paddingTop: '4px',
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="hover-btn-neutral"
            style={{
              flex: 1,
              height: '44px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 'var(--radius-btn)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isDisabled}
          className="hover-btn-accent"
          style={{
            flex: 1,
            height: '44px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            borderRadius: 'var(--radius-btn)',
            border: 'none',
            background: isDisabled && !submitting ? '#93C5FD' : 'var(--color-accent)',
            color: '#FFFFFF',
            opacity: isDisabled ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
            'Save →'
          )}
        </button>
      </div>
    </form>
  );
}
