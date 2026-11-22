import type { ReactNode } from "react";
import { Box, Card, CardActionArea, Stack, Typography } from "@mui/material";
import { MessageCircle, Phone, Send } from "lucide-react";

import { getTalkToUsConfig, WHATSAPP_GREETING } from "./talkToUsConfig";
import { buildTelUrl, buildWhatsAppUrl } from "./talkToUsLinks";

interface TalkToUsOptionsProps {
  onWhatsApp: () => void;
  onCall: () => void;
  onMessage: () => void;
}

interface OptionContentProps {
  icon: ReactNode;
  title: string;
  description: string;
}

const actionAreaSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 2,
  p: 2,
  textAlign: "left",
} as const;

function OptionContent({ icon, title, description }: OptionContentProps) {
  return (
    <>
      <Box
        aria-hidden="true"
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2.5,
          bgcolor:
            "color-mix(in srgb, var(--color-dark-yellow) 12%, transparent)",
          color: "var(--color-dark-yellow)",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography component="span" sx={{ display: "block", fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          {description}
        </Typography>
      </Box>
    </>
  );
}

export function TalkToUsOptions({
  onWhatsApp,
  onCall,
  onMessage,
}: TalkToUsOptionsProps) {
  const { whatsappNumber, phoneNumber } = getTalkToUsConfig();
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, WHATSAPP_GREETING);
  const telUrl = buildTelUrl(phoneNumber);

  return (
    <Stack spacing={1.5}>
      {whatsappUrl && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardActionArea
            component="a"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onWhatsApp}
            sx={actionAreaSx}
          >
            <OptionContent
              icon={<MessageCircle size={22} />}
              title="WhatsApp"
              description="Chat with us. Opens WhatsApp in a new tab."
            />
          </CardActionArea>
        </Card>
      )}

      {telUrl && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardActionArea
            component="a"
            href={telUrl}
            onClick={onCall}
            sx={actionAreaSx}
          >
            <OptionContent
              icon={<Phone size={22} />}
              title="Call"
              description={`Speak to us directly on ${phoneNumber}`}
            />
          </CardActionArea>
        </Card>
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardActionArea onClick={onMessage} sx={actionAreaSx}>
          <OptionContent
            icon={<Send size={22} />}
            title="Send a message"
            description="Write to us here and we will reply by email."
          />
        </CardActionArea>
      </Card>
    </Stack>
  );
}
