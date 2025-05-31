/**
 * SupabaseConfigError Component
 * 
 * A component that displays an error message when Supabase configuration is missing.
 * Features:
 * - Clear error messaging
 * - Environment variable requirements
 * - Link to Supabase dashboard
 * - Responsive design
 * - Dark mode support
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const SupabaseConfigError = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        {/* Card Header */}
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">Supabase Configuration Error</CardTitle>
          <CardDescription className="text-center">
            Missing environment variables for Supabase connection
          </CardDescription>
        </CardHeader>

        {/* Card Content */}
        <CardContent>
          {/* Error Alert */}
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              The application cannot connect to Supabase due to missing environment variables.
            </AlertDescription>
          </Alert>
          
          {/* Environment Variables List */}
          <div className="space-y-4 text-sm">
            <p>Please make sure you've set the following environment variables:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code></li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code></li>
            </ul>
            <p>
              You can find these values in your Supabase project settings under the "API" section.
            </p>
          </div>
        </CardContent>
        
        {/* Card Footer */}
        <CardFooter className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.open("https://app.supabase.com", "_blank")}
          >
            Go to Supabase Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupabaseConfigError;
