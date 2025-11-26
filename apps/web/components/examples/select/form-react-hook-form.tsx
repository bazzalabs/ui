'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Select } from '@/registry/components/select'

/**
 * Zod Schema Definition
 * Defines validation rules for our form
 */
const formSchema = z.object({
  country: z.string().min(1, 'Please select your country.'),

  language: z
    .string()
    .min(1, 'Please select your preferred language.')
    .refine((val) => val !== 'auto', {
      message:
        'Auto-detection is not allowed. Please select a specific language.',
    }),

  timezone: z.string().min(1, 'Please select your timezone.'),
})

type FormValues = z.infer<typeof formSchema>

/**
 * Sample data for select dropdowns
 */
const countries = [
  { value: 'us', label: 'United States', icon: '🇺🇸' },
  { value: 'uk', label: 'United Kingdom', icon: '🇬🇧' },
  { value: 'ca', label: 'Canada', icon: '🇨🇦' },
  { value: 'au', label: 'Australia', icon: '🇦🇺' },
  { value: 'de', label: 'Germany', icon: '🇩🇪' },
  { value: 'fr', label: 'France', icon: '🇫🇷' },
  { value: 'jp', label: 'Japan', icon: '🇯🇵' },
  { value: 'br', label: 'Brazil', icon: '🇧🇷' },
]

const languages = [
  { value: 'auto', label: 'Auto-detect', icon: '🤖' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
]

const timezones = [
  { value: 'utc', label: 'UTC (Coordinated Universal Time)' },
  { value: 'est', label: 'EST (Eastern Standard Time)' },
  { value: 'cst', label: 'CST (Central Standard Time)' },
  { value: 'mst', label: 'MST (Mountain Standard Time)' },
  { value: 'pst', label: 'PST (Pacific Standard Time)' },
  { value: 'gmt', label: 'GMT (Greenwich Mean Time)' },
  { value: 'cet', label: 'CET (Central European Time)' },
  { value: 'jst', label: 'JST (Japan Standard Time)' },
  { value: 'aest', label: 'AEST (Australian Eastern Standard Time)' },
]

/**
 * Main Form Component
 * Demonstrates React Hook Form + Zod integration with Select
 */
export function FormReactHookForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: '',
      language: '',
      timezone: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
  })

  // Watch form values for display
  const watchedValues = form.watch()

  const onSubmit = async (data: FormValues) => {
    // Simulate async submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success('Form submitted successfully!', {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
        <CardDescription>
          Configure your location and language settings using React Hook Form
          with Zod validation.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pb-6">
            {/* Country Select */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select your country..."
                      items={countries}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the country where you're located.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Language Select */}
            <FormField
              control={form.control}
              name="language"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Preferred Language</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select your language..."
                      items={languages}
                      aria-invalid={fieldState.invalid}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose your preferred language for the interface. Note:
                    Auto-detect is not allowed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timezone Select */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select your timezone..."
                      items={timezones}
                    />
                  </FormControl>
                  <FormDescription>
                    Select your timezone for accurate time display.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Values Display */}
            {(watchedValues.country ||
              watchedValues.language ||
              watchedValues.timezone) && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="text-sm font-medium mb-2">Current Selection:</h4>
                <dl className="space-y-1 text-sm">
                  {watchedValues.country && (
                    <div>
                      <dt className="inline font-medium">Country: </dt>
                      <dd className="inline text-muted-foreground">
                        {countries.find(
                          (c) => c.value === watchedValues.country,
                        )?.label || watchedValues.country}
                      </dd>
                    </div>
                  )}
                  {watchedValues.language && (
                    <div>
                      <dt className="inline font-medium">Language: </dt>
                      <dd className="inline text-muted-foreground">
                        {languages.find(
                          (l) => l.value === watchedValues.language,
                        )?.label || watchedValues.language}
                      </dd>
                    </div>
                  )}
                  {watchedValues.timezone && (
                    <div>
                      <dt className="inline font-medium">Timezone: </dt>
                      <dd className="inline text-muted-foreground">
                        {timezones.find(
                          (t) => t.value === watchedValues.timezone,
                        )?.label || watchedValues.timezone}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={form.formState.isSubmitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
