import type { SSHProfile, SSHTerminalLine } from '../../types/ssh';

export const INITIAL_DEMO_SSH_PROFILES: SSHProfile[] = [
  {
    id: 'ssh-dev-server',
    name: 'Development Linux Box',
    host: 'dev.internal.devdesk.local',
    port: 22,
    username: 'developer',
    authMethod: 'key',
    keyPath: '~/.ssh/id_ed25519',
    tags: ['development', 'internal'],
    lastConnected: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
  },
  {
    id: 'ssh-staging-api',
    name: 'Staging Kubernetes Node',
    host: 'staging-k8s-node-01.cloud.infra',
    port: 2222,
    username: 'deploy',
    authMethod: 'agent',
    tags: ['staging', 'k8s'],
    lastConnected: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
  },
];

export interface SSHValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateSSHProfile(profile: Partial<SSHProfile>): SSHValidationResult {
  if (!profile.name?.trim()) {
    return { isValid: false, error: 'Profile name is required.' };
  }
  if (!profile.host?.trim()) {
    return { isValid: false, error: 'Host or IP address is required.' };
  }
  if (!profile.username?.trim()) {
    return { isValid: false, error: 'Username is required.' };
  }
  const port = profile.port ?? 22;
  if (isNaN(port) || port < 1 || port > 65535) {
    return { isValid: false, error: 'Port must be a valid number between 1 and 65535.' };
  }

  return { isValid: true };
}

export function simulateSSHCommand(
  command: string,
  profile: SSHProfile
): { output: string; type: 'output' | 'error' | 'system' } {
  const trimmed = command.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return { output: '', type: 'output' };
  }

  if (lower === 'help') {
    return {
      output: `Available sandbox commands:
  uptime     - Show server uptime and load averages
  uname -a   - Show kernel and system architecture
  whoami     - Print current effective user ID
  hostname   - Show system network name
  date       - Display current system date and UTC time
  ps aux     - List running system processes
  df -h      - Show disk space usage statistics
  env        - Display sanitized environment variables
  clear      - Clear terminal screen history`,
      type: 'system',
    };
  }

  if (lower === 'uptime') {
    return {
      output: ' 14:40:12 up 42 days,  3:18,  2 users,  load average: 0.12, 0.08, 0.05',
      type: 'output',
    };
  }

  if (lower === 'whoami') {
    return { output: profile.username, type: 'output' };
  }

  if (lower === 'hostname') {
    return { output: profile.host, type: 'output' };
  }

  if (lower === 'uname -a' || lower === 'uname') {
    return {
      output: 'Linux devdesk-host 6.6.14-generic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
      type: 'output',
    };
  }

  if (lower === 'date') {
    return { output: new Date().toUTCString(), type: 'output' };
  }

  if (lower === 'ps' || lower === 'ps aux') {
    return {
      output: `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1  22556  4120 ?        Ss   08:00   0:01 /sbin/init
${profile.username}  242  0.0  0.4 108920 18400 pts/0    Ss+  08:15   0:00 /bin/bash
${profile.username}  890  0.1  0.8 748290 32100 ?        Sl   08:20   0:04 node /app/server.js`,
      type: 'output',
    };
  }

  if (lower === 'df -h') {
    return {
      output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/root        50G   14G   34G  30% /
tmpfs           7.8G     0  7.8G   0% /dev/shm
/dev/sda1       100G   22G   73G  24% /data`,
      type: 'output',
    };
  }

  if (lower === 'env') {
    return {
      output: `USER=${profile.username}
HOME=/home/${profile.username}
SHELL=/bin/bash
TERM=xterm-256color
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SSH_CLIENT=192.168.1.100 54321 ${profile.port}
SSH_CONNECTION=192.168.1.100 54321 192.168.1.1 ${profile.port}`,
      type: 'output',
    };
  }

  return {
    output: `bash: ${trimmed}: command executed in virtual session. (For native process execution, connect DevDesk native daemon).`,
    type: 'output',
  };
}

export function createWelcomeBanner(profile: SSHProfile): SSHTerminalLine[] {
  return [
    {
      id: `sys-${Date.now()}-1`,
      type: 'system',
      text: `Connected to ${profile.username}@${profile.host}:${profile.port}`,
      timestamp: new Date().toISOString(),
    },
    {
      id: `sys-${Date.now()}-2`,
      type: 'system',
      text: 'Notice: Direct TCP raw socket access is restricted by browser sandbox standards. Active session is operating with the DevDesk terminal protocol adapter.',
      timestamp: new Date().toISOString(),
    },
    {
      id: `sys-${Date.now()}-3`,
      type: 'system',
      text: 'Type "help" to inspect supported commands or "clear" to reset terminal.',
      timestamp: new Date().toISOString(),
    },
  ];
}
