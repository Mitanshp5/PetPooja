import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export const VoiceConsole = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<{ role: 'user' | 'assistant' | 'action', text: string }[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [menuData, setMenuData] = useState<any[]>([]);
    const [interimUserText, setInterimUserText] = useState("");

    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<any>(null);
    const audioQueue = useRef<Float32Array[]>([]);
    const isPlaying = useRef(false);
    const isModelTurning = useRef(false);
    const nextStartTimeRef = useRef<number>(0);
    const effectsChainRef = useRef<{ compressor: DynamicsCompressorNode, lowShelf: BiquadFilterNode, highBoost: BiquadFilterNode } | null>(null);

    const startSession = async () => {
        try {
            setStatus('connecting');
            setError(null);
            setTranscript([]);

            // 1. Fetch Config, Menu, and Combos
            const [configResp, menuResp, comboResp] = await Promise.all([
                fetch("http://localhost:8000/config/gemini-key"),
                fetch("http://localhost:8000/menu-items/"),
                fetch("http://localhost:8000/revenue/combos")
            ]);

            const { api_key } = await configResp.json();
            const items = await menuResp.json();
            const comboData = await comboResp.json();

            setMenuData(items);
            setCart([]);

            if (!api_key) throw new Error("API Key not found on server.");

            const menuContext = items.map((item: any) => `${item.name} (${item.category})`).join(", ");
            const now = new Date();
            const hour = now.getHours();
            const comboContext = comboData.recommendations.map((c: any) =>
                `${c.is_promoted ? "[PRIORITY SPECIAL]: " : ""}If they order ${c.primary_item_name}, recommend ${c.recommended_item_name}`
            ).join(". ");

            let timeContext = "It's breakfast time, suggest light snacks.";
            if (hour >= 12 && hour < 16) timeContext = "It's lunch time, suggest hearty meals like Amritsari Paratha and Dal Makhani.";
            else if (hour >= 16 && hour < 20) timeContext = "It's a warm evening, suggest cold beverages like Sweet Lassi or Gulab Jamun for dessert.";
            else if (hour >= 20) timeContext = "It's dinner time, suggest our signature Thalis.";

            // 2. Initialize Audio Context & Effects
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
            highBoost.Q.value = 0.7;
            highBoost.gain.value = 4;

            compressor.connect(lowShelf);
            lowShelf.connect(highBoost);
            highBoost.connect(audioContextRef.current.destination);

            effectsChainRef.current = { compressor, lowShelf, highBoost };

            // 3. Get User Media with strict Echo Cancellation
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
                console.log("Connected to Gemini Live");

                const setupMessage = {
                    setup: {
                        model: "models/gemini-2.5-flash-native-audio-latest", // Using latest native audio model
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Aoede" // Female Voice
                                    }
                                }
                            }
                        },
                        systemInstruction: {
                            parts: [{
                                text: `You are PetPooja's expert FEMALE voice waiter (Main female hoon). 
CRITICAL: ALWAYS use female gendered speech in Hindi/Hinglish (e.g., use 'karti hoon', 'sakti hoon', 'hoon' instead of 'karta hu', 'sakta hu').
DO NOT OUTPUT ANY TEXT. ONLY OUTPUT AUDIO. NEVER EXPLAIN YOUR ACTIONS IN TEXT.
BE EXTREMELY CONCISE. Minimize filler words. Don't speak more than necessary. 
1. Speak SLOWLY, POLITELY and CALMLY in a professional Indian accent.
2. MENU KNOWLEDGE: You ONLY sell these items: ${menuContext}. Efficiently handle off-menu requests.
3. CONTEXTUAL UPSLELLING: ${timeContext} ${comboContext}. Items marked as [PRIORITY SPECIAL] are highly recommended for upselling. Be brief with suggestions.
4. HYDRATION: ONLY when the customer is ready to confirm the final order, check if we have already added a 'Water Bottle' or 'Bisleri'. If we have NOT ordered water, briefly say 'Kya main aapke liye paani ki ek bottle add kar doon?' before summarizing for 'place_order'.
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

                // Handle Setup Complete
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

                    // Start Mic Processing
                    source.connect(processorRef.current!);

                    // Route to a silent gain node to prevent speaker feedback loop
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

                    // Start Speech Recognition for User Transcription
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                        recognitionRef.current = new SpeechRecognition();
                        recognitionRef.current.continuous = true;
                        recognitionRef.current.interimResults = true;
                        recognitionRef.current.lang = 'en-IN'; // Indian English / Hinglish
                        recognitionRef.current.onresult = (event: any) => {
                            let interim = "";
                            let finalTranscript = "";

                            for (let i = event.resultIndex; i < event.results.length; ++i) {
                                if (event.results[i].isFinal) {
                                    finalTranscript += event.results[i][0].transcript;
                                } else {
                                    interim += event.results[i][0].transcript;
                                }
                            }

                            if (finalTranscript) {
                                setTranscript(prev => [...prev, { role: 'user', text: finalTranscript }]);
                            }
                            setInterimUserText(interim);
                        };
                        recognitionRef.current.start();
                    }

                    // Start Mic Processing
                }

                if (data.serverContent) {
                    const modelTurn = data.serverContent.modelTurn;
                    if (modelTurn) {
                        // Turn awareness: Use explicit flag
                        if (modelTurn.hasOwnProperty('turnComplete')) {
                            isModelTurning.current = !modelTurn.turnComplete;
                        } else {
                            isModelTurning.current = true;
                        }

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
                                // Show text immediately (though we directive-forbid it, it's good for debugging/fallback)
                                setTranscript(prev => {
                                    const newPrev = [...prev];
                                    const last = newPrev[newPrev.length - 1];
                                    if (last && last.role === 'assistant') {
                                        last.text += part.text;
                                    } else {
                                        newPrev.push({ role: 'assistant', text: part.text });
                                    }
                                    return newPrev;
                                });
                            }
                        }
                    }
                }

                if (data.toolCall) {
                    for (const call of data.toolCall.functionCalls) {
                        const actionStr = `[ACTION]: ${call.name} -> ${JSON.stringify(call.args)}`;
                        setTranscript(prev => {
                            // Prevent duplicate tool call logs
                            let lastAction = null;
                            for (let i = prev.length - 1; i >= 0; i--) {
                                if (prev[i].role === 'action') {
                                    lastAction = prev[i];
                                    break;
                                }
                            }
                            if (lastAction && lastAction.text === actionStr) return prev;
                            return [...prev, { role: 'action', text: actionStr }];
                        });

                        // HANDLE ACTUAL CART UPDATES
                        if (call.name === "process_order" && call.args.items) {
                            setCart(prev => {
                                let newCart = [...prev];
                                call.args.items.forEach((item: any) => {
                                    const menuItem = items.find((m: any) => m.name.toLowerCase() === item.item_name.toLowerCase());
                                    if (menuItem) {
                                        const mods = item.modifiers || [];
                                        const notes = item.notes || "";
                                        const mId = (menuItem.id || menuItem._id).toString();

                                        if (item.action === 'add') {
                                            const existingIndex = newCart.findIndex(c =>
                                                c.menuItemId === mId &&
                                                JSON.stringify(c.modifiers.sort()) === JSON.stringify(mods.sort()) &&
                                                c.notes === notes
                                            );
                                            if (existingIndex >= 0) {
                                                newCart[existingIndex].qty += item.quantity;
                                            } else {
                                                newCart.push({
                                                    menuItemId: mId,
                                                    name: menuItem.name,
                                                    qty: item.quantity,
                                                    modifiers: mods,
                                                    notes: notes
                                                });
                                            }
                                        } else if (item.action === 'remove') {
                                            let qtyToRemove = item.quantity;
                                            for (let i = newCart.length - 1; i >= 0 && qtyToRemove > 0; i--) {
                                                if (newCart[i].menuItemId === mId) {
                                                    if (newCart[i].qty > qtyToRemove) {
                                                        newCart[i].qty -= qtyToRemove;
                                                        qtyToRemove = 0;
                                                    } else {
                                                        qtyToRemove -= newCart[i].qty;
                                                        newCart.splice(i, 1);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                });
                                return newCart;
                            });
                        }

                        if (call.name === "place_order") {
                            // Effectively submit the order to KDS backend
                            (async () => {
                                try {
                                    // We'll get the latest cart from state
                                    const latestCart = await new Promise<any[]>(resolve => {
                                        setCart(current => {
                                            resolve(current);
                                            return current;
                                        });
                                    });

                                    if (latestCart.length === 0) return;

                                    const orderPayload = {
                                        orderNumber: "",
                                        items: latestCart.map(c => ({
                                            menu_item_id: c.menuItemId,
                                            name: c.name,
                                            qty: c.qty,
                                            modifiers: c.modifiers,
                                            notes: c.notes
                                        })),
                                        status: "new",
                                        type: "dine-in",
                                        table: "Admin Dashboard",
                                        time: new Date().toLocaleTimeString(),
                                        elapsed: 0
                                    };

                                    const response = await fetch("http://localhost:8000/menu-items/orders", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(orderPayload)
                                    });

                                    if (response.ok) {
                                        console.log("Admin Voice Order submitted to KDS successfully.");
                                        setCart([]);
                                    }
                                } catch (err) {
                                    console.error("KDS Submission error:", err);
                                }
                            })();
                        }

                        // Send tool response to Gemini
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

        while (isPlaying.current) {
            if (audioQueue.current.length > 0) {
                const data = audioQueue.current.shift()!;
                await playAudioChunk(data);
            } else {
                // Wait for more data IF model is still turning (Gaps up to 1500ms)
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
            // 100ms balanced buffer
            if (nextStartTimeRef.current < now) {
                nextStartTimeRef.current = now + 0.1;
            }

            const startTime = nextStartTimeRef.current;
            source.start(startTime);

            const duration = data.length / 24000;
            nextStartTimeRef.current = startTime + duration;

            // Resolve earlier (80ms head start)
            const delay = (startTime - now + duration) * 1000 - 80;
            setTimeout(resolve, Math.max(0, delay));
        });
    };

    const stopSession = () => {
        setIsRecording(false);
        setStatus('idle');
        socketRef.current?.close();
        socketRef.current = null;
        processorRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());
        recognitionRef.current?.stop();
        audioContextRef.current?.close();
        audioQueue.current = [];
        isPlaying.current = false;
        setInterimUserText("");
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
                            VOICE: AOEDE (FEMALE)
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
                        <p className="text-sm mt-1 max-w-[250px]">Connect to simulate a real-time ordering conversation.</p>
                    </div>
                ) : (
                    <>
                        {transcript.map((msg, i) => {
                            let displayText = msg.text;
                            if (msg.role === 'assistant') {
                                // Strip out markdown chunks and thinking phrases after accumulation
                                displayText = displayText.replace(/\*\*.*?\*\*/gs, '');

                                // Aggressively strip out first-person thought descriptions
                                const thoughtPatterns = [
                                    /I'm working on interpreting.*?(?=\n|$)/g,
                                    /I've determined.*?(?=\n|$)/g,
                                    /My current plan.*?(?=\n|$)/g,
                                    /I need to guide.*?(?=\n|$)/g,
                                    /I think it is an easy.*?(?=\n|$)/g,
                                    /I'm now formulating.*?(?=\n|$)/g,
                                    /I was thrown a curveball.*?(?=\n|$)/g,
                                    /So, I'm pivoting.*?(?=\n|$)/g,
                                    /I need to get this right before proceeding.*?(?=\n|$)/g,
                                    /My current approach involves.*?(?=\n|$)/g,
                                    /I've set the action to.*?(?=\n|$)/g,
                                    /Similarly, for ".*?", I've mapped.*?(?=\n|$)/g,
                                    /The next step is to finalize.*?(?=\n|$)/g,
                                    /I will then confirm with the user.*?(?=\n|$)/g
                                ];

                                thoughtPatterns.forEach(pattern => {
                                    displayText = displayText.replace(pattern, '');
                                });

                                displayText = displayText.trim();
                                if (!displayText) return null; // Skip rendering if the whole chunk was a thought
                            }

                            const isUser = msg.role === 'user';
                            const isAction = msg.role === 'action';

                            return (
                                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' :
                                        isAction ? 'bg-muted text-muted-foreground font-mono text-xs border border-border rounded-lg' :
                                            'bg-card text-foreground border border-border rounded-tl-sm'
                                        }`}>
                                        {displayText}
                                    </div>
                                </div>
                            );
                        })}
                        {interimUserText && (
                            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
                                <div className="max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm bg-primary/70 text-primary-foreground rounded-tr-sm italic">
                                    {interimUserText}
                                </div>
                            </div>
                        )}
                    </>
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
                            NORMAL PLAYBACK SPEED
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
