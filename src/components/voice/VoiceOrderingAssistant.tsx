import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Vapi from '@vapi-ai/web';

interface VoiceOrderingAssistantProps {
    onCartUpdate: (update: any) => void;
}

const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

// Instantiate Vapi with the Public Key
const vapi = new Vapi(publicKey);

const VoiceOrderingAssistant: React.FC<VoiceOrderingAssistantProps> = ({ onCartUpdate }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Setup Vapi event listeners
        
        vapi.on('call-start', () => {
            console.log('Call started');
            setStatus('listening');
            setError(null);
        });

        vapi.on('call-end', () => {
            console.log('Call ended');
            setStatus('idle');
        });

        vapi.on('error', (e) => {
            console.error('Vapi Error:', e);
            setError(e.message || 'Call encountered an error');
            setStatus('idle');
        });

        vapi.on('message', (message) => {
            // Distinguish message types for status changes
            if (message.type === 'speech-update') {
                if (message.status === 'started' && message.role === 'assistant') {
                    setStatus('speaking');
                } else if (message.status === 'stopped' && message.role === 'assistant') {
                    setStatus('listening');
                }
            }

            // Handle tool-call messages for UI cart synchronisation
            if (message.type === 'tool-calls') {
                const toolCalls = message.toolWithToolCallList || [];
                toast.info("Vapi triggers frontend tool-call!");
                toolCalls.forEach((toolCallWrapper: any) => {
                    const toolCall = toolCallWrapper.toolCall;
                    if (toolCall.function && toolCall.function.name === 'process_order') {
                        try {
                            const argsJson = toolCall.function.arguments;
                            let args = typeof argsJson === 'string' ? JSON.parse(argsJson) : argsJson;
                            
                            // Transform into expected structure for MobileMenu.tsx: 
                            // { function: "process_order", args: { items: [ { action, item_name, quantity, notes } ] } }
                            const formattedArgs = {
                                items: [{
                                    action: args.action,
                                    item_name: args.item_name,
                                    quantity: args.quantity || 1,
                                    notes: args.notes || ""
                                }]
                            };

                            onCartUpdate({
                                function: 'process_order',
                                args: formattedArgs
                            });
                            
                            // Let Vapi know the tool executed successfully
                            vapi.send({
                                type: 'add-message',
                                message: {
                                    role: 'tool',
                                    toolCallId: toolCall.id,
                                    name: toolCall.function.name,
                                    content: "Item successfully processed and updated in the user's cart UI."
                                }
                            } as any);

                            toast.success(`Sent ${args.action} ${args.item_name} to Cart UI`);
                        } catch (err: any) {
                            console.error("Failed to parse process_order arguments:", err);
                            toast.error(`Order parse failed: ${err.message}`);
                            
                            vapi.send({
                                type: 'add-message',
                                message: {
                                    role: 'tool',
                                    toolCallId: toolCall.id,
                                    name: toolCall.function.name,
                                    content: `Failed to add item to cart: ${err.message}`
                                }
                            } as any);
                        }
                    }
                });
            }
        });

        return () => {
            // Cleanup listeners
            vapi.stop();
            vapi.removeAllListeners();
        };
    }, [onCartUpdate]);

    const startSession = async () => {
        try {
            setStatus('connecting');
            setError(null);
            
            // Start the Vapi Assistant
            if (!publicKey || !assistantId) {
                throw new Error("Missing VAPI_PUBLIC_KEY or VAPI_ASSISTANT_ID");
            }

            await vapi.start(assistantId);
        } catch (err: any) {
            setError(err.message || 'Failed to start.');
            setStatus('idle');
        }
    };

    const stopSession = () => {
        vapi.stop();
        setStatus('idle');
    };

    const isRecording = status !== 'idle' && status !== 'connecting';

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
