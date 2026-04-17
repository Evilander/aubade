import { spawn } from 'node:child_process';
import { platform } from 'node:os';

function resolvePlayer() {
  const p = platform();
  if (p === 'darwin') return { cmd: 'afplay', args: [] };
  if (p === 'win32') {
    return {
      cmd: 'powershell',
      args: [
        '-NoProfile', '-Command',
        `Add-Type -AssemblyName presentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([uri]::new($args[0])); $p.Play(); Start-Sleep -Seconds 1; while ($p.Position -lt $p.NaturalDuration.TimeSpan -or $p.NaturalDuration.HasTimeSpan -eq $false) { Start-Sleep -Milliseconds 200; if ($p.NaturalDuration.HasTimeSpan -and $p.Position -ge $p.NaturalDuration.TimeSpan) { break } }`
      ]
    };
  }
  return { cmd: 'ffplay', args: ['-nodisp', '-autoexit', '-loglevel', 'quiet'] };
}

export function playAudio(filePath) {
  const { cmd, args } = resolvePlayer();
  const child = spawn(cmd, [...args, filePath], {
    stdio: 'ignore',
    detached: false
  });
  return new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`Audio player exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

export function stopAudio(child) {
  if (child && !child.killed) child.kill();
}
