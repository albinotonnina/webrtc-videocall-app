import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

type SignalEvent = 'offer' | 'answer' | 'ice-candidate' | 'user-joined';

export class SignalingService {
    private channel: RealtimeChannel | null = null;
    private roomId: string;
    private onSignal: (type: SignalEvent, payload: any) => void;

    constructor(roomId: string, onSignal: (type: SignalEvent, payload: any) => void) {
        this.roomId = roomId;
        this.onSignal = onSignal;
    }

    async join() {
        this.channel = supabase.channel(`room:${this.roomId}`);

        this.channel
            .on('broadcast', { event: 'signal' }, ({ payload }) => {
                // Prevent handling our own messages if they echo back (broadcast usually doesn't echo to self by default, but good to be safe if client logic changes)
                this.onSignal(payload.type, payload.data);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Announce we are here
                    this.sendSignal('user-joined', {});
                }
            });
    }

    async leave() {
        if (this.channel) {
            await this.channel.unsubscribe();
            this.channel = null;
        }
    }

    sendSignal(type: SignalEvent, data: any) {
        if (this.channel) {
            this.channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { type, data },
            });
        }
    }
}
