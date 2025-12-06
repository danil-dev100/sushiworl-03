// Script para gerar som de alerta urgente
const fs = require('fs');

// Criar um som simples de beep
function generateBeepSound(duration = 1000, frequency = 800, volume = 0.7) {
  const sampleRate = 44100;
  const numSamples = duration * sampleRate / 1000;
  const buffer = Buffer.alloc(numSamples * 2);
  
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * volume * 32767;
    buffer.writeInt16LE(sample, i * 2);
  }
  
  return buffer;
}

// Gerar som contínuo (5 segundos loop)
const soundData = generateBeepSound(5000, 800, 0.5);

// Salvar como WAV (formato simples)
const wavHeader = Buffer.from(
  'RIFF' +                           // ChunkID
  '\x24\x00\x00\x00' +               // ChunkSize (36 + data)
  'WAVE' +                           // Format
  'fmt ' +                           // Subchunk1ID
  '\x10\x00\x00\x00' +               // Subchunk1Size (16)
  '\x01\x00' +                       // AudioFormat (1 = PCM)
  '\x01\x00' +                       // NumChannels (1)
  '\x44\xac\x00\x00' +               // SampleRate (44100)
  '\x88\x58\x01\x00' +               // ByteRate (44100 * 2)
  '\x02\x00' +                       // BlockAlign (2)
  '\x10\x00' +                       // BitsPerSample (16)
  'data' +                           // Subchunk2ID
  '\x00\x00\x00\x00',                // Subchunk2Size (placeholder)
  'binary'
);

// Atualizar tamanho do chunk
const fileSize = wavHeader.length + soundData.length - 8;
wavHeader.writeUInt32LE(fileSize, 4);
wavHeader.writeUInt32LE(soundData.length, 40);

// Combinar header e dados
const finalBuffer = Buffer.concat([wavHeader, soundData]);

// Salvar arquivo
fs.writeFileSync('public/sounds/urgent-alert.wav', finalBuffer);
console.log('✅ Som de alerta gerado: public/sounds/urgent-alert.wav');
