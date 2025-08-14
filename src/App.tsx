import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Volume2, Play, Languages, Mic, Square, Home } from "lucide-react";

// --- LANG PACKS ---
const zhPack = {
  code: "zh-CN",
  name: "Mandarin Chinese",
  encouragement: [
    { lang: "zh", text: "太棒了，亲爱的！" },
    { lang: "zh", text: "厉害喔！继续保持！" },
    { lang: "en", text: "Amazing job—nailed it." },
  ],
  items: [
    { id: "hsk6-1", hanzi: "颠覆", pinyin: "diānfù", en: "to subvert; overturn" },
    { id: "hsk6-2", hanzi: "渗透", pinyin: "shèntòu", en: "to permeate; infiltrate" },
  ],
};

const scrambledPack = {
  code: "scrambled",
  name: "Scrambled Eggs 🥚",
  encouragement: [{ lang: "en", text: "Scrambled perfection!" }],
  items: [
    { id: "egg-1", hanzi: "🍳", pinyin: "chǎo dàn", en: "scrambled eggs" },
    { id: "egg-2", hanzi: "🥚", pinyin: "jīdàn", en: "egg" },
  ],
};

const allPacks = [zhPack, scrambledPack];

// --- VOICE HOOK ---
function useVoice(locale: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null as any;
    };
  }, []);
  const match = useMemo(() => {
    const exact = voices.find(v => v.lang === locale);
    if (exact) return exact;
    return voices.find(v => v.lang?.startsWith(locale.split("-")[0])) || null;
  }, [voices, locale]);
  return match;
}

function speak(text: string, voice?: SpeechSynthesisVoice, rate = 0.95) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = rate;
    window.speechSynthesis.speak(u);
  } catch {}
}

// --- MAIN APP ---
export default function App() {
  const [started, setStarted] = useState(false);
  const [pack, setPack] = useState<typeof zhPack | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem("echo-xp");
    return saved ? parseInt(saved) : 0;
  });
  const [name, setName] = useState("小爱");
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const zhVoice = useVoice(pack?.code || "zh-CN");
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  // persist XP
  useEffect(() => {
    localStorage.setItem("echo-xp", xp.toString());
  }, [xp]);

  if (!pack) {
    // Language selection screen
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-light">
              <Languages className="h-6 w-6" /> Choose Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="mb-4"/>
            {allPacks.map(p => (
              <Button key={p.code} onClick={() => { setPack(p); setStarted(true); }} className="w-full mb-2">
                {p.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const item = pack.items[index];
  const completion = Math.round(((index + 1) / pack.items.length) * 100);

  const play = () => speak(item.hanzi, zhVoice || undefined, 0.95);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      alert("Please allow microphone access.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const onCorrect = () => {
    const pool = pack.encouragement;
    const e = pool[Math.floor(Math.random() * pool.length)].text;
    setEncouragement(e);
    setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
    setXp(x => x + 10);
    if (index < pack.items.length - 1) setIndex(i => i + 1);
  };

  const onWrong = () => {
    setScore(s => ({ ...s, total: s.total + 1 }));
    play();
  };

  const restart = () => {
    setIndex(0);
    setScore({ correct: 0, total: 0 });
    setEncouragement(null);
    setAudioURL(null);
  };

  const atEnd = index === pack.items.length - 1;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white text-black rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Button size="icon" variant="ghost" onClick={() => { setPack(null); setStarted(false); }}>
          <Home className="h-5 w-5"/>
        </Button>
        <Badge variant="secondary">XP {xp}</Badge>
      </div>
      <Progress value={completion} className="mb-4" />
      <motion.div key={item.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-white border rounded-xl p-6">
        <div className="text-4xl text-center font-bold mb-1">{item.hanzi}</div>
        <div className="text-center text-lg opacity-80 mb-1">{item.pinyin}</div>
        <div className="text-center text-sm opacity-60">{item.en}</div>
        <div className="flex justify-center gap-2 mt-4">
          <Button onClick={play} variant="secondary"><Play className="h-4 w-4"/> Play</Button>
          {!recording ? (
            <Button variant="outline" onClick={startRecording}><Mic className="h-4 w-4"/> Echo</Button>
          ) : (
            <Button variant="destructive" onClick={stopRecording}><Square className="h-4 w-4"/> Stop</Button>
          )}
          {audioURL && <Button variant="secondary" onClick={()=> new Audio(audioURL).play()}><Volume2 className="h-4 w-4"/> My take</Button>}
        </div>
      </motion.div>
      <div className="flex gap-2 mt-4 justify-center">
        <Button onClick={onCorrect}>Got it</Button>
        <Button onClick={onWrong} variant="outline">Not yet</Button>
      </div>
      {encouragement && (
        <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="mt-3 text-center">
          <Badge variant="outline">{encouragement.replace("亲爱的", name || "亲爱的")}</Badge>
        </motion.div>
      )}
      {atEnd && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-6 text-center">
          <span className="font-semibold">Set Complete 🎉</span>
          <p className="text-sm opacity-80">Nice work{ name ? `, ${name}` : ''}! +50 XP</p>
          <Button className="mt-2" onClick={restart}>Replay</Button>
        </motion.div>
      )}
    </div>
  );
}
