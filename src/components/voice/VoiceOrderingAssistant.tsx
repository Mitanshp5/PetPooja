import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

interface VoiceOrderingAssistantProps {
    onCartUpdate: (update: any) => void;
}

const VoiceOrderingAssistant: React.FC<VoiceOrderingAssistantProps> = ({ onCartUpdate }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startSession = async () => {
        try {
            setStatus('connecting');
            setError(null);

            // 1. Initialize Audio Context
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            });

            // 2. Get User Media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const source = audioContextRef.current.createMediaStreamSource(stream);

            // 3. Create Processor for 16kHz PCM
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            // 4. Setup WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.hostname}:8000/voice/stream`;
            socketRef.current = new WebSocket(wsUrl);

            socketRef.current.onopen = () => {
                setStatus('listening');
                setIsRecording(true);

                // Trigger the AI's seasonal greeting
                socketRef.current?.send(JSON.stringify({
                    client_content: {
                        turns: [{
                            parts: [{ text: "Start the conversation with your greeting now." }]
                        }]
                    }
                }));

                source.connect(processorRef.current!);
                processorRef.current!.connect(audioContextRef.current!.destination);

                processorRef.current!.onaudioprocess = (e) => {
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        const inputData = e.inputBuffer.getChannelData(0);
                        // Convert Float32 to Int16
                        const int16Data = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                        }
                        // Send as base64 in the expected Gemini Realtime format
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Data = (reader.result as string).split(',')[1];
                            socketRef.current?.send(JSON.stringify({
                                realtime_input: {
                                    media_chunks: [{
                                        mime_type: "audio/pcm;rate=16000",
                                        data: base64Data
                                    }]
                                }
                            }));
                        };
                        reader.readAsDataURL(new Blob([int16Data]));
                    }
                };
            };

            socketRef.current.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                if (data.realtime_output) {
                    setStatus('speaking');
                    const base64Audio = data.realtime_output.media_chunks[0].data;
                    const binaryString = atob(base64Audio);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const int16Array = new Int16Array(bytes.buffer);
                    const float32Array = new Float32Array(int16Array.length);
                    for (let i = 0; i < int16Array.length; i++) {
                        float32Array[i] = int16Array[i] / 0x7FFF;
                    }

                    await playAudio(float32Array);
                    setStatus('listening');
                } else if (data.type === 'cart_update') {
                    console.log("AI Cart Update:", data.args);
                    onCartUpdate(data.args);
                }
            };

            socketRef.current.onerror = (err) => {
                setError("WebSocket error occurred.");
                stopSession();
            };

            socketRef.current.onclose = () => {
                stopSession();
            };

        } catch (err: any) {
            setError(err.message || "Failed to start voice assistant.");
            setStatus('idle');
        }
    };

    const playAudio = (data: Float32Array) => {
        return new Promise<void>((resolve) => {
            if (!audioContextRef.current) return resolve();

            const buffer = audioContextRef.current.createBuffer(1, data.length, 16000);
            buffer.getChannelData(0).set(data);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => resolve();
            source.start();
        });
    };

    const stopSession = () => {
        setIsRecording(false);
        setStatus('idle');
        socketRef.current?.close();
        processorRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
    };

    return (
        <div className="fixed bottom-24 right-6 z-50">
            <div className="relative">
                {status !== 'idle' && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap animate-bounce">
                        {status === 'connecting' && "Connecting..."}
                        {status === 'listening' && "Listening..."}
                        {status === 'speaking' && "AI Speaking..."}
                    </div>
                )}

                <button
                    onClick={isRecording ? stopSession : startSession}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-glow transition-all duration-300 ${isRecording
                        ? "bg-red-500 animate-pulse scale-110"
                        : "gradient-warm hover:scale-105"
                        }`}
                >
                    {status === 'connecting' ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : isRecording ? (
                        <MicOff className="w-6 h-6 text-white" />
                    ) : (
                        <Mic className="w-6 h-6 text-white" />
                    )}
                </button>

                {error && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[10px] p-2 rounded-lg w-32 shadow-lg">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceOrderingAssistant;
