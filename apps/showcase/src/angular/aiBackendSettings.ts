/** Connection state and layout; the selected kit owns every control. */
import type { AgentSession } from "@adapttable/ai";
import type { TableAssistantButtonProps } from "@adapttable/angular/adapter";
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";

import {
  connectShowcaseBackend,
  SHOWCASE_AI_ENDPOINT,
  type ShowcaseBackendConnection,
} from "../aiBackendConnection";
import type { ConnectionFieldProps } from "./connectionField";
import {
  AdaptShowcaseAction,
  AdaptShowcaseConnectionField,
} from "./kitComponents";

@Component({
  selector: "adapt-ai-backend-settings",
  imports: [AdaptShowcaseAction, AdaptShowcaseConnectionField],
  styleUrl: "./aiBackendSettings.css",
  template: `
    <section class="ai-backend" aria-label="Backend connection">
      <p>
        Connect your HTTP backend for free-form requests. Model credentials stay
        on your backend; the optional token belongs to your endpoint.
      </p>
      <div class="ai-backend-fields">
        <div>
          <span>Your endpoint</span>
          <adapt-showcase-connection-field [props]="endpointField()" />
        </div>
        <div>
          <span>Endpoint token (optional)</span>
          <adapt-showcase-connection-field [props]="tokenField()" />
        </div>
      </div>
      <div class="ai-backend-actions">
        <adapt-showcase-action [props]="connectButton()" />
        @if (connection() || busy()) {
          <adapt-showcase-action [props]="disconnectButton()" />
        }
      </div>
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
      <p role="status" data-demo-ai-connection>
        {{
          busy()
            ? "Connecting…"
            : connection()
              ? "Backend: " + connection()?.endpoint
              : "Scripted demo — no model connected"
        }}
      </p>
    </section>
  `,
})
export class AiBackendSettings {
  readonly session = input<AgentSession>();
  readonly connection = input<ShowcaseBackendConnection>();
  readonly disabled = input(false);
  readonly connected = output<ShowcaseBackendConnection>();
  readonly disconnected = output<void>();
  readonly endpoint = signal(SHOWCASE_AI_ENDPOINT);
  readonly token = signal("");
  readonly busy = signal(false);
  readonly error = signal("");
  private request: AbortController | undefined;

  constructor() {
    effect(() => {
      this.session();
      this.cancel();
    });
    effect(() => {
      const connection = this.connection();
      if (connection) this.endpoint.set(connection.endpoint);
    });
    inject(DestroyRef).onDestroy(() => this.cancel());
  }

  private cancel(): void {
    this.request?.abort();
    this.request = undefined;
    this.busy.set(false);
  }

  private async connect(): Promise<void> {
    const session = this.session();
    if (!session || this.disabled() || this.busy()) return;
    this.cancel();
    const current = new AbortController();
    this.request = current;
    this.busy.set(true);
    this.error.set("");
    try {
      const connection = await connectShowcaseBackend(
        session,
        this.endpoint(),
        this.token(),
        current.signal
      );
      if (this.request !== current || this.session() !== session) return;
      this.token.set("");
      this.connected.emit(connection);
    } catch (cause) {
      if (this.request === current && !current.signal.aborted)
        this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (this.request === current) {
        this.request = undefined;
        this.busy.set(false);
      }
    }
  }

  readonly endpointField = computed((): ConnectionFieldProps => ({
    label: "Your endpoint",
    value: this.endpoint(),
    type: "url",
    disabled: this.busy() || this.disabled(),
    onChange: (value) => this.endpoint.set(value),
  }));
  readonly tokenField = computed((): ConnectionFieldProps => ({
    label: "Endpoint token (optional)",
    value: this.token(),
    type: "password",
    disabled: this.busy() || this.disabled(),
    onChange: (value) => this.token.set(value),
  }));
  readonly connectLabel = computed(() => {
    if (this.busy()) return "Connecting…";
    return this.error() ? "Retry connection" : "Connect backend";
  });
  readonly connectButton = computed((): TableAssistantButtonProps => ({
    label: this.connectLabel(),
    part: "demo-ai-connect",
    variant: "primary",
    disabled:
      this.busy() ||
      this.disabled() ||
      !this.session() ||
      !this.endpoint().trim(),
    onClick: () => {
      void this.connect();
    },
  }));
  readonly disconnectButton = computed((): TableAssistantButtonProps => ({
    label: this.busy() ? "Cancel connection" : "Use scripted demo",
    part: "demo-ai-disconnect",
    variant: "secondary",
    disabled: this.disabled(),
    onClick: () => {
      this.cancel();
      this.token.set("");
      this.error.set("");
      this.disconnected.emit();
    },
  }));
}
