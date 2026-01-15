/**
 * Cross-platform Alert Utility
 * 
 * Works on iOS, Android, and Web
 * - Uses native Alert.alert on mobile
 * - Uses window.confirm/alert on web (with better UX)
 */

import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Show a simple alert message (OK only)
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    // On web, use window.alert
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Show a confirmation dialog with Cancel/Confirm buttons
 * Returns true if confirmed, false if cancelled
 */
export async function showConfirm(
  title: string,
  message?: string,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel',
  destructive: boolean = false
): Promise<boolean> {
  if (Platform.OS === 'web') {
    // On web, use window.confirm
    const fullMessage = message ? `${title}\n\n${message}` : title;
    return window.confirm(fullMessage);
  }

  // On mobile, use Alert.alert with Promise
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      { 
        text: confirmText, 
        style: destructive ? 'destructive' : 'default', 
        onPress: () => resolve(true) 
      },
    ]);
  });
}

/**
 * Show an alert with custom buttons (advanced)
 */
export async function showAlertWithButtons(
  title: string,
  message: string | undefined,
  buttons: AlertButton[]
): Promise<number> {
  if (Platform.OS === 'web') {
    // On web, we need custom handling
    // For simple 2-button dialogs, use confirm
    if (buttons.length === 2) {
      const cancelBtn = buttons.find(b => b.style === 'cancel');
      const actionBtn = buttons.find(b => b.style !== 'cancel');
      
      const fullMessage = message ? `${title}\n\n${message}` : title;
      const confirmed = window.confirm(fullMessage);
      
      if (confirmed && actionBtn?.onPress) {
        await actionBtn.onPress();
        return buttons.indexOf(actionBtn);
      } else if (!confirmed && cancelBtn?.onPress) {
        await cancelBtn.onPress();
        return buttons.indexOf(cancelBtn);
      }
      return confirmed ? 1 : 0;
    }
    
    // For more complex dialogs with 3+ buttons, show a simple prompt
    // This is a fallback - ideally use custom modals for complex cases
    const buttonTexts = buttons.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
    const choice = window.prompt(
      `${title}\n${message || ''}\n\nChoose:\n${buttonTexts}\n\nEnter number:`,
      '1'
    );
    
    const index = parseInt(choice || '0', 10) - 1;
    if (index >= 0 && index < buttons.length && buttons[index].onPress) {
      await buttons[index].onPress();
    }
    return index;
  }

  // On mobile, use Alert.alert with Promise
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      buttons.map((btn, index) => ({
        text: btn.text,
        style: btn.style,
        onPress: async () => {
          if (btn.onPress) await btn.onPress();
          resolve(index);
        },
      }))
    );
  });
}

/**
 * Show success message
 */
export function showSuccess(title: string, message?: string): void {
  showAlert(`✓ ${title}`, message);
}

/**
 * Show error message
 */
export function showError(title: string, message?: string): void {
  showAlert(`✗ ${title}`, message);
}
