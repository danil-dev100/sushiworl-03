/**
 * Gerador de sons de notificação usando Web Audio API
 * Não requer arquivos de áudio externos
 */

export class NotificationSound {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Toca um som de alerta urgente (bip contínuo)
   */
  playUrgentAlert() {
    if (!this.audioContext || this.isPlaying) return;

    try {
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Configurar oscilador (tom de alerta)
      this.oscillator.type = 'sine';
      this.oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // 800 Hz

      // Configurar volume
      this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

      // Conectar nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Iniciar oscilador
      this.oscillator.start();

      // Criar efeito pulsante (bip-bip)
      this.createPulseEffect();

      this.isPlaying = true;
      console.log('🔊 Som de alerta iniciado');
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }

  /**
   * Cria efeito pulsante (bip-bip-bip)
   */
  private createPulseEffect() {
    if (!this.gainNode || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const pulseDuration = 0.2; // 200ms por pulso
    const pauseDuration = 0.3; // 300ms de pausa

    // Loop de pulsos
    const createPulse = (startTime: number) => {
      if (!this.gainNode || !this.isPlaying) return;

      // Fade in
      this.gainNode.gain.setValueAtTime(0, startTime);
      this.gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);

      // Sustain
      this.gainNode.gain.setValueAtTime(0.3, startTime + pulseDuration - 0.05);

      // Fade out
      this.gainNode.gain.linearRampToValueAtTime(0, startTime + pulseDuration);

      // Próximo pulso
      setTimeout(() => {
        if (this.isPlaying) {
          createPulse(this.audioContext!.currentTime);
        }
      }, (pulseDuration + pauseDuration) * 1000);
    };

    createPulse(now);
  }

  /**
   * Para o som de alerta
   */
  stopAlert() {
    try {
      if (this.oscillator) {
        try {
          this.oscillator.stop();
        } catch (e) {
          // Oscillator já foi parado
        }
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }

      this.isPlaying = false;
      console.log('🔇 Som de alerta parado');
    } catch (error) {
      console.error('Erro ao parar som:', error);
      // Forçar reset mesmo com erro
      this.isPlaying = false;
      this.oscillator = null;
      this.gainNode = null;
    }
  }

  /**
   * Toca um bip simples (sucesso/notificação)
   */
  playSuccessBeep() {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Erro ao tocar beep:', error);
    }
  }

  /**
   * Toca som de erro (tom grave)
   */
  playErrorSound() {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.5);
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
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
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
