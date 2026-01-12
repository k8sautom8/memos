import { useState, useEffect, useRef } from "react";
import { Volume2Icon, VolumeXIcon, PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";

interface TextToSpeechProps {
  content: string;
  className?: string;
}

interface Voice {
  name: string;
  lang: string;
  gender: "male" | "female" | "unknown";
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ content, className }) => {
  const t = useTranslate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const sentenceIndexRef = useRef(0);
  const sentencesRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      return darkThemes.includes(theme || "");
    }
    return false;
  });
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      setIsDark(darkThemes.includes(theme || ""));
      setIsColorfulTheme(theme === "colorful");
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    
    return () => observer.disconnect();
  }, []);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      
      const voices = window.speechSynthesis.getVoices();
      const voiceList: Voice[] = voices.map((voice) => {
        // Try to determine gender from voice name
        const name = voice.name.toLowerCase();
        let gender: "male" | "female" | "unknown" = "unknown";
        if (name.includes("female") || name.includes("woman") || name.includes("zira") || name.includes("samantha") || name.includes("karen") || name.includes("susan") || name.includes("victoria") || name.includes("shelley")) {
          gender = "female";
        } else if (name.includes("male") || name.includes("man") || name.includes("david") || name.includes("mark") || name.includes("alex") || name.includes("daniel") || name.includes("thomas") || name.includes("james")) {
          gender = "male";
        }
        
        return {
          name: voice.name,
          lang: voice.lang,
          gender,
        };
      });

      setAvailableVoices(voiceList);
      
      // Set default voice - prioritize Google UK English Female (en-GB)
      if (voices.length > 0 && !selectedVoice) {
        // First priority: Google UK English Female (en-GB)
        const googleUKFemale = voices.find((v) => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          return (name.includes("google") || name.includes("gb")) && 
                 lang.includes("en-gb") && 
                 (name.includes("female") || name.includes("uk"));
        });
        
        if (googleUKFemale) {
          setSelectedVoice(googleUKFemale);
          return;
        }
        
        // Second priority: Any Google UK English voice
        const googleUKVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          return (name.includes("google") || name.includes("gb")) && lang.includes("en-gb");
        });
        
        if (googleUKVoice) {
          setSelectedVoice(googleUKVoice);
          return;
        }
        
        // Third priority: Neural/premium female voices (they sound more natural)
        const neuralFemaleVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          return (name.includes("neural") || name.includes("premium") || name.includes("enhanced")) &&
                 (name.includes("female") || name.includes("zira") || name.includes("samantha") || name.includes("victoria") || name.includes("aria") || name.includes("jenny"));
        });
        const neuralMaleVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          return (name.includes("neural") || name.includes("premium") || name.includes("enhanced")) &&
                 (name.includes("male") || name.includes("david") || name.includes("mark") || name.includes("thomas") || name.includes("guy") || name.includes("brian"));
        });
        
        // Fallback to regular voices
        const femaleVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          return name.includes("female") || name.includes("zira") || name.includes("samantha") || name.includes("victoria") || name.includes("aria") || name.includes("jenny");
        });
        const maleVoice = voices.find((v) => {
          const name = v.name.toLowerCase();
          return name.includes("male") || name.includes("david") || name.includes("mark") || name.includes("thomas") || name.includes("guy") || name.includes("brian");
        });
        
        setSelectedVoice(neuralFemaleVoice || neuralMaleVoice || femaleVoice || maleVoice || voices[0]);
      }
    };

    loadVoices();
    
    // Voices may load asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (window.speechSynthesis.onvoiceschanged) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const processTextForNaturalReading = (text: string): string => {
    // Clean markdown but preserve structure for natural reading
    let processed = text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove markdown links, keep text
      .replace(/#{1,6}\s+/g, "") // Remove markdown headers
      .replace(/\*\*([^\*]+)\*\*/g, "$1") // Remove bold
      .replace(/\*([^\*]+)\*/g, "$1") // Remove italic
      .replace(/`([^`]+)`/g, "$1") // Remove code
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "") // Remove images
      .trim();

    // Add natural pauses for better story-like reading
    // Add pause after periods (but not abbreviations)
    processed = processed.replace(/\.([A-Z])/g, ". $1");
    
    // Add pause after exclamation and question marks
    processed = processed.replace(/([!?])([A-Z])/g, "$1 $2");
    
    // Add pause after colons and semicolons
    processed = processed.replace(/([:;])([A-Z])/g, "$1 $2");
    
    // Add pause after commas (but not in numbers)
    processed = processed.replace(/,([A-Z])/g, ", $1");
    
    // Ensure proper spacing around paragraphs
    processed = processed.replace(/\n\s*\n/g, "\n\n");
    
    // Add slight pause markers for better flow
    processed = processed.replace(/([.!?])\s+([A-Z])/g, "$1 ... $2");
    
    return processed;
  };

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    // Process text for natural story-like reading
    const cleanText = processTextForNaturalReading(content);

    if (!cleanText) {
      alert("No text content to read.");
      return;
    }

    // Split into sentences for more natural reading with pauses
    // Better sentence splitting that preserves punctuation
    const sentences = cleanText
      .replace(/([.!?])\s+/g, "$1|SPLIT|") // Mark sentence endings
      .split("|SPLIT|")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    sentencesRef.current = sentences;
    sentenceIndexRef.current = 0;

    const speakNextChunk = () => {
      if (sentenceIndexRef.current >= sentencesRef.current.length) {
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
        return;
      }

      // Combine 2-3 sentences for natural flow (not too short, not too long)
      let textChunk = "";
      let sentencesInChunk = 0;
      const maxSentencesPerChunk = 3;
      const maxChunkLength = 250; // Characters per chunk

      while (
        sentenceIndexRef.current < sentencesRef.current.length &&
        sentencesInChunk < maxSentencesPerChunk &&
        textChunk.length < maxChunkLength
      ) {
        const sentence = sentencesRef.current[sentenceIndexRef.current];
        if (textChunk) {
          textChunk += " ";
        }
        textChunk += sentence;
        sentencesInChunk++;
        sentenceIndexRef.current++;
      }

      const utterance = new SpeechSynthesisUtterance(textChunk);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // More natural, expressive speech parameters for story reading
      utterance.rate = 0.88; // Comfortable story-telling pace
      utterance.pitch = 1.2; // More expressive, human-like pitch variation
      utterance.volume = 1.0;
      
      // Try to use neural/premium voices if available (they sound more natural)
      const voices = window.speechSynthesis.getVoices();
      if (selectedVoice) {
        // Check if there's a neural/premium version of the selected voice
        const neuralVoice = voices.find((v) => 
          v.name.toLowerCase().includes("neural") && 
          v.lang === selectedVoice.lang &&
          (selectedVoice.name.toLowerCase().includes("female") ? 
            v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha") :
            v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("mark"))
        );
        if (neuralVoice) {
          utterance.voice = neuralVoice;
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        isPlayingRef.current = true;
        isPausedRef.current = false;
      };

      utterance.onend = () => {
        // Add natural pause between chunks (like a storyteller taking a breath)
        setTimeout(() => {
          // Check refs for current state (more reliable than state)
          if (isPlayingRef.current && !isPausedRef.current && sentenceIndexRef.current < sentencesRef.current.length) {
            speakNextChunk();
          } else {
            setIsPlaying(false);
            setIsPaused(false);
            isPlayingRef.current = false;
            isPausedRef.current = false;
            utteranceRef.current = null;
            sentenceIndexRef.current = 0;
            sentencesRef.current = [];
          }
        }, 500); // 500ms pause between chunks for natural storytelling flow
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Start speaking
    setIsPlaying(true);
    setIsPaused(false);
    isPlayingRef.current = true;
    isPausedRef.current = false;
    speakNextChunk();
  };

  const pause = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPaused(true);
        isPausedRef.current = true;
      }
    }
  };

  const resume = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        isPausedRef.current = false;
      } else if (!isPlayingRef.current) {
        // If stopped, restart from beginning
        speak();
      }
    }
  };

  const stop = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      isPausedRef.current = false;
      utteranceRef.current = null;
      sentenceIndexRef.current = 0;
      sentencesRef.current = [];
    }
  };

  const handleVoiceSelect = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    if (isPlaying) {
      stop();
      setTimeout(() => {
        speak();
      }, 100);
    }
  };

  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null; // Don't show if not supported
  }

  const voices = window.speechSynthesis.getVoices();
  
  // Prioritize neural/premium voices (they sound more natural)
  const neuralVoices = voices.filter((v) => {
    const name = v.name.toLowerCase();
    return name.includes("neural") || name.includes("premium") || name.includes("enhanced");
  });
  
  const femaleVoices = voices.filter((v) => {
    const name = v.name.toLowerCase();
    return (name.includes("female") || name.includes("zira") || name.includes("samantha") || name.includes("karen") || name.includes("susan") || name.includes("victoria") || name.includes("shelley") || name.includes("aria") || name.includes("jenny") || name.includes("linda")) &&
           !neuralVoices.includes(v); // Exclude neural voices (they'll be shown separately)
  });
  
  const maleVoices = voices.filter((v) => {
    const name = v.name.toLowerCase();
    return (name.includes("male") || name.includes("david") || name.includes("mark") || name.includes("alex") || name.includes("daniel") || name.includes("thomas") || name.includes("james") || name.includes("guy") || name.includes("brian")) &&
           !neuralVoices.includes(v); // Exclude neural voices
  });
  
  // Separate neural voices by gender
  const neuralFemaleVoices = neuralVoices.filter((v) => {
    const name = v.name.toLowerCase();
    return name.includes("female") || name.includes("zira") || name.includes("samantha") || name.includes("victoria") || name.includes("aria") || name.includes("jenny");
  });
  
  const neuralMaleVoices = neuralVoices.filter((v) => {
    const name = v.name.toLowerCase();
    return name.includes("male") || name.includes("david") || name.includes("mark") || name.includes("thomas") || name.includes("guy") || name.includes("brian");
  });

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {!isPlaying && !isPaused && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7",
                isColorfulTheme && !isDark && "hover:bg-blue-500/12 text-blue-600/70",
              )}
              onClick={speak}
              style={isDark ? { color: "var(--card-foreground)" } : undefined}
            >
              <Volume2Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Read aloud</p>
          </TooltipContent>
        </Tooltip>
      )}

      {(isPlaying || isPaused) && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  isColorfulTheme && !isDark && "hover:bg-blue-500/12 text-blue-600/70",
                )}
                onClick={isPaused ? resume : pause}
                style={isDark ? { color: "var(--card-foreground)" } : undefined}
              >
                {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPaused ? "Resume" : "Pause"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  isColorfulTheme && !isDark && "hover:bg-blue-500/12 text-blue-600/70",
                )}
                onClick={stop}
                style={isDark ? { color: "var(--card-foreground)" } : undefined}
              >
                <VolumeXIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stop</p>
            </TooltipContent>
          </Tooltip>
        </>
      )}

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  isColorfulTheme && !isDark && "hover:bg-blue-500/12 text-blue-600/70",
                )}
                style={isDark ? { color: "var(--card-foreground)" } : undefined}
              >
                <Volume2Icon className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice options</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
          {neuralFemaleVoices.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">⭐ Premium Female Voices</div>
              {neuralFemaleVoices.slice(0, 5).map((voice) => (
                <DropdownMenuItem
                  key={voice.name}
                  onClick={() => handleVoiceSelect(voice)}
                  className={cn(
                    "cursor-pointer",
                    selectedVoice?.name === voice.name && "bg-accent"
                  )}
                >
                  {voice.name} ({voice.lang})
                </DropdownMenuItem>
              ))}
              {(neuralMaleVoices.length > 0 || femaleVoices.length > 0 || maleVoices.length > 0) && <DropdownMenuSeparator />}
            </>
          )}
          {neuralMaleVoices.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">⭐ Premium Male Voices</div>
              {neuralMaleVoices.slice(0, 5).map((voice) => (
                <DropdownMenuItem
                  key={voice.name}
                  onClick={() => handleVoiceSelect(voice)}
                  className={cn(
                    "cursor-pointer",
                    selectedVoice?.name === voice.name && "bg-accent"
                  )}
                >
                  {voice.name} ({voice.lang})
                </DropdownMenuItem>
              ))}
              {(femaleVoices.length > 0 || maleVoices.length > 0) && <DropdownMenuSeparator />}
            </>
          )}
          {femaleVoices.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Female Voices</div>
              {femaleVoices.slice(0, 5).map((voice) => (
                <DropdownMenuItem
                  key={voice.name}
                  onClick={() => handleVoiceSelect(voice)}
                  className={cn(
                    "cursor-pointer",
                    selectedVoice?.name === voice.name && "bg-accent"
                  )}
                >
                  {voice.name} ({voice.lang})
                </DropdownMenuItem>
              ))}
              {maleVoices.length > 0 && <DropdownMenuSeparator />}
            </>
          )}
          {maleVoices.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Male Voices</div>
              {maleVoices.slice(0, 5).map((voice) => (
                <DropdownMenuItem
                  key={voice.name}
                  onClick={() => handleVoiceSelect(voice)}
                  className={cn(
                    "cursor-pointer",
                    selectedVoice?.name === voice.name && "bg-accent"
                  )}
                >
                  {voice.name} ({voice.lang})
                </DropdownMenuItem>
              ))}
            </>
          )}
          {neuralFemaleVoices.length === 0 && neuralMaleVoices.length === 0 && femaleVoices.length === 0 && maleVoices.length === 0 && voices.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Available Voices</div>
              {voices.slice(0, 10).map((voice) => (
                <DropdownMenuItem
                  key={voice.name}
                  onClick={() => handleVoiceSelect(voice)}
                  className={cn(
                    "cursor-pointer",
                    selectedVoice?.name === voice.name && "bg-accent"
                  )}
                >
                  {voice.name} ({voice.lang})
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TextToSpeech;
