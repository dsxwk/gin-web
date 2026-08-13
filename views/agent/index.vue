<template>
  <div class="agent-page">
    <!-- 左侧会话列表 -->
    <div class="agent-sidebar">
      <div class="agent-sidebar-header">
        <el-button type="primary" class="agent-new-btn" @click="onNewSession">
          <el-icon><Plus /></el-icon>
          <span>新增会话</span>
        </el-button>
      </div>
      <div class="agent-session-list">
        <div
            v-for="session in sessions"
            :key="session.id"
            class="agent-session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="onSelectSession(session)"
        >
          <div class="agent-session-title">{{ session.title || '未命名会话' }}</div>
          <div class="agent-session-meta">{{ formatTime(session.createdAt) }}</div>
        </div>
        <div v-if="sessions.length === 0 && !sessionsLoading" class="agent-empty">暂无会话记录</div>
      </div>
    </div>

    <!-- 右侧聊天区 -->
    <div class="agent-main">
      <div class="agent-main-header">
        <span class="agent-main-title">{{ currentTitle }}</span>
      </div>
      <div ref="messagesRef" class="agent-messages">
        <div v-if="messages.length === 0 && !loading" class="agent-welcome">
          <div class="agent-welcome-icon">AI</div>
          <div class="agent-welcome-title">AI 助手</div>
          <div class="agent-welcome-desc">输入问题开始对话</div>
        </div>
        <div
            v-for="msg in messages"
            :key="msg.id || msg.tempId"
            class="agent-message"
            :class="msg.role"
        >
          <div class="agent-message-avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
          <div class="agent-message-content">
            <span v-if="msg.role !== 'user'" v-html="renderMessage(msg.content)"></span>
            <template v-else>{{ msg.content }}</template>
          </div>
        </div>
        <div v-if="loading" class="agent-message assistant">
          <div class="agent-message-avatar">AI</div>
          <div class="agent-message-content agent-thinking">等待AI助手回答, 已等待 {{ waitSeconds }} 秒</div>
        </div>
      </div>
      <div class="agent-input">
        <el-input
            v-model="inputText"
            type="textarea"
            :rows="3"
            placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
            resize="none"
            @keydown.enter.exact.prevent="onSend"
        />
        <el-button
            type="primary"
            class="agent-send-btn"
            :loading="loading"
            :disabled="!inputText.trim()"
            @click="onSend"
        >发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup name="agentIndex">
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {Plus} from '@element-plus/icons-vue';
import {agentApi} from '/@/api/agent';
import {renderMarkdown} from '/@/utils/markdown';

const api = agentApi();

const messagesRef = ref();
const sessions = ref([]);
const sessionsLoading = ref(false);
const messages = ref([]);
const inputText = ref('');
const loading = ref(false);
const waitSeconds = ref(0);
let waitTimer = null;
const currentSessionId = ref(null);

// 当前会话标题
const currentTitle = computed(() => {
  const session = sessions.value.find((s) => s.id === currentSessionId.value);
  return session?.title || '新会话';
});

// 加载会话列表
const loadSessions = async () => {
  sessionsLoading.value = true;
  try {
    const res = await api.sessions();
    sessions.value = res?.data || [];
  } catch (e) {
    sessions.value = [];
  } finally {
    sessionsLoading.value = false;
  }
};

// 新增会话
const onNewSession = () => {
  currentSessionId.value = null;
  messages.value = [];
  inputText.value = '';
};

// 选择会话
const onSelectSession = async (session) => {
  if (currentSessionId.value === session.id) return;
  currentSessionId.value = session.id;
  await loadHistory(session.id);
};

// 加载聊天记录
const loadHistory = async (sessionId) => {
  messages.value = [];
  try {
    const res = await api.history({sessionId});
    messages.value = (res?.data || []).map((msg) => ({...msg, tempId: msg.id}));
    scrollToBottom();
  } catch (e) {
    ElMessage.error('加载聊天记录失败');
  }
};

// 开始等待计时
const startWaitTimer = () => {
  stopWaitTimer();
  waitSeconds.value = 0;
  waitTimer = setInterval(() => {
    waitSeconds.value += 1;
  }, 1000);
};

// 停止等待计时
const stopWaitTimer = () => {
  if (waitTimer) {
    clearInterval(waitTimer);
    waitTimer = null;
  }
};

// 发送消息
const onSend = async () => {
  const question = inputText.value.trim();
  if (!question || loading.value) return;

  inputText.value = '';
  loading.value = true;
  startWaitTimer();

  messages.value.push({
    tempId: `user-${Date.now()}`,
    role: 'user',
    content: question,
  });
  scrollToBottom();

  try {
    const params = {question};
    if (currentSessionId.value) {
      params.sessionId = currentSessionId.value;
    }

    const res = await api.ask(params);
    const data = res?.data || {};

    // 新会话：更新会话id并刷新会话列表
    if (data.sessionId && data.sessionId !== currentSessionId.value) {
      currentSessionId.value = data.sessionId;
      await loadSessions();
    }

    messages.value.push({
      tempId: `assistant-${Date.now()}`,
      role: 'assistant',
      content: data.answer || '',
    });
  } catch (e) {
    ElMessage.error('发送失败，请稍后重试');
  } finally {
    stopWaitTimer();
    loading.value = false;
    scrollToBottom();
  }
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

// 渲染消息内容
const renderMessage = (content) => {
  return renderMarkdown(content);
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  return String(time).replace('T', ' ').slice(0, 16);
};

onMounted(() => {
  loadSessions();
});

onBeforeUnmount(() => {
  stopWaitTimer();
});
</script>

<style scoped lang="scss">
.agent-page {
  display: flex;
  height: calc(100vh - 140px);
  min-height: 560px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* 左侧会话列表 */
.agent-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color);
  background: var(--el-fill-color-lighter, #f5f7fa);
}

.agent-sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.agent-new-btn {
  width: 100%;
}

.agent-session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.agent-session-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}

.agent-session-item:hover {
  background: var(--el-fill-color-light);
}

.agent-session-item.active {
  background: var(--el-color-primary-light-9);
}

.agent-session-title {
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-session-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.agent-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

/* 右侧聊天区 */
.agent-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.agent-main-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color);
}

.agent-main-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.agent-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.agent-welcome {
  margin: auto;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.agent-welcome-icon {
  width: 56px;
  height: 56px;
  line-height: 56px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-weight: 600;
  font-size: 20px;
}

.agent-welcome-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.agent-welcome-desc {
  margin-top: 8px;
  font-size: 14px;
}

.agent-message {
  display: flex;
  gap: 10px;
  max-width: 86%;
}

.agent-message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.agent-message.assistant,
.agent-message.tool,
.agent-message.system {
  align-self: flex-start;
}

.agent-message-avatar {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.agent-message.user .agent-message-avatar {
  background: #67c23a;
}

.agent-message.assistant .agent-message-avatar,
.agent-message.tool .agent-message-avatar,
.agent-message.system .agent-message-avatar {
  background: var(--el-color-primary);
}

.agent-message-content {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.agent-message.user .agent-message-content {
  background: #d9f3d8;
}

.agent-message-content :deep(p) {
  margin: 0 0 8px;
}

.agent-message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.agent-message-content :deep(h1),
.agent-message-content :deep(h2),
.agent-message-content :deep(h3),
.agent-message-content :deep(h4) {
  margin: 12px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

.agent-message-content :deep(ul),
.agent-message-content :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.agent-message-content :deep(li) {
  margin: 4px 0;
}

.agent-message-content :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  font-family: Consolas, Monaco, monospace;
}

.agent-message-content :deep(pre) {
  margin: 10px 0;
  padding: 12px 14px;
  border-radius: 8px;
  overflow-x: auto;
  background: #1e1e1e;
  color: #d4d4d4;
}

.agent-message-content :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.agent-message-content :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.agent-message-content :deep(a:hover) {
  text-decoration: underline;
}

.agent-message-content :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid var(--el-border-color);
  color: var(--el-text-color-secondary);
}

.agent-message-content :deep(table) {
  width: 100%;
  margin: 10px 0;
  border-collapse: collapse;
}

.agent-message-content :deep(th),
.agent-message-content :deep(td) {
  padding: 6px 10px;
  border: 1px solid var(--el-border-color);
  text-align: left;
}

.agent-message-content :deep(th) {
  background: var(--el-fill-color);
  font-weight: 600;
}

.agent-thinking {
  color: var(--el-text-color-secondary);
}

/* 输入区 */
.agent-input {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--el-border-color);
}

.agent-input :deep(.el-textarea) {
  flex: 1;
}

.agent-send-btn {
  height: 40px;
}
</style>