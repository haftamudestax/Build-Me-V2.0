import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { CircleCheck } from "lucide-react";

import { useVisibilityAnalytics } from "../../hooks/useTracking/useVisibilityAnalytics";
import { TalkToUsContactCards } from "./TalkToUsContactCards";
import { TalkToUsMessageForm } from "./TalkToUsMessageForm";
import { trackTalkToUs } from "./talkToUsAnalytics";
import type { TalkToUsReceipt } from "./talkToUsSubmit";
import { emptyTalkToUs, type TalkToUsValues } from "./talkToUsValidation";

interface SentState extends TalkToUsReceipt {
  email: string;
}

export function TalkToUsSection() {
  const [sectionElement, setSectionElement] = useState<HTMLElement | null>(
    null,
  );
  const [draft, setDraft] = useState<TalkToUsValues>(emptyTalkToUs);
  const [sent, setSent] = useState<SentState | null>(null);

  useVisibilityAnalytics(sectionElement, {
    eventName: "talk_to_us.viewed",
    enabled: true,
  });

  function handleSent(receipt: TalkToUsReceipt): void {
    setSent({ ...receipt, email: draft.email.trim() });
    setDraft(emptyTalkToUs);
  }

  return (
    <Box
      ref={setSectionElement}
      component="section"
      id="talk-to-us"
      aria-labelledby="talk-to-us-title"
      sx={{
        width: "100%",
        py: { xs: 6, md: 8 },
        backgroundColor: "background.default",
        scrollMarginTop: 80,
        backgroundImage: `linear-gradient(
              90deg,
              var(--color-white) 0%,
              color-mix(in srgb, var(--color-light-yellow) 40%, var(--color-white)) 100%
            )`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
            },
            columnGap: { md: 8 },
            rowGap: 4,
            alignItems: "start",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id="talk-to-us-title"
              component="h2"
              sx={{
                fontSize: { xs: "2rem", md: "2.5rem" },
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#111318",
                mb: 2,
              }}
            >
              Talk to{" "}
              <Box component="span" sx={{ color: "var(--color-dark-yellow)" }}>
                Me
              </Box>
            </Typography>

            <Typography
              component="p"
              sx={{
                color: "#30343B",
                fontSize: { xs: "1rem", md: "1.0625rem" },
                lineHeight: 1.65,
                mb: 3,
                maxWidth: "42ch",
              }}
            >
              Choose whatever is easiest for you. Every message reaches the
              Technology Owner directly.
            </Typography>

            <TalkToUsContactCards
              onWhatsApp={() => trackTalkToUs("talk_to_us.whatsapp_clicked")}
              onCall={() => trackTalkToUs("talk_to_us.call_clicked")}
            />
          </Box>

          <Card
            elevation={0}
            sx={{
              minWidth: 0,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 4,
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              {sent ? (
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <Box
                    aria-hidden="true"
                    sx={{ color: "var(--color-dark-yellow)", mb: 1 }}
                  >
                    <CircleCheck size={48} />
                  </Box>

                  <Typography variant="h6" component="h3" gutterBottom>
                    Message sent
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {sent.email
                      ? `We will reply to ${sent.email}.`
                      : "We will reply as soon as we can."}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your reference: <strong>{sent.reference}</strong>
                  </Typography>

                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setSent(null)}
                    sx={{ mt: 3 }}
                  >
                    Send another message
                  </Button>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" component="h3" sx={{ mb: 2.5 }}>
                    Send a message
                  </Typography>

                  <TalkToUsMessageForm
                    values={draft}
                    onChange={setDraft}
                    onSent={handleSent}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
