export interface SDCardContextMenuAction {
  label?: string;
  // TODO: Tighten icon type if needed; BlueprintJS MenuItem accepts string or element
  icon?: any;
  onClick?: () => void;
  intent?: 'primary' | 'danger' | 'success' | 'warning' | undefined;
  disabled?: boolean;
  divider?: boolean;
  children?: SDCardContextMenuAction[];
} 