import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";

describe("Mentor Me booking flow integration", () => {
  afterEach(() => {
    cleanup();
  });

  it("returns to path selection when All project paths is clicked", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeModal />);

    await user.click(screen.getByRole("button", { name: "Work With Me" }));

    await user.click(screen.getByRole("button", { name: /Mentor Me:/ }));

    expect(
      await screen.findByRole("heading", { name: "Mentor Me" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All project paths" }));

    expect(
      await screen.findByRole("heading", { name: "Work With Me" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Mentor Me:/ }),
    ).toBeInTheDocument();
  });
});
