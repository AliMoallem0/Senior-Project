import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { testDatabaseConnection } from '@/services/dbService';
import { supabase } from '@/lib/supabase';

/**
 * Database Diagnostic Component
 * Run tests to see why Supabase connections might be failing
 */
export function DatabaseDiagnostic() {
  const [results, setResults] = useState<{
    connected: boolean;
    authenticated: boolean;
    canReadTable: boolean;
    canWriteTable: boolean;
    error?: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Get detailed session info
      const { data } = await supabase.auth.getSession();
      setSessionInfo({
        hasSession: !!data?.session,
        userId: data?.session?.user?.id,
        email: data?.session?.user?.email,
        role: data?.session?.user?.role,
        tokenExpiry: data?.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'N/A'
      });
      
      // Run the diagnostic test
      const testResults = await testDatabaseConnection();
      setResults(testResults);
      
      console.log('Database diagnostic results:', testResults);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Database Connection Diagnostic</CardTitle>
        <CardDescription>
          Test your Supabase database connection to diagnose issues with saving AI results
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!results ? (
          <div className="text-center p-6">
            <p className="mb-4">Run the diagnostic test to check your database connection</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <StatusIcon success={results.connected} />
                <span>Database Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={results.authenticated} />
                <span>Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={results.canReadTable} />
                <span>Read Permission</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={results.canWriteTable} />
                <span>Write Permission</span>
              </div>
            </div>
            
            {results.error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Error Details</p>
                    <p className="text-sm">{results.error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {sessionInfo && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="font-medium mb-2">Authentication Details</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Status: </span>
                    {sessionInfo.hasSession ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Logged In
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Not Logged In
                      </Badge>
                    )}
                  </p>
                  {sessionInfo.hasSession && (
                    <>
                      <p><span className="font-medium">User ID: </span>{sessionInfo.userId}</p>
                      <p><span className="font-medium">Email: </span>{sessionInfo.email}</p>
                      <p><span className="font-medium">Role: </span>{sessionInfo.role}</p>
                      <p><span className="font-medium">Token Expires: </span>{sessionInfo.tokenExpiry}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={runDiagnostics}
          disabled={loading}
          variant="default"
        >
          {loading ? 'Running...' : results ? 'Run Again' : 'Run Diagnostic'}
        </Button>
        
        {results && !results.canWriteTable && (
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function StatusIcon({ success }: { success: boolean }) {
  return success ? (
    <CheckCircle className="w-5 h-5 text-green-500" />
  ) : (
    <XCircle className="w-5 h-5 text-red-500" />
  );
}
