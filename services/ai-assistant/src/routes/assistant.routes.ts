import { Router, type Request, type Response, type NextFunction } from 'express';
import { ConversationManager } from '../conversation/conversationManager';
import { buildContext } from '../conversation/contextBuilder';
import { getOwnershipContext } from '../ownership/ownershipSupportService';
import { callLlm } from '../providers/llmClient';
import { defaultPersona } from '../identity/assistantPersona';
import { rateLimiter } from '../middleware/rateLimiter';
import { inputSanitizer } from '../middleware/inputSanitizer';

const router: Router = Router();
const conversations = new ConversationManager();

router.post(
  '/message',
  rateLimiter,
  inputSanitizer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId ?? 'anonymous'; // TODO
      const { message, conversationId } = req.body as { message: string; conversationId?: string };

      const conversation = conversations.getOrCreate(userId, conversationId);
      conversations.appendMessage(conversation.id, { role: 'user', content: message });

      const ownership = await getOwnershipContext(userId);
      const context = buildContext(conversation, ownership);

      const llmResponse = await callLlm({
        systemPrompt: defaultPersona.systemPrompt,
        userMessage: message,
        context,
      });

      conversations.appendMessage(conversation.id, { role: 'assistant', content: llmResponse.content });

      res.status(200).json({
        conversationId: conversation.id,
        reply: llmResponse.content,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/session/:conversationId', (req: Request, res: Response) => {
  // TODO
  res.status(501).json({ error: 'Not implemented yet' });
});

export default router;
