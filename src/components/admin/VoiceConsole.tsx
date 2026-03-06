import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const VoiceConsole = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioQueue = useRef<Float32Array[]>([]);
    const isPlaying = useRef(false);

    const startSession = async () => {
        try {
            setStatus('connecting');
            setError(null);
            setTranscript([]);

            // 1. Fetch API Key from backend
            const configResp = await fetch("http://localhost:8000/config/gemini-key");
            const { api_key } = await configResp.json();
            if (!api_key) throw new Error("API Key not found on server.");

            // 2. Initialize Audio Context
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            });

            // 3. Get User Media
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const source = audioContextRef.current.createMediaStreamSource(stream);

            // 4. Create Processor for 16kHz PCM
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            // 5. Setup WebSocket directly to Google
            const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${api_key}`;
            socketRef.current = new WebSocket(wsUrl);

            socketRef.current.onopen = () => {
                console.log("Connected to Gemini Live");

                const setupMessage = {
                    setup: {
                        model: "models/gemini-2.5-flash-native-audio-latest", // Using latest native audio model
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Kore" // Female Voice
                                    }
                                }
                            }
                        },
                        systemInstruction: {
                            parts: [{
                                text: "You are a Voice ordering copilot for PetPooja. ALWAYS use the 'process_order' tool for orders. Speak EXTREMELY SLOWLY and CALMLY. Your VERY FIRST response must be exactly: 'Namaste! PetPooja mein aapka swagat hai. Main aapki kaise sahayata kar sakti hoon?' Rules: 1. DO NOT use markdown. 2. Start directly with the greeting. 3. Output ONLY spoken words."
                            }]
                        },
                        tools: [{
                            functionDeclarations: [{
                                name: "process_order",
                                description: "Updates the customer's shopping cart.",
                                parameters: {
                                    type: "OBJECT",
                                    properties: {
                                        items: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    action: { type: "STRING" },
                                                    item_name: { type: "STRING" },
                                                    quantity: { type: "INTEGER" }
                                                },
                                                required: ["action", "item_name", "quantity"]
                                            }
                                        }
                                    },
                                    required: ["items"]
                                }
                            }]
                        }]
                    }
                };
                socketRef.current?.send(JSON.stringify(setupMessage));
            };

            socketRef.current.onmessage = async (event) => {
                let dataText = event.data;
                if (event.data instanceof Blob) {
                    dataText = await event.data.text();
                }
                const data = JSON.parse(dataText);

                // Handle Setup Complete
                if (data.setupComplete) {
                    setStatus('listening');
                    setIsRecording(true);

                    // Start Mic Processing
                    source.connect(processorRef.current!);
                    processorRef.current!.connect(audioContextRef.current!.destination);
                    processorRef.current!.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16Data = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                        }

                        const uint8Array = new Uint8Array(int16Data.buffer);
                        let binaryString = "";
                        for (let i = 0; i < uint8Array.length; i++) {
                            binaryString += String.fromCharCode(uint8Array[i]);
                        }
                        const base64Data = btoa(binaryString);

                        socketRef.current?.send(JSON.stringify({
                            realtimeInput: {
                                mediaChunks: [{
                                    mimeType: "audio/pcm;rate=16000",
                                    data: base64Data
                                }]
                            }
                        }));
                    };

                    // Initial spark to trigger the greeting
                    socketRef.current?.send(JSON.stringify({
                        clientContent: {
                            turns: [{ role: "user", parts: [{ text: "Hello" }] }],
                            turnComplete: true
                        }
                    }));
                }

                if (data.serverContent) {
                    const modelTurn = data.serverContent.modelTurn;
                    if (modelTurn) {
                        for (const part of modelTurn.parts) {
                            if (part.inlineData) {
                                // Add audio to queue
                                const base64Audio = part.inlineData.data;
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
                                audioQueue.current.push(float32Array);
                                processAudioQueue();
                            }
                            if (part.text) {
                                setTranscript(prev => [...prev, { role: 'assistant', text: part.text }]);
                            }
                        }
                    }
                }

                if (data.toolCall) {
                    for (const call of data.toolCall.functionCalls) {
                        setTranscript(prev => [...prev, { role: 'assistant', text: `[ACTION]: ${call.name} -> ${JSON.stringify(call.args)}` }]);
                        // We would call backend here if this were real, but this is a UI demo
                        // Send dummy response back to Gemini to keep it happy
                        socketRef.current?.send(JSON.stringify({
                            toolResponse: {
                                functionResponses: [{
                                    name: call.name,
                                    response: { success: true },
                                    id: call.id
                                }]
                            }
                        }));
                    }
                }
            };

            socketRef.current.onerror = (err) => {
                console.error("WS Error:", err);
                setError("Connection error. Check console.");
                stopSession();
            };

            socketRef.current.onclose = (event) => {
                console.log(`Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
                stopSession();
            };

        } catch (err: any) {
            setError(err.message || "Failed to start.");
            setStatus('idle');
        }
    };

    const processAudioQueue = async () => {
        if (isPlaying.current || audioQueue.current.length === 0) return;
        isPlaying.current = true;
        setStatus('speaking');

        while (audioQueue.current.length > 0) {
            const data = audioQueue.current.shift()!;
            await playAudioChunk(data);
        }

        isPlaying.current = false;
        setStatus('listening');
    };

    const playAudioChunk = (data: Float32Array) => {
        return new Promise<void>((resolve) => {
            if (!audioContextRef.current) return resolve();

            const buffer = audioContextRef.current.createBuffer(1, data.length, 16000);
            buffer.getChannelData(0).set(data);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;

            // THE CRITICAL REQUIREMENT: 0.25x SPEED
            source.playbackRate.value = 0.25;

            source.connect(audioContextRef.current.destination);
            source.onended = () => resolve();
            source.start();
        });
    };

    const stopSession = () => {
        setIsRecording(false);
        setStatus('idle');
        socketRef.current?.close();
        socketRef.current = null;
        processorRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
        audioQueue.current = [];
        isPlaying.current = false;
    };

    return (
        <div className="bg-card rounded-lg shadow-card border border-border animate-slide-in flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex flex-col">
                    <h3 className="font-display font-semibold text-lg text-card-foreground flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        AI Voice Ordering (Direct Connect)
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-chart-green/10 text-chart-green border-chart-green/20">
                            GEMINI 2.0 FLASH
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-chart-blue/10 text-chart-blue border-chart-blue/20">
                            VOICE: KORE (FEMALE)
                        </Badge>
                    </div>
                </div>
                <button
                    onClick={isRecording ? stopSession : startSession}
                    className={`px-6 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all duration-500 shadow-lg ${isRecording
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                        : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                        }`}
                >
                    {status === 'connecting' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> ESTABLISHING...</>
                    ) : isRecording ? (
                        <><MicOff className="w-4 h-4" /> DISCONNECT</>
                    ) : (
                        <><Mic className="w-4 h-4" /> START AI VOICE CALL</>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
                {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Mic className="w-10 h-10" />
                        </div>
                        <p className="text-base font-medium">Ready for Order Intake</p>
                        <p className="text-sm mt-1 max-w-[250px]">Connect to simulate a real-time ordering conversation at 0.5x speed.</p>
                    </div>
                ) : (
                    transcript.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-card text-foreground border border-border rounded-tl-sm'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {status !== 'idle' && (
                <div className="p-4 border-t border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className={`w-1 rounded-full bg-primary transition-all duration-300 ${status === 'speaking' ? 'animate-bounce h-4' : 'h-1.5'}`}
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            {status === 'speaking' ? "AI Transmitting..." : "Monitoring Mic Input..."}
                        </span>
                    </div>
                    {status === 'speaking' && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                            0.25X SLOW PLAYBACK
                        </Badge>
                    )}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 text-red-500 text-xs flex items-center gap-2 border-t border-red-500/20">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span><strong>Connection Error:</strong> {error}</span>
                </div>
            )}
        </div>
    );
};
