import { login, signup, magicLinkLogin } from './actions'
import Link from 'next/link'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string, message?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams?.error
  const message = searchParams?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 font-sans text-white">
      <div className="relative w-full max-w-[500px] bg-dark-2 rounded-xl px-8 py-10 sm:px-11 sm:py-14 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
            Stremio + Grayjay
          </h1>
          <p className="text-base text-body-color">
            Sign in to manage your Stremio Addons and TMDB keys.
          </p>
        </div>

        <form className="flex flex-col space-y-5">
          {error && (
            <div className="mb-5 rounded-md border border-red-500/50 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-400">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-5 rounded-md border border-primary/50 bg-primary/10 px-5 py-4 text-sm font-medium text-primary">
              {message}
            </div>
          )}
          
          <div>
            <label className="mb-[10px] block text-base font-medium text-white">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-dark-3 bg-transparent px-5 py-3 text-base text-body-color outline-none transition focus:border-primary focus-visible:shadow-none dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <div className="mb-[10px] flex justify-between items-center">
              <label className="block text-base font-medium text-white">Password</label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your Password"
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-white outline-hidden focus:border-primary focus-visible:shadow-none dark:border-dark-3"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              formAction={login}
              className="w-full cursor-pointer rounded-md border border-primary bg-primary px-5 py-3 text-base font-medium text-white transition hover:bg-opacity-90"
            >
              Log in
            </button>
            <button
              formAction={signup}
              className="w-full cursor-pointer rounded-md border border-dark-3 bg-transparent px-5 py-3 text-base font-medium text-white transition hover:border-primary hover:bg-primary hover:text-white"
            >
              Create Account
            </button>
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-dark-3"></div>
                <span className="shrink-0 mx-4 text-sm text-body-color">Or</span>
                <div className="flex-grow border-t border-dark-3"></div>
            </div>
            <button
              formAction={magicLinkLogin}
              className="w-full cursor-pointer rounded-md border border-dark-3 bg-transparent px-5 py-3 text-base font-medium text-white transition hover:border-primary hover:bg-primary hover:text-white"
            >
              Send Magic Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
