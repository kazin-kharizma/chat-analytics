import { Index } from "@pipeline/Types";
import { DomainsStats } from "@pipeline/aggregate/blocks/domains/DomainsStats";
import { EmojiStats } from "@pipeline/aggregate/blocks/emojis/EmojiStats";
import { ConversationStats } from "@pipeline/aggregate/blocks/interaction/ConversationStats";
import { InteractionStats } from "@pipeline/aggregate/blocks/interaction/InteractionStats";
import { LanguageStats } from "@pipeline/aggregate/blocks/language/LanguageStats";
import { useBlockData } from "@report/BlockHook";
import { getDatabase, getFormatCache } from "@report/WorkerWrapper";
import WordCloud from "@report/components/cards/language/WordCloud";
import { AuthorLabel } from "@report/components/core/labels/AuthorLabel";
import { ChannelLabel } from "@report/components/core/labels/ChannelLabel";
import { DomainLabel } from "@report/components/core/labels/DomainLabel";
import { EmojiLabel } from "@report/components/core/labels/EmojiLabel";
import { MentionLabel } from "@report/components/core/labels/MentionLabel";
import { WordLabel } from "@report/components/core/labels/WordLabel";
import MostUsed from "@report/components/viz/MostUsed";

///////////////////////////
/// AUTHORS
///////////////////////////
export const MostMessagesAuthors = () => (
    <MostUsed
        what="Author"
        unit="Total messages"
        counts={useBlockData("messages/stats")?.counts.authors}
        itemComponent={AuthorLabel}
        maxItems={Math.min(15, getDatabase().authors.length)}
        colorHue={240}
    />
);
export const MostRepliesAuthors = ({ data }: { data?: InteractionStats }) => (
    <MostUsed
        what="Author"
        unit="Number of messages replied"
        counts={data?.authorsReplyCount}
        itemComponent={AuthorLabel}
        maxItems={Math.min(15, getDatabase().authors.length)}
        colorHue={240}
    />
);

///////////////////////////
/// CHANNELS
///////////////////////////
export const MostMessagesChannels = () => (
    <MostUsed
        what="Channel"
        unit="Total messages"
        counts={useBlockData("messages/stats")?.counts.channels}
        itemComponent={ChannelLabel}
        maxItems={Math.min(15, getDatabase().channels.length)}
        colorHue={266}
    />
);

///////////////////////////
/// CONVERSATIONS
///////////////////////////
export const MostConversations = ({ data, options }: { data?: ConversationStats; options: number[] }) => (
    <MostUsed
        what={options[0] === 0 ? "Author" : "Channel"}
        unit="Number of conversations started"
        counts={options[0] === 0 ? data.authorConversations : data.channelConversations}
        itemComponent={options[0] === 0 ? AuthorLabel : ChannelLabel}
        maxItems={Math.min(15, Math.max(getDatabase().authors.length, getDatabase().channels.length))}
        colorHue={options[0] === 0 ? 240 : 266}
    />
);

///////////////////////////
/// WORDS
///////////////////////////
const WordsIndexOf = (value: string) => getFormatCache().words.indexOf(value);
const WordsInFilter = (index: number, filter: string | RegExp) => {
    const word = getFormatCache().words[index];
    return filter instanceof RegExp ? filter.test(word) : word.startsWith(filter);
};
export const MostUsedWords = ({ data, options }: { data?: LanguageStats; options: number[] }) =>
    options[0] === 1 ? (
        <WordCloud wordsCount={data?.wordsCount} />
    ) : (
        <MostUsed
            what="Word"
            unit="Times used"
            counts={data?.wordsCount}
            maxItems={Math.min(15, getDatabase().words.length)}
            itemComponent={WordLabel}
            searchable
            allowRegex
            searchPlaceholder="Filter words..."
            indexOf={WordsIndexOf}
            inFilter={WordsInFilter}
        />
    );

///////////////////////////
/// EMOJIS
///////////////////////////
const EmojiFilterFns = {
    "0": undefined, // all emoji
    "1": (index: number) => getDatabase().emojis[index].type === "unicode", // regular emoji
    "2": (index: number) => getDatabase().emojis[index].type === "custom", // custom emoji
};
const EmojiFilterPlaceholders = {
    "0": 'Filter emojis... (e.g. "fire", "🔥" or ":pepe:")',
    "1": 'Filter emojis... (e.g. "fire" or "🔥")',
    "2": 'Filter emojis... (e.g. ":pepe:")',
};
const EmojisTransformFilter = (filter: string) => filter.replace(/:/g, "");
const EmojisIndexOf = (value: string) => {
    const rawEmoji = getDatabase().emojis.findIndex((e) => e.name === value);
    if (rawEmoji === -1) return getFormatCache().emojis.indexOf(value);
    return rawEmoji;
};
const EmojisInFilter = (index: Index, filter: string) => getFormatCache().emojis[index].includes(filter);
export const MostUsedEmojis = ({ data, options }: { data?: EmojiStats; options: number[] }) => (
    <MostUsed
        what="Emoji"
        unit={options[1] === 0 || options[1] === undefined ? "Times used" : "Times reacted"}
        counts={options[1] === 0 || options[1] === undefined ? data.inText.count : data.inReactions.count}
        filter={EmojiFilterFns[options[0] as unknown as keyof typeof EmojiFilterFns]}
        maxItems={Math.min(15, getDatabase().emojis.length)}
        itemComponent={EmojiLabel}
        searchable
        searchPlaceholder={EmojiFilterPlaceholders[options[0] as unknown as keyof typeof EmojiFilterPlaceholders]}
        transformFilter={EmojisTransformFilter}
        indexOf={EmojisIndexOf}
        inFilter={EmojisInFilter}
    />
);
export const MostProducerEmojis = ({ data, options }: { data?: EmojiStats; options: number[] }) => (
    <MostUsed
        what={options[0] === 0 ? "Author" : "Channel"}
        unit="Number of emojis used"
        counts={options[0] === 0 ? data.inText.authorCount : data.inText.channelCount}
        maxItems={Math.min(15, Math.max(getDatabase().authors.length, getDatabase().channels.length))}
        itemComponent={options[0] === 0 ? AuthorLabel : ChannelLabel}
        colorHue={options[0] === 0 ? 240 : 266}
    />
);
// at this point in the project, I just can't come up with new names
export const MostGetterEmojis = ({ data, options }: { data?: EmojiStats; options: number[] }) => (
    <MostUsed
        what={options[0] === 0 ? "Author" : "Channel"}
        unit="Number of reactions received"
        counts={options[0] === 0 ? data.inReactions.authorCount : data.inReactions.channelCount}
        maxItems={Math.min(15, Math.max(getDatabase().authors.length, getDatabase().channels.length))}
        itemComponent={options[0] === 0 ? AuthorLabel : ChannelLabel}
        colorHue={options[0] === 0 ? 240 : 266}
    />
);

///////////////////////////
/// DOMAINS
///////////////////////////
const DomainsIndexOf = (value: string) => getDatabase().domains.indexOf(value);
const DomainsInFilter = (index: number, filter: string) => getDatabase().domains[index].includes(filter);
export const MostLinkedDomains = () => (
    <MostUsed
        what="Domain"
        unit="Times linked"
        counts={useBlockData("domains/stats")?.count}
        maxItems={Math.min(15, getDatabase().domains.length)}
        itemComponent={DomainLabel}
        searchable
        searchPlaceholder="Filter domains..."
        indexOf={DomainsIndexOf}
        inFilter={DomainsInFilter}
    />
);

///////////////////////////
/// MENTIONS
///////////////////////////
const MentionsIndexOf = (value: string) => getFormatCache().mentions.indexOf(value);
const MentionsInFilter = (index: number, filter: string) => getFormatCache().mentions[index].includes(filter);
export const MostMentioned = ({ data }: { data?: InteractionStats }) => (
    <MostUsed
        what="Who"
        unit="Times mentioned"
        counts={data?.mentionsCount}
        itemComponent={MentionLabel}
        maxItems={Math.min(15, getDatabase().mentions.length)}
        searchable
        searchPlaceholder="Filter @mentions..."
        indexOf={MentionsIndexOf}
        inFilter={MentionsInFilter}
    />
);
