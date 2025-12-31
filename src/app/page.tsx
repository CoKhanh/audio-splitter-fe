"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState<File>()
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ vocals: string; no_vocals: string } | null>(null)
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

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

  const handleDownloadAndSeparate = async () => {
    if (!youtubeUrl) return;

    setLoading(true);
    setResult(null);
    setEmailSent(false);

    try {
      const response = await fetch("http://localhost:8000/download-and-separate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: youtubeUrl,
          email: email || undefined  // Only send email if provided
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.separated_audio);
        setYoutubeUrl("")
        setEmailSent(data.email_sent || false);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error downloading and separating audio:", error);
      alert("Có lỗi xảy ra khi tải và tách âm thanh");
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
      <div className="w-1/2 flex flex-col gap-6">
        {/* File Upload Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-center">Tải File Từ Máy</h2>
          <Input id="audio" type="file" accept="audio/*" className="hidden" onChange={handleOnChange} disabled={loading} />
          <label
            htmlFor="audio"
            className="h-40 rounded-2xl border bg-white shadow-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-400 text-xl">
              {file ? file.name : "Tải File Audio"}
            </span>
          </label>
          <Button
            size={"lg"}
            className="font-medium text-lg"
            onClick={handleSeparateAudio}
            disabled={!file || loading}
          >
            {loading ? "Đang xử lý..." : "Tách Âm Thanh"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 font-medium">HOẶC</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* YouTube URL Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-center">Tải Từ YouTube</h2>
          <Input
            type="text"
            placeholder="Nhập URL YouTube..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="text-lg py-6"
            disabled={loading}
          />
          <Input
            type="email"
            placeholder="Email (tùy chọn - để nhận kết quả qua email)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-lg py-6"
            disabled={loading}
          />
          <Button
            size={"lg"}
            className="font-medium text-lg"
            onClick={handleDownloadAndSeparate}
            disabled={!youtubeUrl || loading}
          >
            {loading ? "Đang xử lý..." : "Tải và Tách Âm Thanh"}
          </Button>
          {emailSent && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-center">
                ✓ Email đã được gửi thành công!
              </p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="flex flex-col gap-4 w-1/2 mt-8 pb-8">
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
