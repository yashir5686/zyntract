
'use server';

export interface PaizaExecutionResult {
  id?: string;
  language?: string;
  note?: string | null;
  status?: string; // Paiza.IO status e.g., 'running', 'completed', 'service_unavailable'
  build_stdout?: string | null;
  build_stderr?: string | null;
  build_exit_code?: number | null;
  build_time?: string | null;
  build_memory?: number | null;
  build_result?: string | null; // Paiza.IO build_result e.g., 'success', 'failure', 'error'
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: number | null;
  time?: string | null;
  memory?: number | null;
  connections?: number | null; 
  result?: string | null; // Paiza.IO result e.g., 'success', 'failure', 'error', 'timeout'
  error?: string; // Custom error message for client-side issues or high-level API errors
  message?: string; // Additional message, e.g., if package is not installed
}

const POLLING_INTERVAL_MS = 1000; 

export async function executeCodeAction(
  language: string,
  source_code: string,
  input: string
): Promise<PaizaExecutionResult> {
  let PaizaIO;
  try {
    PaizaIO = require('@s10akir/node-paiza-io');
  } catch (error: any) {
    console.warn('[executeCodeAction] @s10akir/node-paiza-io package not found or failed to load:', error.message);
    return {
      language: language,
      status: 'service_unavailable',
      error: 'Code execution service is currently unavailable.',
      message: 'The @s10akir/node-paiza-io package is not installed or failed to load. Please check server logs and ensure dependencies are installed correctly.',
      build_stderr: 'Package not found.',
      stderr: 'Package not found.',
      result: 'failure',
    };
  }

  try {
    const paizaIO = new PaizaIO({
      apiKey: "guest", 
    });

    const runner = await paizaIO.createRunner({
      language: language,
      source_code: source_code,
      input: input,
    });

    while (await runner.checkRunning()) {
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
    }

    const details = await runner.getDetails();

    return {
      id: details.id,
      language: language, 
      note: details.note || null, 
      status: details.status, 
      build_stdout: details.build_stdout || null,
      build_stderr: details.build_stderr || null,
      build_exit_code: details.build_exit_code === undefined ? null : details.build_exit_code,
      build_time: details.build_time || null,
      build_memory: details.build_memory === undefined ? null : details.build_memory,
      build_result: details.build_result || null, 
      stdout: details.stdout || null,
      stderr: details.stderr || null,
      exit_code: details.exit_code === undefined ? null : details.exit_code,
      time: details.time || null,
      memory: details.memory === undefined ? null : details.memory,
      connections: null, 
      result: details.result || null, 
      error: null, 
      message: null, 
    };

  } catch (error: any) {
    console.error('[executeCodeAction] Error during Paiza.IO operation:', error);
    
    let errorMessage = 'An unexpected error occurred during code execution.';
    if (error.message && error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to the code execution service. Please check your network connection.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    return {
      language: language,
      status: 'api_error', 
      build_stdout: null,
      build_stderr: error.message || 'Failed to communicate with Paiza.IO.',
      build_exit_code: null,
      build_time: null,
      build_memory: null,
      build_result: 'error',
      stdout: null,
      stderr: error.message || 'Failed to execute code via Paiza.IO.',
      exit_code: null,
      time: null,
      memory: null,
      connections: null,
      result: 'failure',
      error: errorMessage,
      message: 'There was an issue communicating with the code execution service.',
    };
  }
}
