import VoiceCopilotWidget from "@/components/admin/VoiceCopilotWidget";
import { VoiceConsole } from "@/components/admin/VoiceConsole";

const VoiceCopilot = () => (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-display font-semibold text-card-foreground">Voice Copilot Hub</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage the AI agent, view call logs, and test the console.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
                <VoiceCopilotWidget />
            </div>
            <div className="xl:col-span-2">
                <VoiceConsole />
            </div>
        </div>
    </div>
);

export default VoiceCopilot;
