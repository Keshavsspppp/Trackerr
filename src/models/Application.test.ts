import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { Application } from './Application';

// Feature: job-application-tracker
// Task 2.1 — Unit tests for Application schema validation
// Requirements: 10.3, 10.4, 2.3

describe('Application schema validation', () => {
  it('throws a ValidationError when company is missing', async () => {
    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      // company is intentionally omitted
      role: 'Software Engineer',
    });

    await expect(doc.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('throws a ValidationError when role is missing', async () => {
    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      company: 'Acme Corp',
      // role is intentionally omitted
    });

    await expect(doc.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('throws a ValidationError when both company and role are missing', async () => {
    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      // company and role both omitted
    });

    await expect(doc.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('throws a ValidationError when status is an invalid enum value', async () => {
    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      company: 'Acme Corp',
      role: 'Software Engineer',
      status: 'Pending', // not a valid status
    });

    await expect(doc.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('defaults status to "Applied" when status is omitted', async () => {
    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      company: 'Acme Corp',
      role: 'Software Engineer',
    });

    // validate() resolves successfully for a valid document
    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.status).toBe('Applied');
  });

  it('accepts all valid status values without throwing', async () => {
    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;

    for (const status of validStatuses) {
      const doc = new Application({
        userId: 'user-1',
        userEmail: 'user@example.com',
        company: 'Acme Corp',
        role: 'Software Engineer',
        status,
      });

      await expect(doc.validate()).resolves.toBeUndefined();
      expect(doc.status).toBe(status);
    }
  });

  it('defaults source to "manual" when source is omitted', async () => {
    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      company: 'Acme Corp',
      role: 'Software Engineer',
    });

    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.source).toBe('manual');
  });

  it('accepts all valid source values without throwing', async () => {
    const validSources = ['manual', 'extension', 'csv_import'] as const;

    for (const source of validSources) {
      const doc = new Application({
        userId: 'user-1',
        userEmail: 'user@example.com',
        company: 'Acme Corp',
        role: 'Software Engineer',
        source,
      });

      await expect(doc.validate()).resolves.toBeUndefined();
      expect(doc.source).toBe(source);
    }
  });

  it('throws a ValidationError when source is an invalid enum value', async () => {
    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      company: 'Acme Corp',
      role: 'Software Engineer',
      source: 'invalid_source', // not a valid source
    });

    await expect(doc.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('accepts optional capturedAt and originalUrl fields', async () => {
    const capturedAt = new Date('2024-01-15T10:30:00Z');
    const originalUrl = 'https://example.com/job/12345';

    const doc = new Application({
      userId: 'user-1',
      userEmail: 'user@example.com',
      company: 'Acme Corp',
      role: 'Software Engineer',
      source: 'extension',
      capturedAt,
      originalUrl,
    });

    await expect(doc.validate()).resolves.toBeUndefined();
    expect(doc.capturedAt).toEqual(capturedAt);
    expect(doc.originalUrl).toBe(originalUrl);
  });
});
