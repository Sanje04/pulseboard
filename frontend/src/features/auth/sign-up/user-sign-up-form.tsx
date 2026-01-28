import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { signup, saveToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z
  .object({
    name: z.string().min(1, 'Please enter your name'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
    }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password must be at most 128 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  })

type SignUpFormValues = z.infer<typeof formSchema>

interface UserSignUpFormProps extends React.HTMLAttributes<HTMLFormElement> {}

export function UserSignUpForm({ className, ...props }: UserSignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignUpFormValues) {
    setIsLoading(true)

    try {
      const res = await signup(data.name, data.email, data.password)

      // Optionally auto-login user after signup if backend returns accessToken and user
      if (res.accessToken && res.user) {
        saveToken(res.accessToken)
        auth.setUser(res.user)
        auth.setAccessToken(res.accessToken)
        navigate({ to: '/', replace: true })
      } else {
        // If backend only creates the account, send them to sign-in
        navigate({ to: '/sign-in', replace: true })
      }

      toast.success('Account created successfully')
    } catch (error) {
      toast.error('Unable to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='John Doe' autoComplete='name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder='name@example.com'
                  type='email'
                  autoComplete='email'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='********'
                  autoComplete='new-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='********'
                  autoComplete='new-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
          Sign up
        </Button>

        <p className='mt-2 text-center text-sm text-muted-foreground'>
          Already have an account?{' '}
          <Link
            to='/sign-in'
            className='font-medium text-primary underline underline-offset-4'
          >
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  )
}
