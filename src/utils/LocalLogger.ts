import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export class LocalLogger {
  private static LOG_FILE = 'app_logs.txt';

  /**
   * Append a general log message
   */
  static async log(message: string, data?: Record<string, any>) {
    await this.writeLog('INFO', message, data);
  }

  /**
   * Append an error log
   */
  static async error(message: string, error?: any) {
    await this.writeLog('ERROR', message, { error: error?.message || error });
  }

  /**
   * Core logger function
   */
  private static async writeLog(level: 'INFO' | 'ERROR', message: string, data?: Record<string, any>) {
    try {
      const timestamp = new Date().toISOString();
      let logEntry = `[${timestamp}] [${level}] ${message}`;
      if (data) {
        logEntry += ` | ${JSON.stringify(data)}`;
      }
      logEntry += '\n';

      // Use External directory for Android release visibility
      const directory = Directory.External;

      await Filesystem.appendFile({
        path: this.LOG_FILE,
        data: logEntry,
        directory,
        encoding: Encoding.UTF8,
      });
    } catch (err) {
      console.error('Failed to write log', err);
    }
  }

  /**
   * Read all logs
   */
  static async readLogs(): Promise<string> {
    try {
      const readResult = await Filesystem.readFile({
        path: this.LOG_FILE,
        directory: Directory.External,
        encoding: Encoding.UTF8,
      });
      if (typeof readResult.data === 'string') {
        return readResult.data;
      }
      return await readResult.data.text();
    } catch {
      return '';
    }
  }
}
