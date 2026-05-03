/**
 * 全局弹窗管理器
 * 用于管理多层弹窗的 ESC 键响应，确保 ESC 只关闭最上层的弹窗
 */

interface ModalInstance {
  id: string;
  onClose: () => void;
  onESC?: () => Promise<boolean> | boolean;
  zIndex: number;
}

class ModalManager {
  private modals: ModalInstance[] = [];
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private nextZIndex = 1000;

  /**
   * 注册一个弹窗实例
   */
  register(modal: ModalInstance): void {
    // 移除已存在的相同 ID 的弹窗
    this.unregister(modal.id);

    // 添加新弹窗
    this.modals.push({
      ...modal,
      zIndex: this.nextZIndex++,
    });

    // 如果这是第一个弹窗，添加键盘事件监听
    if (this.modals.length === 1) {
      this.addKeyboardListener();
    }
  }

  /**
   * 注销一个弹窗实例
   */
  unregister(id: string): void {
    this.modals = this.modals.filter((modal) => modal.id !== id);

    // 如果没有弹窗了，移除键盘事件监听
    if (this.modals.length === 0) {
      this.removeKeyboardListener();
    }
  }

  /**
   * 获取最上层的弹窗
   */
  private getTopModal(): ModalInstance | null {
    if (this.modals.length === 0) return null;

    return this.modals.reduce((topModal, current) => (current.zIndex > topModal.zIndex ? current : topModal));
  }

  /**
   * 添加键盘事件监听
   */
  private addKeyboardListener(): void {
    if (this.keydownHandler) return;

    this.keydownHandler = async (event: KeyboardEvent) => {
      // 只处理 ESC 键
      if (event.key !== 'Escape') return;

      const topModal = this.getTopModal();
      if (!topModal) return;

      // 阻止默认行为
      event.preventDefault();
      event.stopPropagation();

      try {
        // 如果有自定义的 onESC 处理函数
        if (topModal.onESC) {
          const result = await topModal.onESC();
          // 只有返回 true 时才关闭弹窗
          if (result === true) {
            topModal.onClose();
          }
        } else {
          // 没有自定义处理函数，直接关闭
          topModal.onClose();
        }
      } catch (error) {
        console.error('Error in modal ESC handler:', error);
        // 出错时默认关闭弹窗
        topModal.onClose();
      }
    };

    // 添加到 document，使用 capture 阶段确保优先处理
    document.addEventListener('keydown', this.keydownHandler, true);
  }

  /**
   * 移除键盘事件监听
   */
  private removeKeyboardListener(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler, true);
      this.keydownHandler = null;
    }
  }

  /**
   * 获取弹窗数量
   */
  getModalCount(): number {
    return this.modals.length;
  }

  /**
   * 获取所有弹窗的信息（用于调试）
   */
  getModalsInfo(): Array<{ id: string; zIndex: number }> {
    return this.modals.map((modal) => ({
      id: modal.id,
      zIndex: modal.zIndex,
    }));
  }

  /**
   * 清理所有弹窗（用于应用卸载时）
   */
  cleanup(): void {
    this.modals = [];
    this.removeKeyboardListener();
    this.nextZIndex = 1000;
  }
}

// 创建全局单例实例
export const modalManager = new ModalManager();

// 在开发环境下暴露到 window 对象，方便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { modalManager: ModalManager }).modalManager = modalManager;
}
