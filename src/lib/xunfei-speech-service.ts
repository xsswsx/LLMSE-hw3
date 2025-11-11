/**
 * 简化版科大讯飞语音识别服务
 * 使用浏览器原生语音识别API进行语音转文字
 */

interface SpeechRecognitionOptions {
  onStart?: () => void;
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class XunfeiSpeechService {
  private recognition: any = null;
  private isRecording = false;
  private finalText = '';

  constructor() {
    this.initializeRecognition();
  }

  /**
   * 初始化语音识别
   */
  private initializeRecognition(): void {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('浏览器不支持语音识别API');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; // 连续识别
    this.recognition.interimResults = true; // 获取临时结果
    this.recognition.lang = 'zh-CN'; // 中文识别

    this.recognition.onstart = () => {
      this.isRecording = true;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // 更新最终文本
      if (finalTranscript) {
        this.finalText += finalTranscript;
      }

      // 实时显示识别结果
      const displayText = this.finalText + interimTranscript;
      if (this.onResult) {
        this.onResult(displayText);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }

  private onStart?: () => void;
  private onResult?: (text: string) => void;
  private onEnd?: () => void;
  private onError?: (error: string) => void;

  /**
   * 开始语音识别
   */
  async startRecognition(options: SpeechRecognitionOptions = {}): Promise<void> {
    if (!this.recognition) {
      throw new Error('浏览器不支持语音识别功能');
    }

    if (this.isRecording) {
      throw new Error('语音识别正在进行中');
    }

    // 设置回调函数
    this.onStart = options.onStart;
    this.onResult = options.onResult;
    this.onEnd = options.onEnd;
    this.onError = options.onError;

    // 重置文本
    this.finalText = '';

    try {
      this.recognition.start();
      this.onStart?.();
    } catch (error) {
      console.error('启动语音识别失败:', error);
      this.onError?.('启动语音识别失败');
    }
  }

  /**
   * 停止语音识别
   */
  stopRecognition(): void {
    if (!this.recognition || !this.isRecording) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('停止语音识别失败:', error);
    }
  }

  /**
   * 检查浏览器兼容性
   */
  static isSupported(): boolean {
    return !!(window.SpeechRecognition || 
             (window as any).webkitSpeechRecognition);
  }

  /**
   * 实例方法：检查浏览器兼容性
   */
  isSupported(): boolean {
    return XunfeiSpeechService.isSupported();
  }

  /**
   * 实例方法：检查浏览器兼容性
   */
  isSupported(): boolean {
    return XunfeiSpeechService.isSupported();
  }

  /**
   * 获取最终识别的文本
   */
  getFinalText(): string {
    return this.finalText;
  }

  /**
   * 销毁资源
   */
  destroy(): void {
    this.stopRecognition();
    this.recognition = null;
  }
}

// 创建全局实例
export const xunfeiSpeechService = new XunfeiSpeechService();