import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "../src/components/Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["default", "loading", "empty", "error", "disabled"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// --- Default ---
export const Default: Story = {
  args: {
    state: "default",
    size: "md",
  },
  render: (args) => (
    <Card {...args}>
      <Card.Header>Order #1234</Card.Header>
      <Card.Body>This order was shipped on Sept 12, 2026.</Card.Body>
      <Card.Footer>Tracking: 1Z999AA1</Card.Footer>
    </Card>
  ),
};

// --- Loading ---
export const Loading: Story = {
  args: {
    state: "loading",
    size: "md",
  },
  render: (args) => (
    <Card {...args}>
      <Card.Header>Order #1234</Card.Header>
      <Card.Body>Content hidden behind skeleton</Card.Body>
    </Card>
  ),
};

// --- Empty ---
export const Empty: Story = {
  args: {
    state: "empty",
    emptyMessage: "No orders yet.",
    size: "md",
  },
  render: (args) => (
    <Card {...args}>
      <Card.Header>Orders</Card.Header>
    </Card>
  ),
};

// --- Error ---
export const Error: Story = {
  args: {
    state: "error",
    errorMessage: "Failed to load order details.",
    size: "md",
  },
  render: (args) => (
    <Card {...args} onRetry={() => alert("Retrying...")}>
      <Card.Header>Order #1234</Card.Header>
    </Card>
  ),
};

// --- Disabled ---
export const Disabled: Story = {
  args: {
    state: "disabled",
    size: "md",
  },
  render: (args) => (
    <Card {...args}>
      <Card.Header>Archived Order</Card.Header>
      <Card.Body>This order can no longer be edited.</Card.Body>
    </Card>
  ),
};

// --- Variations: Sizes shown side-by-side ---
export const Variations: Story = {
  render: () => (
    <div className="flex gap-4 items-start flex-wrap">
      <Card size="sm">
        <Card.Header>Small</Card.Header>
        <Card.Body>Compact card for dense layouts.</Card.Body>
      </Card>
      <Card size="md">
        <Card.Header>Medium</Card.Header>
        <Card.Body>Standard card, the default size.</Card.Body>
      </Card>
      <Card size="lg">
        <Card.Header>Large</Card.Header>
        <Card.Body>Wider card for feature content or detailed info.</Card.Body>
      </Card>
    </div>
  ),
};
