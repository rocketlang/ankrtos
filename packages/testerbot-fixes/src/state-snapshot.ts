/**
 * State Snapshot Utilities
 * Helper functions for capturing and restoring system state
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { FixState } from './types';

/**
 * State snapshot utility class
 */
export class StateSnapshot {
  /**
   * Capture file state (content and metadata)
   */
  static captureFileState(filePath: string): FixState {
    const resolvedPath = path.resolve(filePath);
    const exists = fs.existsSync(resolvedPath);

    let content = '';
    let stats: any = null;

    if (exists) {
      try {
        content = fs.readFileSync(resolvedPath, 'utf-8');
        const fileStats = fs.statSync(resolvedPath);
        stats = {
          size: fileStats.size,
          mode: fileStats.mode,
          mtime: fileStats.mtime.toISOString()
        };
      } catch (err) {
        // File might be binary or unreadable
        stats = { error: (err as Error).message };
      }
    }

    return {
      timestamp: Date.now(),
      description: `File state: ${filePath}`,
      data: {
        filePath: resolvedPath,
        exists,
        content,
        stats
      }
    };
  }

  /**
   * Restore file state from snapshot
   */
  static restoreFileState(state: FixState): void {
    const { filePath, exists, content } = state.data;

    if (exists) {
      // Restore file
      fs.writeFileSync(filePath, content, 'utf-8');
    } else {
      // Remove file if it didn't exist before
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  /**
   * Capture directory state (file list and metadata)
   */
  static captureDirectoryState(dirPath: string, options?: {
    recursive?: boolean;
    captureContent?: boolean;
  }): FixState {
    const resolvedPath = path.resolve(dirPath);
    const exists = fs.existsSync(resolvedPath);

    let files: string[] = [];
    let fileStates: Record<string, any> = {};

    if (exists) {
      files = fs.readdirSync(resolvedPath);

      if (options?.captureContent) {
        for (const file of files) {
          const fullPath = path.join(resolvedPath, file);
          const isDirectory = fs.statSync(fullPath).isDirectory();

          if (!isDirectory) {
            try {
              fileStates[file] = {
                content: fs.readFileSync(fullPath, 'utf-8'),
                stats: fs.statSync(fullPath)
              };
            } catch (err) {
              fileStates[file] = { error: (err as Error).message };
            }
          }
        }
      }
    }

    return {
      timestamp: Date.now(),
      description: `Directory state: ${dirPath}`,
      data: {
        dirPath: resolvedPath,
        exists,
        files,
        fileStates,
        recursive: options?.recursive || false
      }
    };
  }

  /**
   * Restore directory state from snapshot
   */
  static restoreDirectoryState(state: FixState): void {
    const { dirPath, exists, files, fileStates } = state.data;

    if (!exists) {
      // Remove directory if it didn't exist before
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      return;
    }

    // Restore directory
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Restore files
    for (const [filename, fileData] of Object.entries(fileStates)) {
      const fullPath = path.join(dirPath, filename);
      if (fileData && typeof fileData === 'object' && 'content' in fileData) {
        fs.writeFileSync(fullPath, (fileData as any).content, 'utf-8');
      }
    }
  }

  /**
   * Capture service state
   */
  static captureServiceState(serviceName: string): FixState {
    let status = 'unknown';
    let pid: string | null = null;

    try {
      const result = execSync(`systemctl is-active ${serviceName}`, { encoding: 'utf-8' });
      status = result.trim();
    } catch (err) {
      status = 'inactive';
    }

    try {
      const pidResult = execSync(`pgrep -x ${serviceName} || pgrep ${serviceName}`, { encoding: 'utf-8' });
      pid = pidResult.trim();
    } catch (err) {
      pid = null;
    }

    return {
      timestamp: Date.now(),
      description: `Service state: ${serviceName}`,
      data: {
        serviceName,
        status,
        pid,
        wasRunning: status === 'active' || pid !== null
      }
    };
  }

  /**
   * Restore service state from snapshot
   */
  static async restoreServiceState(state: FixState): Promise<void> {
    const { serviceName, wasRunning } = state.data;

    try {
      if (wasRunning) {
        // Service was running, ensure it's running now
        execSync(`sudo systemctl start ${serviceName} || sudo service ${serviceName} start`);
      } else {
        // Service was not running, ensure it's stopped
        execSync(`sudo systemctl stop ${serviceName} || sudo service ${serviceName} stop`);
      }
    } catch (err) {
      console.warn(`Failed to restore service state for ${serviceName}:`, (err as Error).message);
    }
  }

  /**
   * Capture environment variables state
   */
  static captureEnvState(varNames?: string[]): FixState {
    const vars: Record<string, string | undefined> = {};

    if (varNames) {
      for (const varName of varNames) {
        vars[varName] = process.env[varName];
      }
    } else {
      // Capture all env vars
      Object.assign(vars, process.env);
    }

    return {
      timestamp: Date.now(),
      description: 'Environment variables state',
      data: { vars }
    };
  }

  /**
   * Restore environment variables from snapshot
   */
  static restoreEnvState(state: FixState): void {
    const { vars } = state.data;

    for (const [varName, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[varName];
      } else {
        process.env[varName] = value as string;
      }
    }
  }

  /**
   * Capture process state (running processes on a port)
   */
  static captureProcessState(port?: number): FixState {
    const processes: any[] = [];

    try {
      let command = 'ps aux';
      if (port) {
        command = `lsof -ti :${port} | xargs ps -p`;
      }

      const result = execSync(command, { encoding: 'utf-8' });
      const lines = result.split('\n').filter(l => l.trim());

      for (const line of lines) {
        processes.push({ info: line });
      }
    } catch (err) {
      // No processes or command failed
    }

    return {
      timestamp: Date.now(),
      description: port ? `Process state on port ${port}` : 'Process state',
      data: {
        port,
        processes,
        count: processes.length
      }
    };
  }

  /**
   * Create a composite snapshot of multiple states
   */
  static createCompositeSnapshot(snapshots: {
    name: string;
    state: FixState;
  }[]): FixState {
    return {
      timestamp: Date.now(),
      description: 'Composite state snapshot',
      data: {
        snapshots: snapshots.map(s => ({
          name: s.name,
          state: s.state
        }))
      }
    };
  }

  /**
   * Restore from composite snapshot
   */
  static async restoreCompositeSnapshot(state: FixState): Promise<void> {
    const { snapshots } = state.data;

    for (const snapshot of snapshots) {
      console.log(`  Restoring ${snapshot.name}...`);

      try {
        // Determine type and restore appropriately
        const desc = snapshot.state.description.toLowerCase();

        if (desc.includes('file state')) {
          this.restoreFileState(snapshot.state);
        } else if (desc.includes('directory state')) {
          this.restoreDirectoryState(snapshot.state);
        } else if (desc.includes('service state')) {
          await this.restoreServiceState(snapshot.state);
        } else if (desc.includes('environment')) {
          this.restoreEnvState(snapshot.state);
        }
      } catch (err) {
        console.warn(`  Failed to restore ${snapshot.name}:`, (err as Error).message);
      }
    }
  }

  /**
   * Save snapshot to disk
   */
  static saveSnapshotToDisk(state: FixState, outputPath: string): void {
    const json = JSON.stringify(state, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');
  }

  /**
   * Load snapshot from disk
   */
  static loadSnapshotFromDisk(inputPath: string): FixState {
    const json = fs.readFileSync(inputPath, 'utf-8');
    return JSON.parse(json);
  }
}
