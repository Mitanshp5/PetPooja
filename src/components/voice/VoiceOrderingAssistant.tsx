import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';

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
    const audioQueue = useRef<Float32Array[]>([]);
    const isPlaying = useRef(false);
    const isModelTurning = useRef(false);
    const nextStartTimeRef = useRef<number>(0);
    const effectsChainRef = useRef<{ compressor: DynamicsCompressorNode, lowShelf: BiquadFilterNode, highBoost: BiquadFilterNode } | null>(null);

    const startSession = async () => {
        try {
            setStatus('connecting');
            setError(null);

            // 1. Fetch Config, Menu, and Combos
            const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
            const [configResp, menuResp, comboResp] = await Promise.all([
                fetch(`${API_BASE}/config/gemini-key`),
                fetch(`${API_BASE}/menu-items/`),
                fetch(`${API_BASE}/revenue/combos`)
            ]);

            const { api_key } = await configResp.json();
            const menuItems = await menuResp.json();
            const comboData = await comboResp.json();

            if (!api_key) throw new Error("API Key not found on server.");

            const menuContext = menuItems.map((item: any) => `${item.name} (${item.category})`).join(", ");
            const comboContext = comboData.recommendations.map((c: any) =>
                `${c.is_promoted ? "[PRIORITY SPECIAL]: " : ""}If they order ${c.primary_item_name}, recommend ${c.recommended_item_name}`
            ).join(". ");

            const now = new Date();
            const hour = now.getHours();
            let timeContext = "It's breakfast time, suggest light snacks.";
            if (hour >= 12 && hour < 16) timeContext = "It's lunch time, suggest hearty meals like Amritsari Paratha and Dal Makhani.";
            else if (hour >= 16 && hour < 20) timeContext = "It's a warm evening, suggest cold beverages like Sweet Lassi or Gulab Jamun for dessert.";
            else if (hour >= 20) timeContext = "It's dinner time, suggest our signature Thalis.";

            // 2. Initialize Audio Context & Effects Chain
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000,
            });

            const compressor = audioContextRef.current.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            const lowShelf = audioContextRef.current.createBiquadFilter();
            lowShelf.type = "lowshelf";
            lowShelf.frequency.value = 250;
            lowShelf.gain.value = -3;

            const highBoost = audioContextRef.current.createBiquadFilter();
            highBoost.type = "peaking";
            highBoost.frequency.value = 5000;
            highBoost.gain.value = 4;

            compressor.connect(lowShelf);
            lowShelf.connect(highBoost);
            highBoost.connect(audioContextRef.current.destination);

            effectsChainRef.current = { compressor, lowShelf, highBoost };

            // 3. Get User Media (Echo cancellation critical for speaker playback!)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            streamRef.current = stream;
            const source = audioContextRef.current.createMediaStreamSource(stream);

            // 4. Create Processor for 24kHz PCM (Reduced buffer for lower latency)
            processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);

            // 5. Setup WebSocket directly to Google
            const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${api_key}`;
            socketRef.current = new WebSocket(wsUrl);

            socketRef.current.onopen = () => {
                const setupMessage = {
                    setup: {
                        model: "models/gemini-2.5-flash-native-audio-latest",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
                        },
                        systemInstruction: {
                            parts: [{
                                text: `You are PetPooja's expert FEMALE voice waiter (Main female hoon). 
CRITICAL: ALWAYS use female gendered speech for YOURSELF in Hindi/Hinglish (e.g., use 'karti hoon', 'sakti hoon', 'hoon').
CRITICAL: ALWAYS address the CUSTOMER using MALE gendered terms (e.g., 'aap chahte hain', 'aap khayenge' instead of 'chati hai').
DO NOT OUTPUT ANY TEXT. ONLY OUTPUT AUDIO. NEVER EXPLAIN YOUR ACTIONS IN TEXT.
BE EXTREMELY CONCISE. Minimize filler words. Don't speak more than necessary. 
1. Speak SLOWLY, POLITELY and CALMLY in a professional Indian accent.
2. MENU KNOWLEDGE: You ONLY sell these items: ${menuContext}. Efficiently handle off-menu requests.
3. CONTEXTUAL UPSLELLING: ${timeContext} ${comboContext}. Items marked as [PRIORITY SPECIAL] are highly recommended for upselling. Be brief with suggestions.
4. HYDRATION: ONLY when the customer is ready to confirm the final order, check if they have already added a 'Water Bottle' or 'Bisleri'. If they have NOT ordered water, briefly say 'Kya main aapke liye paani ki ek bottle add kar doon?' before summarizing for 'place_order'.
5. SPECIAL REQUESTS: Quickly ask for 'Spicy', 'Jain', 'Less Oily', or comments for each item.
6. TOOL USAGE: 
   - Use 'process_order' for item updates.
   - Use 'place_order' ONLY when the user explicitly confirms the final summary.
7. YOUR FIRST RESPONSE MUST BE: 'Namaste! PetPooja mein aapka swagat hai. Main aapki kaise sahayata kar sakti hoon?'`
                            }]
                        },
                        tools: [{
                            functionDeclarations: [
                                {
                                    name: "process_order",
                                    description: "Updates the customer's shopping cart with items and special instructions.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            items: {
                                                type: "ARRAY",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        action: { type: "STRING", enum: ["add", "remove"] },
                                                        item_name: { type: "STRING" },
                                                        quantity: { type: "INTEGER" },
                                                        modifiers: { type: "ARRAY", items: { type: "STRING" }, description: "e.g., Spicy, Jain, Less Oily" },
                                                        notes: { type: "STRING", description: "Any other special comments" }
                                                    },
                                                    required: ["action", "item_name", "quantity"]
                                                }
                                            }
                                        },
                                        required: ["items"]
                                    }
                                },
                                {
                                    name: "place_order",
                                    description: "Finalizes the order and sends it to the kitchen.",
                                    parameters: { type: "OBJECT", properties: {} }
                                }
                            ]
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

                if (data.setupComplete) {
                    setStatus('listening');
                    setIsRecording(true);

                    // WARM START: Force an initial greeting from Gemini
                    socketRef.current?.send(JSON.stringify({
                        clientContent: {
                            turns: [{
                                role: "user",
                                parts: [{ text: "Hello! Please greet me now." }]
                            }],
                            turnComplete: true
                        }
                    }));

                    source.connect(processorRef.current!);

                    // Route processor to a silent gain node so it processes data without playing mic input to speakers
                    const silentNode = audioContextRef.current!.createGain();
                    silentNode.gain.value = 0;
                    processorRef.current!.connect(silentNode);
                    silentNode.connect(audioContextRef.current!.destination);

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
                                    mimeType: "audio/pcm;rate=24000",
                                    data: base64Data
                                }]
                            }
                        }));
                    };

                    console.log("Voice Assistant connected and listening.");
                }

                if (data.error) {
                    console.error("Gemini Error:", data.error);
                    setError(data.error.message || "AI Error occurred.");
                }

                if (data.serverContent?.modelTurn) {
                    // Turn awareness: Use the explicit turnComplete flag if present
                    if (data.serverContent.modelTurn.hasOwnProperty('turnComplete')) {
                        isModelTurning.current = !data.serverContent.modelTurn.turnComplete;
                    } else {
                        isModelTurning.current = true; // Assume turning if we received any model content without complete flag
                    }

                    for (const part of data.serverContent.modelTurn.parts) {
                        if (part.inlineData) {
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
                    }
                }

                if (data.toolCall) {
                    for (const call of data.toolCall.functionCalls) {
                        const callId = call.id;
                        const functionName = call.name;

                        if (functionName === "process_order") {
                            onCartUpdate({ function: "process_order", args: call.args });
                            socketRef.current?.send(JSON.stringify({
                                toolResponse: {
                                    functionResponses: [{
                                        name: functionName,
                                        response: { success: true },
                                        id: callId
                                    }]
                                }
                            }));
                        } else if (functionName === "place_order") {
                            // Fetch current cart state (this would normally come from a prop or context)
                            // For this demo, we'll assume the AI has the summary and we trigger the submission
                            onCartUpdate({ function: "place_order", args: {} });
                            socketRef.current?.send(JSON.stringify({
                                toolResponse: {
                                    functionResponses: [{
                                        name: functionName,
                                        response: { success: true, message: "Order sent to kitchen!" },
                                        id: callId
                                    }]
                                }
                            }));
                        }
                    }
                }
            };

            socketRef.current.onerror = (err) => {
                console.error("WebSocket Error:", err);
                setError("WebSocket error occurred.");
                stopSession();
            };

            socketRef.current.onclose = () => {
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

        while (isPlaying.current) {
            if (audioQueue.current.length > 0) {
                const data = audioQueue.current.shift()!;
                await playAudioChunk(data);
            } else {
                // Network/Processing gap: Wait up to 1500ms for more data IF model is still turning
                let waitTime = 0;
                while (audioQueue.current.length === 0 && isModelTurning.current && waitTime < 1500) {
                    await new Promise(r => setTimeout(r, 50));
                    waitTime += 50;
                }

                if (audioQueue.current.length === 0 && (!isModelTurning.current || waitTime >= 1500)) {
                    isPlaying.current = false;
                }
            }
        }

        setStatus('listening');
    };

    const playAudioChunk = (data: Float32Array) => {
        return new Promise<void>((resolve) => {
            if (!audioContextRef.current || !effectsChainRef.current) return resolve();

            const buffer = audioContextRef.current.createBuffer(1, data.length, 24000);
            buffer.getChannelData(0).set(data);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = 1.0;
            source.connect(effectsChainRef.current.compressor);

            const now = audioContextRef.current.currentTime;

            // If we've fallen behind or this is a fresh start, sync to now + buffer
            if (nextStartTimeRef.current < now) {
                nextStartTimeRef.current = now + 0.15; // 150ms initial jitter buffer
            }

            const startTime = nextStartTimeRef.current;
            source.start(startTime);

            const duration = data.length / 24000;
            nextStartTimeRef.current = startTime + duration;

            // Resolve earlier (60ms head start) to maintain the feed. 
            const delay = (startTime - now + duration) * 1000 - 60;
            setTimeout(resolve, Math.max(0, delay));
        });
    };

    const stopSession = () => {
        setIsRecording(false);
        setStatus('idle');
        socketRef.current?.close();
        processorRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
        audioQueue.current = [];
        isPlaying.current = false;
    };

    return (
        <div className="fixed bottom-24 right-6 z-50">
            <div className="relative">
                {status !== 'idle' && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap animate-bounce flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        {status === 'connecting' && "Connecting..."}
                        {status === 'listening' && "Ready for Order"}
                        {status === 'speaking' && "AI Speaking..."}
                    </div>
                )}

                <button
                    onClick={isRecording ? stopSession : startSession}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-glow transition-all duration-300 ${isRecording
                        ? "bg-red-500 animate-pulse scale-110"
                        : "gradient-warm hover:scale-105 active:scale-95"
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
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[10px] p-2 rounded-lg w-32 shadow-lg flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceOrderingAssistant;
