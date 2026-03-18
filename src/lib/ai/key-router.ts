import { AiMode } from '../../generated/prisma';
import { prisma } from '../prisma';
import { decrypt } from '../reviews/google';

/** The resolved API key to use for a given user */
export interface ResolvedAIKey {
    apiKey: string;
    mode: AiMode;
}

/**
 * 3-layer AI key router.
 *
 * SHARED   → shared OpenAI key from env (free/starter plan)
 * BYOK     → user's own decrypted API key (Bring Your Own Key)
 * MANAGED  → dedicated key assigned to the user (agency/enterprise)
 */
export async function getAIKey(userId: string): Promise<ResolvedAIKey> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiMode: true, ownApiKey: true, dedicatedKey: true },
    });

    if (!user) throw new Error(`User ${userId} not found`);

    switch (user.aiMode) {
        case AiMode.SHARED: {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('OPENAI_API_KEY env var is not set');
            return { apiKey, mode: AiMode.SHARED };
        }

        case AiMode.BYOK: {
            if (!user.ownApiKey) {
                throw new Error(`User ${userId} is on BYOK plan but has no API key stored`);
            }
            return { apiKey: decrypt(user.ownApiKey), mode: AiMode.BYOK };
        }

        case AiMode.MANAGED: {
            if (!user.dedicatedKey) {
                throw new Error(`User ${userId} is on MANAGED plan but has no dedicated key assigned`);
            }
            return { apiKey: decrypt(user.dedicatedKey), mode: AiMode.MANAGED };
        }

        default:
            throw new Error(`Unknown AI mode: ${user.aiMode}`);
    }
}
