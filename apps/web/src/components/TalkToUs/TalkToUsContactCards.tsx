import type { ReactNode } from "react";
import { Box, Card, CardActionArea, Stack, Typography } from "@mui/material";
import { MessageCircle, Phone } from "lucide-react";

import { getTalkToUsConfig, WHATSAPP_GREETING } from "./talkToUsConfig";
import { buildTelUrl, buildWhatsAppUrl } from "./talkToUsLinks";

interface TalkToUsContactCardsProps {
  onWhatsApp: () => void;
  onCall: () => void;
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

/** WhatsApp and Call. Each card only shows when its number is configured. */
export function TalkToUsContactCards({
  onWhatsApp,
  onCall,
}: TalkToUsContactCardsProps) {
  const { whatsappNumber, phoneNumber } = getTalkToUsConfig();
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, WHATSAPP_GREETING);
  const telUrl = buildTelUrl(phoneNumber);

  if (!whatsappUrl && !telUrl) return null;

  return (
    <Stack spacing={1.5}>
      {whatsappUrl && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
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
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
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
    </Stack>
  );
}
