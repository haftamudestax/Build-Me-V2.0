import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal } from "../src/components/Modal";
import type { ModalState } from "../src/components/Modal";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Reusable wrapper: gives every story a real open/close trigger
function ModalDemo({ initialState = "idle" as ModalState }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ModalState>(initialState);

  return (
    <>
      <button
        onClick={() => {
          setState(initialState);
          setIsOpen(true);
        }}
      >
        Open Modal
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
        onConfirm={() => setState("loading")}
        state={state}
        labelledBy="story-modal-title"
        describedBy="story-modal-desc"
      >
        <Modal.Header id="story-modal-title">Confirm action</Modal.Header>
        <Modal.Body id="story-modal-desc">
          Are you sure you want to proceed? This is a demo modal for Storybook.
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setIsOpen(false)}>Cancel</button>
          <button onClick={() => setState("loading")}>Confirm</button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => <ModalDemo initialState="idle" />,
};

export const Loading: Story = {
  render: () => <ModalDemo initialState="loading" />,
};

export const ErrorState: Story = {
  render: () => <ModalDemo initialState="error" />,
};

export const Success: Story = {
  render: () => <ModalDemo initialState="success" />,
};

export const AccessibilityCheck: Story = {
  render: () => <ModalDemo initialState="idle" />,
  parameters: {
    docs: {
      description: {
        story:
          "Use this story to manually verify: Tab cycles within the modal, Escape closes it, and focus returns to the 'Open Modal' button on close.",
      },
    },
  },
};
