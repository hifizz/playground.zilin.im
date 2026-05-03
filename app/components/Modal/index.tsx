import { modalManager } from '@/app/components/Modal/modalManager';
import { ModalProps } from '@/app/types';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { AlertTriangleIcon } from './AlertTriangleIcon'; // 假设这些图标存在
import { XIcon } from './XIcon'; // 假设这些图标存在
import ReactDOM from 'react-dom/client';
import { InfoIcon } from './InfoIcon';

// 新增：简版模态框的 Props 类型
interface ShortModalProps {
  title?: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  okText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'error' | 'warn' | 'confirm';
}

// 新增：用于渲染简版模态框的组件
const ShortModalComponent: React.FC<ShortModalProps & { closeModal: () => void }> = ({
  title,
  content,
  icon,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  type = 'info',
  closeModal,
}) => {
  const handleOk = async () => {
    if (onOk) await onOk();
    closeModal();
  };

  const handleCancel = async () => {
    if (onCancel) await onCancel();
    closeModal();
  };

  let typeIcon = icon;
  let iconColorClass = '';
  if (!icon) {
    switch (type) {
      case 'success':
        typeIcon = <XIcon className="h-6 w-6" />;
        iconColorClass = 'text-green-500';
        break;
      case 'error':
        typeIcon = <XIcon className="h-6 w-6" />;
        iconColorClass = 'text-red-500';
        break;
      case 'warn':
        typeIcon = <AlertTriangleIcon className="h-6 w-6" />;
        iconColorClass = 'text-yellow-500';
        break;
      case 'info':
      case 'confirm':
      default:
        typeIcon = <InfoIcon className="h-6 w-6" />;
        iconColorClass = 'text-blue-500';
        break;
    }
  }

  return (
    <Modal isOpen={true} onClose={closeModal} title={title || ''}>
      <div className="flex items-start space-x-3">
        {typeIcon && <div className={`flex-shrink-0 ${iconColorClass}`}>{typeIcon}</div>}
        <div className="flex-grow text-sm text-gray-700 dark:text-gray-300">
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        {type === 'confirm' && (
          <button
            onClick={handleCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600"
          >
            {cancelText}
          </button>
        )}
        <button
          onClick={handleOk}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${
            type === 'error'
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : type === 'warn'
                ? 'bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-yellow-400'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
          }`}
        >
          {okText}
        </button>
      </div>
    </Modal>
  );
};

// 将 createShortModal 和静态方法的定义移到 Modal 组件定义之后

// 新增：创建和管理简版模态框的函数
const createShortModal = (props: ShortModalProps) => {
  const modalRootId = `short-modal-root-${Date.now()}`;
  let modalRootElement = document.getElementById(modalRootId);

  if (!modalRootElement) {
    modalRootElement = document.createElement('div');
    modalRootElement.id = modalRootId;
    document.body.appendChild(modalRootElement);
  }

  const root = ReactDOM.createRoot(modalRootElement);

  const closeModal = () => {
    root.unmount();
    if (modalRootElement && modalRootElement.parentNode) {
      modalRootElement.parentNode.removeChild(modalRootElement);
    }
  };

  root.render(<ShortModalComponent {...props} closeModal={closeModal} />);

  // 返回一个关闭函数，允许程序化关闭
  return closeModal;
};

interface IShortModalMethods {
  confirm: (props: Omit<ShortModalProps, 'type'>) => () => void;
  info: (props: Omit<ShortModalProps, 'type' | 'onCancel' | 'cancelText'>) => () => void;
  success: (props: Omit<ShortModalProps, 'type' | 'onCancel' | 'cancelText'>) => () => void;
  error: (props: Omit<ShortModalProps, 'type' | 'onCancel' | 'cancelText'>) => () => void;
  warn: (props: Omit<ShortModalProps, 'type' | 'onCancel' | 'cancelText'>) => () => void;
}

export const Modal: React.FC<ModalProps> & IShortModalMethods = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  onESC,
}) => {
  const [displayModal, setDisplayModal] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalIdRef = useRef<string>(`modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // 确保组件已挂载（避免SSR问题）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 弹窗显示/隐藏逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setDisplayModal(true);
      setIsAnimatingOut(false); // Reset when opening
    } else if (!isOpen && displayModal) {
      // isOpen is false, but we were displaying it, so start close animation
      setIsAnimatingOut(true);
      // Wait for the longest of the two close animations to finish
      // Modal content close is 0.3s, backdrop close is 0.3s. So 300ms.
      timer = setTimeout(() => {
        setIsAnimatingOut(false);
        setDisplayModal(false);
      }, 300); // Duration of the modalHide/backdropFadeOut animation
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, displayModal]);

  // 弹窗管理器注册/注销
  useEffect(() => {
    const modalId = modalIdRef.current;
    if (isOpen && displayModal) {
      // 注册弹窗到管理器
      modalManager.register({
        id: modalId,
        onClose,
        onESC,
        zIndex: 0, // 将由管理器分配
      });
    } else {
      // 注销弹窗
      modalManager.unregister(modalId);
    }

    // 组件卸载时确保注销
    return () => {
      modalManager.unregister(modalId);
    };
  }, [isOpen, displayModal, onClose, onESC]);

  if (!mounted || (!displayModal && !isAnimatingOut)) {
    return null; // Not displayed and not in the process of animating out
  }

  // Determine classes based on state
  const backdropClasses = [
    'fixed inset-0 bg-black/20 bg-opacity-60 backdrop-blur-sm flex justify-center items-center p-4 z-[9999]',
    isOpen && !isAnimatingOut ? 'animate-backdrop-open' : '',
    isAnimatingOut ? 'animate-backdrop-close' : '',
  ]
    .join(' ')
    .trim();

  const modalContentClasses = [
    `bg-green-50 dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-h-[90vh] overflow-y-auto border-4 border-green-400 dark:border-green-800 max-w-2xl ${className}`,
    isOpen && !isAnimatingOut ? 'animate-modal-open' : '',
    isAnimatingOut ? 'animate-modal-close' : '',
  ]
    .join(' ')
    .trim();

  const modalContent =
    // Render the modal structure if displayModal is true OR it's currently animating out
    (displayModal || isAnimatingOut) && (
      <div className={backdropClasses}>
        <div className={`${modalContentClasses} relative`} data-role="modal-main">
          <div className="flex items-center justify-between">
            {title && <h3 className="mb-4 text-2xl text-green-700 dark:text-green-100">{title}</h3>}
            <button
              onClick={onClose} // This will set isOpen to false, triggering the useEffect
              className="absolute top-2 right-2 flex items-center justify-center p-1 text-green-800 hover:text-green-800 dark:text-green-700 dark:hover:text-green-500"
              aria-label="关闭弹窗"
            >
              {/* <XIcon /> */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M6.22 7.28a.75.75 0 0 1 1.06-1.06L12 10.938l4.719-4.718a.75.75 0 1 1 1.06 1.06L13.06 12l4.718 4.719a.75.75 0 1 1-1.06 1.06l-4.719-4.718l-4.719 4.718a.75.75 0 1 1-1.06-1.06L10.938 12z"
                />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    );

  // 使用 Portal 渲染到 document.body
  return modalContent ? createPortal(modalContent, document.body) : null;
};

// 将 createShortModal 和静态方法的定义移到 Modal 组件定义之后

// 添加静态方法
Modal.confirm = (props) => createShortModal({ ...props, type: 'confirm' });
Modal.info = (props) => createShortModal({ ...props, type: 'info' });
Modal.success = (props) => createShortModal({ ...props, type: 'success' });
Modal.error = (props) => createShortModal({ ...props, type: 'error' });
Modal.warn = (props) => createShortModal({ ...props, type: 'warn' });
