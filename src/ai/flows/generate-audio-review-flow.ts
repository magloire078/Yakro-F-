
'use server';
/**
 * @fileOverview Un flux pour générer une narration audio à partir des avis de restaurant.
 *
 * - generateAudioReview - Une fonction qui génère un fichier audio à partir des avis.
 * - GenerateAudioReviewInput - Le type d'entrée pour la fonction generateAudioReview.
 * - GenerateAudioReviewOutput - Le type de retour pour la fonction generateAudioReview.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import type { Review } from '@/lib/types';

const GenerateAudioReviewInputSchema = z.object({
    reviews: z.array(
        z.object({
            userName: z.string(),
            rating: z.number(),
            comment: z.string(),
        })
    ).describe("Un tableau d'objets d'avis à convertir en audio.")
});

export type GenerateAudioReviewInput = z.infer<typeof GenerateAudioReviewInputSchema>;

const GenerateAudioReviewOutputSchema = z.object({
    audioDataUri: z.string().describe("L'URI de données du fichier audio WAV généré."),
});
export type GenerateAudioReviewOutput = z.infer<typeof GenerateAudioReviewOutputSchema>;


export async function generateAudioReview(input: GenerateAudioReviewInput): Promise<GenerateAudioReviewOutput> {
    return generateAudioReviewFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioReviewFlow = ai.defineFlow(
    {
        name: 'generateAudioReviewFlow',
        inputSchema: GenerateAudioReviewInputSchema,
        outputSchema: GenerateAudioReviewOutputSchema,
    },
    async ({ reviews }) => {
        // Crée un script pour la synthèse vocale multi-locuteurs
        const script = reviews.map((review, index) => {
            const speaker = `Speaker${(index % 2) + 1}`; // Alterne entre Speaker1 et Speaker2
            return `${speaker}: "${review.comment}"`;
        }).join('\n');
        
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Speaker1',
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
                            },
                            {
                                speaker: 'Speaker2',
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } },
                            },
                        ],
                    },
                },
            },
            prompt: script,
        });

        if (!media) {
            throw new Error('La génération audio a échoué.');
        }

        const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
        );

        const wavBase64 = await toWav(audioBuffer);

        return {
            audioDataUri: 'data:audio/wav;base64,' + wavBase64,
        };
    }
);
