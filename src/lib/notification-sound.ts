/**
 * Sistema de notificação sonora usando arquivos MP3
 */

export class NotificationSound {
  private urgentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Pré-carregar o áudio de alerta urgente
      this.urgentAudio = new Audio('/sounds/order-new.mp3');
      this.urgentAudio.loop = true;
      this.urgentAudio.volume = 0.7;
      this.urgentAudio.preload = 'auto';
    }
  }

  /**
   * Toca o som de alerta urgente (loop contínuo)
   */
  playUrgentAlert() {
    if (!this.urgentAudio || this.isPlaying) return;

    try {
      this.urgentAudio.currentTime = 0;
      this.urgentAudio.play().then(() => {
        this.isPlaying = true;
        console.log('🔊 Som de alerta iniciado');
      }).catch((error) => {
        console.error('Erro ao tocar som:', error);
      });
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }

  /**
   * Para o som de alerta
   */
  stopAlert() {
    if (!this.urgentAudio) return;

    try {
      this.urgentAudio.pause();
      this.urgentAudio.currentTime = 0;
      this.isPlaying = false;
      console.log('🔇 Som de alerta parado');
    } catch (error) {
      console.error('Erro ao parar som:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Toca um bip simples (sucesso/confirmação)
   */
  playSuccessBeep() {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio('/sounds/order-new.mp3');
      audio.volume = 0.3;
      audio.play().catch((error) => {
        console.error('Erro ao tocar beep:', error);
      });
    } catch (error) {
      console.error('Erro ao tocar beep:', error);
    }
  }

  /**
   * Toca som de erro/cancelamento (som único)
   */
  playErrorSound() {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio('/sounds/order-cancelled.mp3');
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.error('Erro ao tocar som de erro:', error);
      });
    } catch (error) {
      console.error('Erro ao tocar som de erro:', error);
    }
  }

  /**
   * Verifica se está tocando
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Limpa recursos
   */
  cleanup() {
    this.stopAlert();
    if (this.urgentAudio) {
      this.urgentAudio = null;
    }
  }
}

// Singleton para uso global
let soundInstance: NotificationSound | null = null;

export function getNotificationSound(): NotificationSound {
  if (!soundInstance) {
    soundInstance = new NotificationSound();
  }
  return soundInstance;
}
