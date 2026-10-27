import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
} from "lucide-react";
import { Card, Modal } from "@build-me/ui";
import { DeliveryProjectForm } from "./DeliveryProjectForm";

type JourneyStep = "paths" | "delivery" | "confirmed";

function trackJourneyEvent(eventName: string) {
  // Keep analytics independent of personal form data.
  window.dispatchEvent(
    new CustomEvent("build-me:analytics", {
      detail: { eventName },
    }),
  );
}

export function WorkWithMeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<JourneyStep>("paths");
  const [requestReference, setRequestReference] = useState("");

  function openModal() {
    setStep("paths");
    setRequestReference("");
    setIsOpen(true);
    trackJourneyEvent("work_with_me.opened");
  }

  function closeModal() {
    setIsOpen(false);
  }

  function selectDeliveryProject() {
    setStep("delivery");
    trackJourneyEvent("delivery_project.selected");
  }

  function handleSubmitted(reference: string) {
    setRequestReference(reference);
    setStep("confirmed");
    trackJourneyEvent("delivery_project.confirmed");
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={openModal}
        aria-haspopup="dialog"
        sx={{
          px: 3,
          py: 1.4,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 750,
          backgroundColor: "#1746B5",
          "&:hover": { backgroundColor: "#123A98" },
        }}
      >
        Work With Me <ArrowRight size={18} style={{ marginLeft: 8 }} />
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        labelledBy="work-with-me-title"
        describedBy="work-with-me-description"
        closeOnEscape
        closeOnOverlayClick
      >
        <Box sx={{ maxHeight: "85vh", overflowY: "auto", p: { xs: 2, sm: 3 } }}>
          {step === "paths" && (
            <Box>
              <Typography
                id="work-with-me-title"
                component="h2"
                variant="h5"
                sx={{ fontWeight: 800 }}
              >
                Let's work together
              </Typography>

              <Typography
                id="work-with-me-description"
                color="text.secondary"
                sx={{ mt: 1, mb: 3 }}
              >
                Choose the path that best fits what you need.
              </Typography>

              <Card
                className="cursor-pointer transition hover:border-blue-500 hover:shadow-md"
                role="button"
                tabIndex={0}
                onClick={selectDeliveryProject}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectDeliveryProject();
                  }
                }}
              >
                <Card.Body>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: "#E8EEFF",
                        color: "#1746B5",
                        flexShrink: 0,
                      }}
                    >
                      <FolderKanban size={24} />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 800 }}>
                        Deliver My Project
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Share your goals and request end-to-end project
                        delivery.
                      </Typography>
                    </Box>

                    <ArrowRight size={20} />
                  </Box>
                </Card.Body>
              </Card>

              <Button onClick={closeModal} sx={{ mt: 2 }}>
                Cancel
              </Button>
            </Box>
          )}

          {step === "delivery" && (
            <Box>
              <Button
                startIcon={<ArrowLeft size={16} />}
                onClick={() => setStep("paths")}
                sx={{ mb: 2 }}
              >
                All project paths
              </Button>

              <DeliveryProjectForm
                onBack={() => setStep("paths")}
                onSubmitted={handleSubmitted}
              />
            </Box>
          )}

          {step === "confirmed" && (
            <Card>
              <Card.Body>
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <CheckCircle2
                    size={52}
                    color="#059669"
                    style={{ margin: "0 auto 16px" }}
                  />

                  <Typography
                    id="work-with-me-title"
                    component="h2"
                    variant="h5"
                    sx={{ fontWeight: 800 }}
                  >
                    Request received
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Thank you for sharing your project. Your request has been
                    submitted successfully.
                  </Typography>

                  <Typography sx={{ mt: 2, fontWeight: 700 }}>
                    Reference: {requestReference}
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={closeModal}
                    sx={{ mt: 3 }}
                  >
                    Done
                  </Button>
                </Box>
              </Card.Body>
            </Card>
          )}
        </Box>
      </Modal>
    </>
  );
}
