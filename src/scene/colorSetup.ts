import { ColorManagement } from 'three';

// Match the original treatment-plan viewer, which lights in display space with no colour management.
// Imported first in main.tsx so every Color constant is created after this switch.
ColorManagement.enabled = false;
