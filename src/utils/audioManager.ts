import type { SoundType, AudioSettings } from '../types/pomodoro'

/**
 * 音效管理器
 * 處理番茄鐘和健康提醒的音效播放
 */
export class AudioManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<SoundType, AudioBuffer> = new Map()
  private settings: AudioSettings
  
  constructor(settings: AudioSettings) {
    this.settings = settings
    // Don't initialize audio context until user interaction
  }

  /**
   * 初始化音頻上下文
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new AudioContext()
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  /**
   * 載入音效檔案
   */
  private async loadSounds(): Promise<void> {
    if (!this.audioContext) return

    const soundFiles = {
      workStart: '/sounds/work-start.mp3',
      workEnd: '/sounds/work-end.mp3',
      breakStart: '/sounds/break-start.mp3',
      breakEnd: '/sounds/break-end.mp3',
      healthReminder: '/sounds/health-reminder.mp3'
    }

    let loadedAnySound = false

    try {
      for (const [soundType, filePath] of Object.entries(soundFiles)) {
        const buffer = await this.loadAudioBuffer(filePath)
        if (buffer) {
          this.sounds.set(soundType as SoundType, buffer)
          loadedAnySound = true
        }
      }
      
      // 如果沒有載入任何音訊檔案，使用程序生成的音效
      if (!loadedAnySound) {
        console.info('No audio files found, using generated sounds as fallback')
        this.generateFallbackSounds()
      }
    } catch (error) {
      console.warn('Failed to load audio files:', error)
      // 使用程序生成的音效作為後備
      this.generateFallbackSounds()
    }
  }

  /**
   * 載入音頻緩衝區
   */
  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null

    try {
      const response = await fetch(url)
      
      // 檢查 HTTP 狀態
      if (!response.ok) {
        if (response.status === 404) {
          console.debug(`Audio file not found: ${url}`)
        } else {
          console.warn(`Failed to fetch audio file: ${url}, status: ${response.status}`)
        }
        return null
      }
      
      const arrayBuffer = await response.arrayBuffer()
      return await this.audioContext.decodeAudioData(arrayBuffer)
    } catch (error) {
      // 只在非 404 錯誤時顯示警告
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.debug(`Audio file not accessible: ${url}`)
      } else {
        console.warn(`Failed to load audio file: ${url}`, error)
      }
      return null
    }
  }

  /**
   * 生成程序音效作為後備
   */
  private generateFallbackSounds(): void {
    if (!this.audioContext) return

    const sampleRate = this.audioContext.sampleRate

    // 工作開始音效 - 激勵的上升和弦
    this.sounds.set('workStart', this.generateChord([523, 659, 784], 0.8, sampleRate))
    
    // 工作結束音效 - 完成提示音
    this.sounds.set('workEnd', this.generateSuccessChime(sampleRate))
    
    // 休息開始音效 - 放鬆音調
    this.sounds.set('breakStart', this.generateSoftTone(330, 0.6, sampleRate))
    
    // 休息結束音效 - 輕柔提醒
    this.sounds.set('breakEnd', this.generateChord([392, 494, 587], 0.7, sampleRate))
    
    // 健康提醒音效 - 溫柔提醒鈴聲
    this.sounds.set('healthReminder', this.generateBellTone(220, 1.0, sampleRate))
  }

  /**
   * 生成音調
   */
  private generateTone(
    startFreq: number, 
    endFreq: number, 
    duration: number, 
    sampleRate: number
  ): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const freq = startFreq + (endFreq - startFreq) * (t / duration)
      const volume = Math.exp(-t * 2) // 指數衰減
      data[i] = Math.sin(2 * Math.PI * freq * t) * volume * 0.3
    }

    return buffer
  }

  /**
   * 生成和弦音效
   */
  private generateChord(frequencies: number[], duration: number, sampleRate: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      let sample = 0
      
      // 合成多個頻率
      for (const freq of frequencies) {
        const envelope = Math.exp(-t * 3) * (1 - t / duration) // 漸進式衰減
        sample += Math.sin(2 * Math.PI * freq * t) * envelope
      }
      
      data[i] = sample * 0.2 / frequencies.length // 平均音量並降低
    }

    return buffer
  }

  /**
   * 生成成功提示音
   */
  private generateSuccessChime(sampleRate: number): AudioBuffer {
    const duration = 1.0
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)
    
    // 三個遞增音符的序列
    const notes = [523, 659, 784] // C5, E5, G5
    const noteLength = duration / 3

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const noteIndex = Math.floor(t / noteLength)
      const noteTime = t - noteIndex * noteLength
      
      if (noteIndex < notes.length) {
        const freq = notes[noteIndex]
        const envelope = Math.exp(-noteTime * 2) * (1 - noteTime / noteLength)
        data[i] = Math.sin(2 * Math.PI * freq * noteTime) * envelope * 0.3
      }
    }

    return buffer
  }

  /**
   * 生成柔和音調
   */
  private generateSoftTone(frequency: number, duration: number, sampleRate: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.sin((t / duration) * Math.PI) // 正弦包絡
      const wave = Math.sin(2 * Math.PI * frequency * t)
      data[i] = wave * envelope * 0.2
    }

    return buffer
  }

  /**
   * 生成鈴聲音效
   */
  private generateBellTone(baseFreq: number, duration: number, sampleRate: number): AudioBuffer {
    const buffer = this.audioContext!.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      
      // 基本頻率和泛音
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t)
      const harmonic2 = Math.sin(2 * Math.PI * baseFreq * 2.5 * t) * 0.5
      const harmonic3 = Math.sin(2 * Math.PI * baseFreq * 4 * t) * 0.25
      
      // 鈴聲特有的指數衰減
      const envelope = Math.exp(-t * 1.5)
      
      data[i] = (fundamental + harmonic2 + harmonic3) * envelope * 0.15
    }

    return buffer
  }

  /**
   * 播放音效
   */
  async play(soundType: SoundType): Promise<void> {
    if (!this.settings.enabled) {
      return
    }

    // Initialize audio context on first play (user interaction)
    if (!this.audioContext) {
      this.initializeAudioContext()
      await this.loadSounds()
    }

    if (!this.audioContext || !this.sounds.has(soundType)) {
      return
    }

    try {
      const buffer = this.sounds.get(soundType)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      gainNode.gain.value = this.settings.volume

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start()
    } catch (error) {
      console.warn('Failed to play sound:', error)
    }
  }

  /**
   * 更新音效設定
   */
  updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }

  /**
   * 測試音效
   */
  testSound(soundType: SoundType): void {
    this.play(soundType)
  }

  /**
   * 釋放資源
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.sounds.clear()
  }
}