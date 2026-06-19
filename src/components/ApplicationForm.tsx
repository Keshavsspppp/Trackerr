'use client';

import { useState } from 'react';

interface ApplicationFormProps {
  onCreated?: () => void;
  onCancel?: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
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
  border: `1px solid ${hasError ? '#EF4444' : '#E5E7EB'}`,
  borderRadius: '8px',
  background: '#FFFFFF',
  color: '#111827',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
});

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '4px',
};

export default function ApplicationForm({
  onCreated,
  onCancel,
  showToast,
}: ApplicationFormProps) {
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

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
    setFields((prev) => ({ ...prev, [name]: value }));
    if (name === 'company' || name === 'role') {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleFocus(
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    e.currentTarget.style.borderColor = '#3B82F6';
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
    e.currentTarget.style.borderColor = hasError ? '#EF4444' : '#E5E7EB';
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

    try {
      const body: Record<string, string> = {
        company: fields.company.trim(),
        role: fields.role.trim(),
        status: fields.status,
      };
      if (fields.appliedDate) body.appliedDate = fields.appliedDate;
      if (fields.jobUrl.trim()) body.jobUrl = fields.jobUrl.trim();
      if (fields.notes.trim()) body.notes = fields.notes.trim();

      const res = await fetch('/api/applications', {
        method: 'POST',
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

      setFields(initialFields);
      showToast?.('Internship added ✓', 'success');
      onCreated?.();
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
            style={{
              flex: 1,
              height: '44px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              background: 'transparent',
              color: '#374151',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isDisabled}
          style={{
            flex: 1,
            height: '44px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            border: 'none',
            background: isDisabled ? '#93C5FD' : '#3B82F6',
            color: '#FFFFFF',
            transition: 'background 150ms ease',
            opacity: isDisabled ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isDisabled)
              (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
          }}
          onMouseLeave={(e) => {
            if (!isDisabled)
              (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
          }}
        >
          {submitting ? 'Saving…' : 'Save →'}
        </button>
      </div>
    </form>
  );
}
