import type { VoiceAccent, VoiceGender } from '../hooks/useTextToSpeech';

const INTERVIEWER_NAMES: Record<VoiceAccent, Record<VoiceGender, string>> = {
  us: { female: 'Sarah', male: 'Alex' },
  indian: { female: 'Priya', male: 'Arjun' },
};

export const interviewerName = (gender: VoiceGender, accent: VoiceAccent) => INTERVIEWER_NAMES[accent][gender];

// Avoid saying the same line twice in a row, which is what makes scripted voices feel robotic
const lastPicked = new Map<string, number>();
const pick = (group: string, options: string[]): string => {
  let index = Math.floor(Math.random() * options.length);
  if (options.length > 1 && index === lastPicked.get(group)) index = (index + 1) % options.length;
  lastPicked.set(group, index);
  return options[index];
};

export const buildGreeting = (interviewer: string, candidate: string, role: string) => {
  const first = candidate.split(/\s+/)[0] || 'there';
  const position = role ? `the ${role} position` : 'this role';
  return `Hi ${first}, I'm ${interviewer}. Thanks for joining me today, I'm looking forward to talking about ${position}. How are you doing?`;
};

export const buildWarmupReply = (reply: string, totalQuestions: number) => {
  const text = reply.toLowerCase();
  const react = /nervous|anxious|stress|scared|worried/.test(text)
    ? "That's completely normal, so don't worry. Just treat this like a conversation."
    : /good|great|well|fine|excited|ready|happy|okay|ok/.test(text)
    ? pick('warm-good', ['Great to hear.', "Good, that's what I like to hear.", 'Glad to hear it.'])
    : pick('warm-neutral', ['Thanks for sharing that.', 'Alright, thanks.']);
  return `${react} Here's how this will work: I'll ask you ${totalQuestions} questions. Take your time, think out loud, and give examples where you can. Let's get started.`;
};

export const buildAcknowledgement = (score: number, isLast: boolean) => {
  const reaction =
    score >= 80
      ? pick('ack-high', ["That's a great answer, thank you.", 'Nice, that was clear and well structured.', 'Good, I like how you explained that.'])
      : score >= 60
      ? pick('ack-mid', ['Okay, that makes sense.', 'Alright, thanks for walking me through that.', 'Got it, thank you.'])
      : pick('ack-low', ['Okay, thank you.', 'Alright, noted.', 'Thanks, let me note that down.']);
  const next = isLast
    ? 'Alright, this is the last question.'
    : pick('ack-next', ["Let's move on to the next one.", 'Next question.', "Alright, here's another one.", 'Moving on.']);
  return `${reaction} ${next}`;
};

export const buildFollowUp = () =>
  pick('follow-up', [
    'Could you go into a bit more detail on that?',
    'Can you walk me through a concrete example of that?',
    'Interesting. Tell me a bit more, what was your thinking behind that?',
    "Sure, and can you expand on that a little? I'd like to understand how you'd actually approach it.",
  ]);

export const buildClosingPrompt = () =>
  'That was the last question. Thank you, that was a really good conversation. Before we wrap up, do you have any questions for me?';

export const buildClosingReply = (reply: string) => {
  const hadQuestion = reply.trim().split(/\s+/).filter(Boolean).length > 3;
  const lead = hadQuestion
    ? "That's a good question. The team will share more details after the review."
    : 'No problem at all.';
  return `${lead} I'm putting your feedback report together now. It was great meeting you, and best of luck!`;
};
