import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ToolCategory =
  | 'Formatters & Parsers'
  | 'Encoding & Security'
  | 'Generators'
  | 'Inspectors & Helpers';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: LucideIcon;
  keywords: string[];
  component: ComponentType;
  isPopular?: boolean;
}
