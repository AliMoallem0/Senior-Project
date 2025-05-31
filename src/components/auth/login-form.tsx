import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { Link } from "react-router-dom"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Email Input */}
        <div className="relative animate-slide-right" style={{ animationDelay: '0.2s' }}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#6C63FF] input-focus-animation"
            placeholder="Email"
            autoComplete="email"
          />
        </div>

        {/* Password Input */}
        <div className="relative animate-slide-left" style={{ animationDelay: '0.3s' }}>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#6C63FF] input-focus-animation"
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link 
            to="/forgot-password" 
            className="text-sm text-[#6C63FF] hover:text-[#5b53ff] transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button 
          disabled={isLoading}
          className="w-full h-12 bg-[#6C63FF] text-white rounded-lg font-medium hover:bg-[#5b53ff] transition-all duration-300 button-hover-animation animate-scale"
          style={{ animationDelay: '0.5s' }}
        >
          {isLoading ? (
            <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          Sign In
        </Button>
      </div>
    </form>
  )
} 