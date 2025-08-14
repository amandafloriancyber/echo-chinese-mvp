
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Volume2, Play, Languages, Mic, Square } from "lucide-react";

// Minimal "Echo" ripple icon (b&w friendly)
function LogoEcho({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    </svg>
  );
}

const zhPack = {
  code: "zh-CN",
  name: "Mandarin Chinese",
  encouragement: [
    { lang: "zh", text: "太棒了，亲爱的！" },
    { lang: "zh", text: "厉害喔！继续保持！" },
    { lang: "zh", text: "完全拿捏住了！" },
    { lang: "zh", text: "这发音，绝！" },
    { lang: "zh", text: "你把它打趴了！" },
    { lang: "en", text: "Whoa—you crushed it!" },
    { lang: "en", text: "Amazing job—nailed it." },
    { lang: "en", text: "Clean pronunciation. Chef’s kiss." },
    { lang: "en", text: "You ate that. Zero crumbs." },
    { lang: "en", text: "So good it echoed back!" },
  ],
  items: [
    { id: "hsk6-1", hanzi: "颠覆", pinyin: "diānfù", en: "to subvert; overturn", slow: "颠——覆" },
    { id: "hsk6-2", hanzi: "渗透", pinyin: "shèntòu", en: "to permeate; infiltrate", slow: "渗——透" },
    { id: "hsk6-3", hanzi: "兼顾", pinyin: "jiāngù", en: "to take into account both", slow: "兼——顾" },
    { id: "hsk6-4", hanzi: "协调", pinyin: "xiétiáo", en: "to coordinate; be in harmony", slow: "协——调" },
    { id: "hsk6-5", hanzi: "倡导", pinyin: "chàngdǎo", en: "to advocate; initiate", slow: "倡——导" },
    { id: "hsk6-6", hanzi: "见解", pinyin: "jiànjiě", en: "view; opinion; insight", slow: "见——解" },
    { id: "hsk6-7", hanzi: "领域", pinyin: "lǐngyù", en: "field; domain", slow: "领——域" },
    { id: "hsk6-8", hanzi: "轮廓", pinyin: "lúnkuò", en: "outline; silhouette", slow: "轮——廓" },
    { id: "hsk6-9", hanzi: "维系", pinyin: "wéixì", en: "to maintain; sustain", slow: "维——系" },
    { id: "hsk6-10", hanzi: "融合", pinyin: "rónghé", en: "to merge; fuse", slow: "融——合" },
    { id: "hsk6-11", hanzi: "磨练", pinyin: "móliàn", en: "to temper; hone", slow: "磨——练" },
    { id: "hsk6-12", hanzi: "顾虑", pinyin: "gùlǜ", en: "misgiving; concern", slow: "顾——虑" },
  ],
};

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

export default function App() {
  const [started, setStarted] = useState(false);
  const [pack] = useState(zhPack);
  const [index, setIndex] = useState(0);
  const [slowMode, setSlowMode] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [xp, setXp] = useState(0);
  const [name, setName] = useState("小爱");
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const zhVoice = useVoice(pack.code);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const item = pack.items[index];
  const completion = Math.round(((index + 1) / pack.items.length) * 100);

  const play = () => speak(slowMode ? item.slow : item.hanzi, zhVoice || undefined, slowMode ? 0.85 : 0.95);

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
      alert("Please allow microphone access to record your Echo.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const onCorrect = () => {
    const userLang = (navigator.language || 'en').toLowerCase();
    const preferZh = pack.code.startsWith('zh') || userLang.startsWith('zh');
    const pool = pack.encouragement.filter(e => (preferZh ? e.lang === 'zh' : e.lang === 'en'));
    const e = (pool.length ? pool : pack.encouragement)[Math.floor(Math.random() * (pool.length ? pool.length : pack.encouragement.length))].text;
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
    setXp(0);
  };

  const atEnd = index === pack.items.length - 1;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white text-black rounded-2xl shadow-sm">
      {!started ? (
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-light"><Languages className="h-6 w-6"/> Echo Chinese (HSK6+)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="mb-4"/>
            <Button onClick={()=>setStarted(true)} className="w-full">Start</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">{index + 1}/{pack.items.length}</span>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">XP {xp}</Badge>
            </div>
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
              <div className="inline-flex items-center gap-2 mb-2 text-gray-900">
                <LogoEcho className="h-6 w-6" />
                <span className="font-semibold">Set Complete</span>
              </div>
              <p className="text-sm opacity-80">Nice work{ name ? `, ${name}` : ''}! +50 XP</p>
              <Button className="mt-2" onClick={restart}>Replay</Button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
