/**
 * Devin 风格 Prompt Composer —— 全插槽组件。
 *
 * 每个 UI 元素都是独立组件，可单独替换为功能更丰富的实现
 * （下拉菜单、真实语音、模型详情等）而不影响其他部分：
 *
 *   <ComposerFrame>
 *     <ComposerInfoBar left={<DiffSummary />} right={<ActionButton />} />
 *     <ComposerRoot>
 *       <ComposerInput />
 *       <ComposerToolbar
 *         left={<><AttachButton /><PermissionSelect /><ModelSelect /></>}
 *         right={<><StatusIndicator /><AgentSelect /><MicButton /><SendButton /></>}
 *       />
 *     </ComposerRoot>
 *     <ContextStrip items={[...]} />
 *   </ComposerFrame>
 */

export { ComposerFrame } from "./frame";
export { ComposerInfoBar } from "./info-bar";
export { ComposerRoot } from "./root";
export { ComposerInput } from "./input";
export { ComposerToolbar } from "./toolbar";
export { IconButton, SelectPill } from "./primitives";
export { ActionButton } from "./action-button";
export { DiffSummary } from "./diff-summary";
export { AttachButton } from "./attach-button";
export { PermissionSelect, PERMISSION_MODES } from "./permission-select";
export { ModelSelect, MODELS } from "./model-select";
export { StatusIndicator } from "./status-indicator";
export { AgentSelect, AGENTS } from "./agent-select";
export { MicButton } from "./mic-button";
export { SendButton } from "./send-button";
export { ContextStrip } from "./context-strip";
export type { ContextStripItem } from "./context-strip";
export { DevinMark } from "./icons";
