
// Refactored for static export
/**
 * @fileOverview A flow to generate audio narration from restaurant reviews.
 *
 * - generateAudioReview - A function that generates an audio file from reviews.
 * - GenerateAudioReviewInput - The input type for the generateAudioReview function.
 * - GenerateAudioReviewOutput - The return type for the generateAudioReview function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateAudioReviewInputSchema = z.object({
    reviews: z.array(
        z.object({
            nomUtilisateur: z.string(),
            note: z.number(),
            commentaire: z.string(),
        })
    ).describe("An array of review objects to be converted to audio.")
});

export type GenerateAudioReviewInput = z.infer<typeof GenerateAudioReviewInputSchema>;

const GenerateAudioReviewOutputSchema = z.object({
    audioDataUri: z.string().describe("The data URI of the generated WAV audio file."),
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
        // Create a script for multi-speaker TTS
        const script = reviews.map((review, index) => {
            const speaker = `Speaker${(index % 2) + 1}`; // Alternate between Speaker1 and Speaker2
            return `${speaker}: "${review.commentaire}"`;
        }).join('\n');

        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Speaker1',
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } }, // Male voice
                            },
                            {
                                speaker: 'Speaker2',
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } }, // Female voice
                            },
                        ],
                    },
                },
            },
            prompt: script,
        });

        if (!media) {
            throw new Error('Audio generation failed.');
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
