'use server';

// The 'paiza-io' npm package is CJS, so 'require' is typically used.
// In Next.js Server Actions (which run in a Node.js environment), this should work.
// const paiza = require('paiza-io');

interface PaizaIOOptions {
  source_code: string;
  language: string;
  input: string;
  api_key: string;
  longpoll?: boolean;
  longpoll_timeout?: number;
}

export interface PaizaExecutionResult {
  id?: string;
  language?: string;
  note?: string | null;
  status?: string; // e.g., 'running', 'completed', 'failure'
  build_stdout?: string | null;
  build_stderr?: string | null;
  build_exit_code?: number | null;
  build_time?: string | null;
  build_memory?: number | null;
  build_result?: string | null; // e.g., "success" or "failure"
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: number | null;
  time?: string | null;
  memory?: number | null;
  connections?: number | null;
  result?: string | null; // e.g., "success" or "failure"

  // Custom fields for our action's error reporting
  error?: string; // For general errors from the action itself
  message?: string; // For error messages from the paiza-io package's error object
}

export async function executeCodeAction(
  language: string,
  source_code: string,
  input: string
): Promise<PaizaExecutionResult> {
  // const apiKey = process.env.NEXT_PUBLIC_PAIZA_API_KEY || 'guest';

  /*
  const options: PaizaIOOptions = {
    source_code,
    language,
    input,
    api_key: apiKey,
    longpoll: true, 
    longpoll_timeout: 5
  };
  */

  console.log('[executeCodeAction] Paiza.IO package is temporarily removed due to install issues. Returning mock error.');
  // console.log('[executeCodeAction] Sending to Paiza.IO with options:', { language, inputLength: input.length, apiKeyUsed: apiKey, sourceCodeLength: source_code.length });

  return new Promise<PaizaExecutionResult>((resolve) => {
    resolve({
      error: 'Code execution service (Paiza.IO) is temporarily unavailable due to package installation issues. Please try again later or contact support.',
      status: 'error_service_unavailable'
    });
    /*
    try {
      paiza(options, (error: any, result: PaizaExecutionResult) => {
        if (error) {
          console.error('[executeCodeAction] Paiza.IO package error:', error);
          let errorMessage = 'Paiza.IO execution failed.';
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error.message === 'string') {
            errorMessage = error.message;
          } else if (error && typeof error.error === 'string') { // Some error objects have an 'error' property
            errorMessage = error.error;
          }
          resolve({ error: errorMessage, status: 'error_package_level' });
          return;
        }
        console.log('[executeCodeAction] Paiza.IO package result:', result);
        resolve({ ...result, status: result.status || 'unknown' });
      });
    } catch (e) {
      console.error('[executeCodeAction] Exception calling Paiza.IO package:', e);
      resolve({ error: 'Exception during Paiza.IO call.', status: 'error_exception' });
    }
    */
  });
}
