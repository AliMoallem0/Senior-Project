import { LoginForm } from "@/components/auth/login-form"
import { Icons } from "@/components/icons"
import { Link } from "react-router-dom"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-[800px] h-[500px] bg-white rounded-[30px] shadow-2xl flex overflow-hidden card-animation">
        {/* Left Section - Sign In Form */}
        <div className="w-1/2 p-12 relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h1 className="text-3xl font-bold mb-6 animate-slide-down" style={{ animationDelay: '0.4s' }}>
            Welcome Back
          </h1>
          <p className="text-gray-500 mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            Enter your credentials to access your account
          </p>
          
          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center social-button-animation">
              <Icons.google className="w-5 h-5 text-gray-600" />
            </button>
            <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center social-button-animation">
              <Icons.microsoft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <p className="text-gray-500 text-sm mb-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            or use your email password
          </p>
          
          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <LoginForm />
          </div>
        </div>

        {/* Right Section - Sign Up CTA */}
        <div className="w-1/2 bg-[#6C63FF] p-12 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[200%] h-[200%] bg-[#5b53ff] rounded-[50%] -translate-y-1/2 -translate-x-1/4 opacity-50"></div>
          <div className="relative z-10 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <h2 className="text-4xl font-bold mb-4 animate-slide-down" style={{ animationDelay: '0.9s' }}>
              New Here?
            </h2>
            <p className="text-center mb-8 text-gray-100 max-w-[300px] animate-slide-up" style={{ animationDelay: '1s' }}>
              Sign up and discover a great amount of new opportunities!
            </p>
            <Link 
              to="/signup"
              className="inline-block px-10 py-2 border-2 border-white rounded-full text-white hover:bg-white hover:text-[#6C63FF] transition-all duration-300 button-hover-animation animate-fade-in"
              style={{ animationDelay: '1.1s' }}
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 