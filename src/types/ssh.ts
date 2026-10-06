export type SSHAuthMethod = 'key' | 'agent' | 'password';

export interface SSHProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: SSHAuthMethod;
  keyPath?: string;
  // Passwords are encrypted or masked in UI; never stored in plaintext
  hasPassword?: boolean;
  tags?: string[];
  lastConnected?: string;
  createdAt: string;
}

export interface SSHTerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp: string;
}

export interface SSHConnectionState {
  profileId: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
  connectedAt?: string;
}
