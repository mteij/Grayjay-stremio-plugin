import { updatePassword } from './actions'
import { SubmitButton } from '@/components/SubmitButton'

export default async function UpdatePasswordPage(props: { searchParams: Promise<{ error?: string, message?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams?.error
  const message = searchParams?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 font-sans text-white">
      <div className="w-full max-w-[500px] rounded-lg bg-dark-2 px-8 py-10 sm:px-10 sm:py-12 shadow-2 dark:bg-dark-2">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white sm:text-[28px]">
            Set New Password
          </h2>
          <p className="text-base text-body-color dark:text-dark-6">
            Please enter your new password below.
          </p>
        </div>

        <form>
          {error && (
            <div className="mb-5 rounded-md border border-red-500/50 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-400">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label className="mb-[10px] block text-base font-medium text-white">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter new password"
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-white outline-hidden focus:border-primary focus-visible:shadow-none dark:border-dark-3"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="mb-[10px] block text-base font-medium text-white">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-white outline-hidden focus:border-primary focus-visible:shadow-none dark:border-dark-3"
              required
            />
          </div>

          <div className="pt-2">
            <SubmitButton
              formAction={updatePassword}
              className="w-full cursor-pointer rounded-md border border-primary bg-primary px-5 py-3 text-base font-medium text-white transition hover:bg-opacity-90"
            >
              Update Password
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
