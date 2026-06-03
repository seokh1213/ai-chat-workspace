"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";

export function SwitchControl({
  ariaLabel,
  checked
}: {
  ariaLabel: string;
  checked: boolean;
}) {
  return (
    <SwitchPrimitive.Root aria-label={ariaLabel} className="switch-root" defaultChecked={checked}>
      <SwitchPrimitive.Thumb className="switch-thumb" />
    </SwitchPrimitive.Root>
  );
}
