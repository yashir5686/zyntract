'use server';

// const paiza = require('paiza-io'); // Temporarily disabled

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
  status?: string; // e.g., 'running', 'completed', 'failure', 'error_service_unavailable'
  build_stdout?: string | null;
  build_stderr?: string | null;
  build_exit_code?: number | null;
  build_time?: string | null;
  build_memory?: number | null;
  build_result?: string | null;
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: number | null;
  time?: string | null;
  memory?: number | null;
  connections?: number | null;
  result?: string | null;
  error?: string;
  message?: string;
}


export async function executeCodeAction(
  language: string,
  source_code: string,
  input: string
): Promise<PaizaExecutionResult> {
  // const apiKey = process.env.NEXT_PUBLIC_PAIZA_API_KEY || 'guest';

  // const options = {
  //   api_key: apiKey,
  // };

  console.log('[executeCodeAction] Paiza.IO integration is temporarily disabled due to installation issues.');
  
  // Return a result indicating the service is unavailable
  return Promise.resolve({
    error: 'Code execution service is temporarily unavailable.',
    status: 'error_service_unavailable',
    message: 'The paiza-io package could not be installed. Please try again later or check the server logs.',
    stdout: null,
    stderr: 'Service Unavailable',
    build_stderr: null,
    exit_code: -1,
    build_exit_code: -1,
    result: 'failure',
  });

  // try {
  //   return new Promise<PaizaExecutionResult>((resolve) => {
  //     paiza(language, source_code, input, options, (error: any, result: PaizaExecutionResult) => {
  //       if (error) {
  //         console.error('[executeCodeAction] Paiza.IO package error:', error);
  //         let errorMessage = 'Paiza.IO execution failed.';
  //         if (typeof error === 'string') {
  //           errorMessage = error;
  //         } else if (error && typeof error.message === 'string') {
  //           errorMessage = error.message;
  //         } else if (error && typeof error.error === 'string') {
  //           errorMessage = error.error;
  //         }
  //         resolve({ error: errorMessage, status: 'error_package_level', message: errorMessage });
  //         return;
  //       }
  //       console.log('[executeCodeAction] Paiza.IO package result:', result);
  //       resolve({ ...result, status: result.status || 'unknown' });
  //     });
  //   });
  // } catch (e: any) {
  //   console.error('[executeCodeAction] Exception calling Paiza.IO package:', e);
  //   return Promise.resolve({ error: 'Exception during Paiza.IO call.', status: 'error_exception', message: e.message });
  // }
}
