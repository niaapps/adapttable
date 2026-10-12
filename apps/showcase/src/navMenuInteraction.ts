/** Mouse discovery and deliberate click/keyboard opening share one menu policy. */
export function createNavMenuInteraction(
  setOpen: (open: boolean) => void,
  containsFocus: () => boolean
) {
  let open = false;
  let held = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const update = (value: boolean) => {
    open = value;
    setOpen(value);
  };
  const close = () => {
    cancel();
    held = false;
    update(false);
  };
  return {
    enter(event: PointerEvent): void {
      if (event.pointerType !== "mouse") return;
      cancel();
      update(true);
    },
    leave(event: PointerEvent): void {
      if (event.pointerType !== "mouse" || containsFocus() || held) return;
      cancel();
      timer = setTimeout(() => {
        if (!held && !containsFocus()) close();
      }, 220);
    },
    toggle(): void {
      cancel();
      if (open && held) close();
      else {
        held = true;
        update(true);
      }
    },
    hold(): void {
      cancel();
      held = true;
      update(true);
    },
    close,
    dispose: cancel,
  };
}
