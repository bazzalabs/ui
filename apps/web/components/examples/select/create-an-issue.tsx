'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MultiSelect } from '@/registry/ui/multi-select'
import { Select } from '@/registry/ui/select'
import { Status } from '../dropdown-menu/shared/icons'

const LABEL_STYLES_BG = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
}

type TW_COLOR = keyof typeof LABEL_STYLES_BG

/**
 * Zod Schema Definition
 * Defines validation rules for issue creation form
 */
const formSchema = z.object({
  title: z
    .string()
    .min(1, 'Issue title is required.')
    .min(3, 'Title must be at least 3 characters.')
    .max(100, 'Title must be less than 100 characters.'),

  status: z.string().min(1, 'Please select a status.'),

  assignee: z.string().optional(),

  labels: z.array(z.string()),
})

type FormValues = z.infer<typeof formSchema>

/**
 * Data for select dropdowns
 */
const statusItems = [
  {
    value: 'icebox',
    label: 'Icebox',
    icon: <Status.Icebox />,
  },
  {
    value: 'backlog',
    label: 'Backlog',
    icon: <Status.Backlog />,
  },
  {
    value: 'todo',
    label: 'Todo',
    icon: <Status.Todo />,
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    icon: <Status.InProgress />,
  },
  {
    value: 'done',
    label: 'Done',
    icon: <Status.Done />,
  },
]

const assigneeItems = [
  {
    value: '@kianbazza',
    label: 'Kian Bazza',
    icon: (
      <Avatar>
        <AvatarImage src="https://github.com/kianbazza.png" alt="@kianbazza" />
        <AvatarFallback>KB</AvatarFallback>
      </Avatar>
    ),
  },
  {
    value: '@shadcn',
    label: 'shadcn',
    icon: (
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    ),
  },
  {
    value: '@rauchg',
    label: 'Guillermo Rauch',
    icon: (
      <Avatar>
        <AvatarImage src="https://github.com/rauchg.png" alt="@rauchg" />
        <AvatarFallback>RG</AvatarFallback>
      </Avatar>
    ),
  },
  {
    value: '@t3dotgg',
    label: 'Theo Browne',
    icon: (
      <Avatar>
        <AvatarImage src="https://github.com/t3dotgg.png" alt="@t3dotgg" />
        <AvatarFallback>TB</AvatarFallback>
      </Avatar>
    ),
  },
]

const labelData = [
  { id: 'bug', name: 'Bug', color: 'red' },
  { id: 'enhancement', name: 'Enhancement', color: 'green' },
  { id: 'task', name: 'Task', color: 'blue' },
  { id: 'urgent', name: 'Urgent', color: 'pink' },
  { id: 'low-priority', name: 'Low Priority', color: 'lime' },
  { id: 'frontend', name: 'Frontend', color: 'orange' },
  { id: 'backend', name: 'Backend', color: 'teal' },
  { id: 'database', name: 'Database', color: 'violet' },
  { id: 'api', name: 'API', color: 'red' },
  { id: 'ai-model', name: 'AI Model', color: 'cyan' },
  { id: 'data-pipeline', name: 'Data Pipeline', color: 'amber' },
  { id: 'inference', name: 'Inference', color: 'emerald' },
  { id: 'ai-integration', name: 'AI Integration', color: 'purple' },
  { id: 'ethics', name: 'Ethics', color: 'fuchsia' },
  { id: 'refactor', name: 'Refactor', color: 'lime' },
  { id: 'performance', name: 'Performance', color: 'red' },
  { id: 'security', name: 'Security', color: 'sky' },
  { id: 'testing', name: 'Testing', color: 'yellow' },
  { id: 'documentation', name: 'Documentation', color: 'rose' },
  { id: 'in-progress', name: 'In Progress', color: 'green' },
  { id: 'blocked', name: 'Blocked', color: 'indigo' },
  { id: 'needs-review', name: 'Needs Review', color: 'orange' },
  { id: 'done', name: 'Done', color: 'teal' },
  { id: 'ui', name: 'UI', color: 'red' },
  { id: 'ux', name: 'UX', color: 'sky' },
]

const labelItems = labelData.map((label) => ({
  value: label.id,
  label: label.name,
  icon: (
    <div
      className={cn(
        'rounded-full !size-2.5',
        LABEL_STYLES_BG[label.color as TW_COLOR],
      )}
    />
  ),
}))

/**
 * Main Form Component
 * Demonstrates Linear-style issue creation with React Hook Form + Zod
 */
export function CreateAnIssue() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      status: 'todo',
      assignee: '',
      labels: [],
    },
    mode: 'onBlur', // Validate on blur for better UX
  })

  // Watch form values for display
  const watchedValues = form.watch()

  const onSubmit = async (data: FormValues) => {
    // Simulate async submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast.success('Issue created successfully!', {
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
        <CardTitle>Create an Issue</CardTitle>
        <CardDescription>
          Create a new issue with status, assignee, and labels using Select and
          MultiSelect components.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pb-6">
            {/* Title Input */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Issue title..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a clear, descriptive title for the issue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Select */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={statusItems}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Select status..." />
                      </Select.Trigger>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Set the current status of the issue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignee Select */}
            <FormField
              control={form.control}
              name="assignee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={assigneeItems}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Select assignee..." />
                      </Select.Trigger>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Optionally assign this issue to a team member.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Labels MultiSelect */}
            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labels</FormLabel>
                  <FormControl>
                    <MultiSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      items={labelItems}
                    >
                      <MultiSelect.Trigger>
                        <MultiSelect.Value placeholder="Select labels..." />
                      </MultiSelect.Trigger>
                    </MultiSelect>
                  </FormControl>
                  <FormDescription>
                    Add one or more labels to categorize this issue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Values Display */}
            {(watchedValues.title ||
              watchedValues.assignee ||
              watchedValues.labels.length > 0) && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="text-sm font-medium mb-2">Current Selection:</h4>
                <dl className="space-y-1 text-sm">
                  {watchedValues.title && (
                    <div>
                      <dt className="inline font-medium">Title: </dt>
                      <dd className="inline text-muted-foreground">
                        {watchedValues.title}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="inline font-medium">Status: </dt>
                    <dd className="inline text-muted-foreground">
                      {statusItems.find((s) => s.value === watchedValues.status)
                        ?.label || watchedValues.status}
                    </dd>
                  </div>
                  {watchedValues.assignee && (
                    <div>
                      <dt className="inline font-medium">Assignee: </dt>
                      <dd className="inline text-muted-foreground">
                        {assigneeItems.find(
                          (a) => a.value === watchedValues.assignee,
                        )?.label || watchedValues.assignee}
                      </dd>
                    </div>
                  )}
                  {watchedValues.labels.length > 0 && (
                    <div>
                      <dt className="inline font-medium">Labels: </dt>
                      <dd className="inline text-muted-foreground">
                        {watchedValues.labels
                          .map(
                            (labelId) =>
                              labelItems.find((l) => l.value === labelId)
                                ?.label || labelId,
                          )
                          .join(', ')}
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
              {form.formState.isSubmitting ? 'Creating...' : 'Create Issue'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
