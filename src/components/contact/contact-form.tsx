'use client'

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Mail, MapPin, MessageCircle, Phone, Send, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUBJECTS = [
  { value: 'order', label: 'A question about an order' },
  { value: 'product', label: 'A product question' },
  { value: 'demo', label: 'Demo / feedback' },
  { value: 'press', label: 'Press inquiry' },
  { value: 'other', label: 'Something else' },
]

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false)
  const [topic, setTopic] = useState('order')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    // Phase 2 has no live contact API. Submit triggers a Sonner toast and
    // resets the form so the user sees a real success state.
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Thanks! We\u2019ll get back to you within one business day.')
    ;(e.currentTarget as HTMLFormElement).reset()
    setSubmitting(false)
  }

  return (
    <form
      onSubmit={onSubmit}
      data-testid="contact-form"
      className="space-y-5 rounded-2xl border border-border bg-background p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">
            Full name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Jane Doe"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm ring-focus"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="jane@example.com"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm ring-focus"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium">What\u2019s this about?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUBJECTS.map((s) => (
            <label
              key={s.value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:border-brand-300',
                topic === s.value
                  ? 'border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-500'
                  : 'border-border',
              )}
            >
              <input
                type="radio"
                name="topic"
                value={s.value}
                checked={topic === s.value}
                onChange={() => setTopic(s.value)}
                className="h-4 w-4 accent-brand-600"
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">
          Your message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          minLength={10}
          placeholder="How can we help?"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-focus"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        data-testid="contact-form-submit"
        className={cn(
          'inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm',
          'hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {submitting ? 'Sending\u2026' : (
          <>
            <Send className="h-4 w-4" aria-hidden /> Send message
          </>
        )}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        We reply to every message within one business day.
      </p>
    </form>
  )
}
