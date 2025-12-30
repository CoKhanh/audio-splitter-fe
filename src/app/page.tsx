"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState<File>()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ vocals: string; no_vocals: string } | null>(null)
  const [isPlayingAll, setIsPlayingAll] = useState(false)

  const vocalsRef = useRef<HTMLAudioElement>(null)
  const noVocalsRef = useRef<HTMLAudioElement>(null)

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      console.error("Invalid File");
      return
    }

    setFile(file);
  }

  const handleSeparateAudio = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/separate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error separating audio:", error);
      alert("Có lỗi xảy ra khi tách âm thanh");
    } finally {
      setLoading(false);
    }
  }

  const handlePlayAll = () => {
    if (vocalsRef.current && noVocalsRef.current) {
      if (isPlayingAll) {
        vocalsRef.current.pause();
        noVocalsRef.current.pause();
        setIsPlayingAll(false);
      } else {
        vocalsRef.current.currentTime = 0;
        noVocalsRef.current.currentTime = 0;
        vocalsRef.current.play();
        noVocalsRef.current.play();
        setIsPlayingAll(true);
      }
    }
  }

  const handleAudioEnded = () => {
    if (vocalsRef.current?.paused && noVocalsRef.current?.paused) {
      setIsPlayingAll(false);
    }
  }

  return (
    <div className="flex gap-8 min-h-screen h-full flex-col justify-center items-center bg-zinc-50 font-sans dark:bg-black">
      <Input id="audio" type="file" accept="audio/*" className="hidden" onChange={handleOnChange} />
      <label
        htmlFor="audio"
        className="w-1/2 h-60 rounded-2xl border bg-white shadow-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-400 text-2xl">
          {file ? file.name : "Tải File Audio"}
        </span>
      </label>
      <Button
        size={"lg"}
        className="font-medium text-xl"
        onClick={handleSeparateAudio}
        disabled={!file || loading}
      >
        {loading ? "Đang xử lý..." : "Tách Âm Thanh"}
      </Button>

      {result && (
        <div className="flex flex-col gap-4 w-1/2 mt-8">
          <h2 className="text-2xl font-bold text-center">Kết quả</h2>

          <Button
            size={"lg"}
            variant={isPlayingAll ? "destructive" : "default"}
            className="font-medium text-lg"
            onClick={handlePlayAll}
          >
            {isPlayingAll ? "Dừng Phát Tất Cả" : "Phát Tất Cả Cùng Lúc"}
          </Button>

          <div className="flex flex-col gap-4 p-6 bg-white rounded-2xl shadow-xl">
            {result.vocals && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-lg">Vocals (Giọng hát):</h3>
                <audio
                  ref={vocalsRef}
                  controls
                  src={result.vocals}
                  className="w-full"
                  onEnded={handleAudioEnded}
                  onPause={handleAudioEnded}
                />
                <a
                  href={result.vocals}
                  download
                  className="text-blue-600 hover:underline text-sm"
                  target={"_blank"}
                >
                  Tải xuống
                </a>
              </div>
            )}
            {result.no_vocals && (
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-lg">No Vocals (Nhạc nền):</h3>
                <audio
                  ref={noVocalsRef}
                  controls
                  src={result.no_vocals}
                  className="w-full"
                  onEnded={handleAudioEnded}
                  onPause={handleAudioEnded}
                />
                <a
                  href={result.no_vocals}
                  download
                  target={"_blank"}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Tải xuống
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
