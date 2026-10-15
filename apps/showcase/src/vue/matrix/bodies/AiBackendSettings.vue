<script setup lang="ts">
import type { AgentSession } from "@adapttable/ai";
import { computed, onScopeDispose, shallowRef, watch } from "vue";

import {
  connectShowcaseBackend,
  SHOWCASE_AI_ENDPOINT,
  type ShowcaseBackendConnection,
} from "../../../aiBackendConnection";
import { useShowcaseKit } from "../showcaseKit";

const props = defineProps<{
  session: AgentSession | undefined;
  connection: ShowcaseBackendConnection | undefined;
  disabled: boolean;
}>();
const emit = defineEmits<{
  connected: [connection: ShowcaseBackendConnection];
  disconnect: [];
}>();
const kit = useShowcaseKit();
const endpoint = shallowRef(props.connection?.endpoint ?? SHOWCASE_AI_ENDPOINT);
const token = shallowRef("");
const busy = shallowRef(false);
const error = shallowRef("");
let request: AbortController | undefined;
const cancel = () => {
  request?.abort();
  request = undefined;
  busy.value = false;
};
watch(() => props.session, cancel);
onScopeDispose(cancel);

async function connect(): Promise<void> {
  const session = props.session;
  if (!session || props.disabled || busy.value) return;
  cancel();
  const current = new AbortController();
  request = current;
  busy.value = true;
  error.value = "";
  try {
    const connection = await connectShowcaseBackend(
      session,
      endpoint.value,
      token.value,
      current.signal
    );
    if (request !== current || props.session !== session) return;
    token.value = "";
    emit("connected", connection);
  } catch (cause) {
    if (request === current && !current.signal.aborted)
      error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    if (request === current) {
      request = undefined;
      busy.value = false;
    }
  }
}
const Endpoint = () =>
  kit.input({
    label: "Your endpoint",
    part: "demo-ai-endpoint",
    value: endpoint.value,
    disabled: busy.value || props.disabled,
    onChange: (value) => {
      endpoint.value = value;
    },
  });
const Token = () =>
  kit.input({
    label: "Endpoint token (optional)",
    part: "demo-ai-token",
    type: "password",
    value: token.value,
    disabled: busy.value || props.disabled,
    onChange: (value) => {
      token.value = value;
    },
  });
const connectLabel = computed(() => {
  if (busy.value) return "Connecting…";
  return error.value ? "Retry connection" : "Connect backend";
});
const connectControl = computed(() =>
  kit.button({
    label: connectLabel.value,
    part: "demo-ai-connect",
    disabled:
      busy.value || props.disabled || !props.session || !endpoint.value.trim(),
    onClick: () => {
      void connect();
    },
  })
);
const Connect = () => connectControl.value;
const Disconnect = () =>
  kit.button({
    label: busy.value ? "Cancel connection" : "Use scripted demo",
    part: "demo-ai-disconnect",
    disabled: props.disabled,
    onClick: () => {
      cancel();
      token.value = "";
      error.value = "";
      emit("disconnect");
    },
  });
</script>

<template>
  <section class="vue-ai-backend" aria-label="Backend connection">
    <p>
      Connect your HTTP backend for free-form requests. Model credentials stay
      on your backend; the optional token belongs to your endpoint.
    </p>
    <div class="vue-ai-backend-fields">
      <label><span>Your endpoint</span><Endpoint /></label>
      <label><span>Endpoint token (optional)</span><Token /></label>
    </div>
    <div class="vue-ai-backend-actions">
      <Connect />
      <Disconnect v-if="connection || busy" />
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <p role="status" data-demo-ai-connection>
      {{
        busy
          ? "Connecting…"
          : connection
            ? `Backend: ${connection.endpoint}`
            : "Scripted demo — no model connected"
      }}
    </p>
  </section>
</template>

<style scoped>
.vue-ai-backend {
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-block: 1rem;
}
.vue-ai-backend-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0.75rem;
}
.vue-ai-backend-fields label {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}
.vue-ai-backend-fields :deep(input) {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
.vue-ai-backend-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block-start: 0.75rem;
}
</style>
