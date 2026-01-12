import { useState, useMemo } from "react";
import { SearchIcon, SmileIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EMOJI_NAMES } from "./emoji-names";

interface EmojiPickerProps {
  children: React.ReactNode;
  onSelect: (emoji: string) => void;
}

// Organized emoji categories
const EMOJI_CATEGORIES = {
  "Smileys & People": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"],
  "Gestures": ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄"],
  "Objects": ["💍", "👑", "👒", "🎩", "🎓", "🧢", "⛑️", "📿", "💄", "💍", "💎", "🔇", "🔈", "🔉", "🔊", "📢", "📣", "📯", "🔔", "🔕", "🎼", "🎵", "🎶", "🎙️", "🎚️", "🎛️", "🎤", "🎧", "📻", "🎷", "🎺", "🎸", "🎻", "🎹", "🥁", "🎲", "🎯", "🎳", "🎮", "🎰", "🧩"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️"],
  "Activities": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🏓", "🏸", "🥅", "🏒", "🏑", "🏏", "🥍", "🏹", "🎣", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🏋️", "🤼", "🤸", "🤺", "⛹️", "🤹", "🧘", "🏌️", "🏇", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🎻", "🎲", "🎯", "🎳", "🎮", "🎰", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", "🚜", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🚁", "🚟", "🚠", "🚡", "🛰️", "🚀", "🛸", "🛎️", "🧳"],
  "Food & Drink": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🥞", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🥫", "🌮", "🌯", "🥙", "🥚", "🍳", "🥘", "🍲", "🥣", "🥗", "🍿", "🧂", "🥫", "🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼", "🥛", "☕", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🥤", "🧃", "🧉", "🧊"],
  "Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦡", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🐈", "🐓", "🦃", "🦅", "🦆", "🦢", "🦉", "🦚", "🦜", "🐇", "🦝", "🦨", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔", "🌲", "🌳", "🌴", "🌵", "🌶️", "🌷", "🌹", "🥀", "🌺", "🌻", "🌼", "🌽", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🍄", "🌰", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🌍", "🌎", "🌏", "🌐", "🗾", "🗺️", "🧭", "🏔️", "⛰️", "🌋", "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱", "🏘️", "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋", "⛲", "⛺", "🌁", "🌃", "🏙️", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️", "🎠", "🎡", "🎢", "💈", "🎪", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚟", "🚠", "🚡", "🛤️", "🛣️", "🗺️", "🗿", "🗽", "🗼", "🏰", "⛩️", "🕍", "🕌", "🛕", "⛪", "💒", "🏛️", "⛲", "⛺", "🌁", "🌃", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️", "🎠", "🛎️", "🚪", "🛏️", "🛋️", "🚽", "🚿", "🛁", "🧴", "🧷", "🧹", "🧺", "🧻", "🧼", "🧽", "🧯", "🛒", "🚬", "⚰️", "⚱️", "🗿", "🏧", "🚮", "🚰", "♿", "🚹", "🚺", "🚻", "🚼", "🚾", "🛂", "🛃", "🛄", "🛅", "⚠️", "🚸", "⛔", "🚫", "🚳", "🚭", "🚯", "🚱", "🚷", "📵", "🔞", "☢️", "☣️"],
  "Common": ["👍", "👎", "❤️", "💯", "🔥", "✨", "⭐", "💡", "🎉", "✅", "❌", "⚠️", "💭", "🚀", "📝", "🎯", "💪", "🙏", "👏", "🎊", "🎈", "🎁", "🎀", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎗️", "🎫", "🎟️", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🎻", "🎲", "🎯", "🎳", "🎮", "🎰"],
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ children, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get categories list
  const categories = Object.keys(EMOJI_CATEGORIES);

  // Flatten all emojis for search
  const allEmojis = useMemo(() => {
    const flat: Array<{ emoji: string; category: string }> = [];
    Object.entries(EMOJI_CATEGORIES).forEach(([category, emojis]) => {
      emojis.forEach((emoji) => {
        flat.push({ emoji, category });
      });
    });
    return flat;
  }, []);

  // Filter emojis based on search
  const filteredEmojis = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    // If search query exists, filter emojis
    if (query) {
      // First, try to match category names (this will show all emojis in matching categories)
      const matchingCategories = categories.filter((cat) => 
        cat.toLowerCase().includes(query)
      );
      
      if (matchingCategories.length > 0) {
        const results: Array<{ emoji: string; category: string }> = [];
        matchingCategories.forEach((cat) => {
          const emojis = EMOJI_CATEGORIES[cat as keyof typeof EMOJI_CATEGORIES] || [];
          emojis.forEach((emoji) => {
            results.push({ emoji, category: cat });
          });
        });
        return results;
      }
      
      // Then, try to match emoji names (for emojis with explicit name mappings)
      const matchingEmojis = allEmojis.filter(({ emoji, category }) => {
        // Check explicit name mappings first
        const names = EMOJI_NAMES[emoji];
        if (names && names.some((name) => name.toLowerCase().includes(query))) {
          return true;
        }
        
        // Fallback: also match by category name for emojis without explicit mappings
        // This ensures ALL emojis are searchable via their category
        return category.toLowerCase().includes(query);
      });
      
      if (matchingEmojis.length > 0) {
        return matchingEmojis;
      }
      
      // If no matches, return empty (user can see no results)
      return [];
    }
    
    // If no search, show by category
    if (selectedCategory) {
      return EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]?.map((emoji) => ({
        emoji,
        category: selectedCategory,
      })) || [];
    }
    
    // Show all if no category selected
    return allEmojis;
  }, [searchQuery, selectedCategory, allEmojis, categories]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setSearchQuery("");
    setSelectedCategory(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[440px] p-0 gap-0",
          "bg-white/95 dark:bg-gray-950/95",
          "backdrop-blur-xl",
          "border border-gray-200/60 dark:border-gray-800/60",
          "shadow-lg shadow-black/5 dark:shadow-black/20",
          "rounded-xl overflow-hidden",
        )}
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[480px]">
          {/* Search - Compact */}
          <div className="relative px-3 pt-3 pb-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search emojis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-8 pr-2.5 h-8 rounded-lg text-xs",
                  "bg-gray-50/80 dark:bg-gray-900/50",
                  "border border-gray-200/60 dark:border-gray-800/60",
                  "focus-visible:ring-1 focus-visible:ring-gray-300/50 dark:focus-visible:ring-gray-700/50",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                )}
              />
            </div>
          </div>

          {/* Category tabs - Beautiful & Compact */}
          <div className="flex gap-0 overflow-x-auto px-2 pb-2.5 scrollbar-hide border-b border-gray-100/60 dark:border-gray-800/40">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery("");
              }}
              className={cn(
                "px-1.5 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap shrink-0",
                "transition-all duration-200",
                !selectedCategory
                  ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 text-white dark:text-gray-900 shadow-sm"
                  : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-900/40",
              )}
            >
              All
            </button>
            {categories.map((category) => {
              // Shorten long category names to fit better
              const shortName = category
                .replace("Smileys & People", "Smileys")
                .replace("Food & Drink", "Food")
                .replace("Activities", "Activity");
              return (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap shrink-0",
                    "transition-all duration-200",
                    selectedCategory === category
                      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 text-white dark:text-gray-900 shadow-sm"
                      : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-900/40",
                  )}
                  title={category}
                >
                  {shortName}
                </button>
              );
            })}
          </div>

          {/* Emoji grid - Compact */}
          <div className="overflow-y-auto px-3 py-3 scrollbar-hide max-h-[360px]">
            <div className="grid grid-cols-10 gap-0.5">
              {filteredEmojis.map(({ emoji, category }, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center text-lg rounded-md",
                    "hover:bg-gray-100/80 dark:hover:bg-gray-800/50",
                    "transition-all duration-150",
                    "hover:scale-110 active:scale-95",
                  )}
                  title={category}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;

