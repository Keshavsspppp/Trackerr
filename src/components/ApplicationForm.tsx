'use client';

import { useState } from 'react';

interface ApplicationFormProps {
  onCreated?: () => void;
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

export default function ApplicationForm({ onCreated }: ApplicationFormProps) {
  const [fields, setFields] = useState<FormFields>(initialFields);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear the inline error for the field being edited
    if (name === 'company' || name === 'role') {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fields.company.trim()) {
      errs.company = 'Company is required.';
    }
    if (!fields.role.trim()) {
      errs.role = 'Role is required.';
    }
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
        return;
      }

      // Reset form on success
      setFields(initialFields);
      onCreated?.();
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
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
        gap: '0.75rem',
        maxWidth: '480px',
        width: '100%',
      }}
    >
      <h2 style={{ margin: 0 }}>Add Application</h2>

      {/* Company */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="company" style={{ fontWeight: 600 }}>
          Company <span aria-hidden="true" style={{ color: '#e53e3e' }}>*</span>
        </label>
        <input
          id="company"
          name="company"
          type="text"
          value={fields.company}
          onChange={handleChange}
          aria-required="true"
          aria-describedby={errors.company ? 'company-error' : undefined}
          aria-invalid={!!errors.company}
          style={{
            padding: '0.5rem',
            border: errors.company ? '1px solid #e53e3e' : '1px solid #ccc',
            borderRadius: '0.375rem',
            fontSize: '1rem',
          }}
        />
        {errors.company && (
          <span
            id="company-error"
            role="alert"
            style={{ color: '#e53e3e', fontSize: '0.875rem' }}
          >
            {errors.company}
          </span>
        )}
      </div>

      {/* Role */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="role" style={{ fontWeight: 600 }}>
          Role <span aria-hidden="true" style={{ color: '#e53e3e' }}>*</span>
        </label>
        <input
          id="role"
          name="role"
          type="text"
          value={fields.role}
          onChange={handleChange}
          aria-required="true"
          aria-describedby={errors.role ? 'role-error' : undefined}
          aria-invalid={!!errors.role}
          style={{
            padding: '0.5rem',
            border: errors.role ? '1px solid #e53e3e' : '1px solid #ccc',
            borderRadius: '0.375rem',
            fontSize: '1rem',
          }}
        />
        {errors.role && (
          <span
            id="role-error"
            role="alert"
            style={{ color: '#e53e3e', fontSize: '0.875rem' }}
          >
            {errors.role}
          </span>
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="status" style={{ fontWeight: 600 }}>
          Status
        </label>
        <select
          id="status"
          name="status"
          value={fields.status}
          onChange={handleChange}
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            background: '#fff',
          }}
        >
          {VALID_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Applied Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="appliedDate" style={{ fontWeight: 600 }}>
          Applied Date
        </label>
        <input
          id="appliedDate"
          name="appliedDate"
          type="date"
          value={fields.appliedDate}
          onChange={handleChange}
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '0.375rem',
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Job URL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="jobUrl" style={{ fontWeight: 600 }}>
          Job URL
        </label>
        <input
          id="jobUrl"
          name="jobUrl"
          type="text"
          value={fields.jobUrl}
          onChange={handleChange}
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '0.375rem',
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label htmlFor="notes" style={{ fontWeight: 600 }}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={fields.notes}
          onChange={handleChange}
          rows={3}
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Submit error */}
      {errors.submit && (
        <span role="alert" style={{ color: '#e53e3e', fontSize: '0.875rem' }}>
          {errors.submit}
        </span>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '0.625rem 1.25rem',
          fontSize: '1rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          borderRadius: '0.375rem',
          border: '1px solid #ccc',
          background: submitting ? '#f0f0f0' : '#fff',
          fontWeight: 600,
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Saving…' : 'Add Application'}
      </button>
    </form>
  );
}
