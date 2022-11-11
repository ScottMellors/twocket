import fetch from 'node-fetch';
import { RawData, WebSocket } from 'ws';

interface WebsocketPayloadEvent {
    user_id: string;
    user_login: string;
    user_name: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
}

interface FollowPayloadEvent extends WebsocketPayloadEvent {
    followed_at: string; //could be date?
}

interface RewardRedemptionPayloadEvent extends WebsocketPayloadEvent {
    user_input: string;
    status: string;
    reward: RewardRedemptionPayloadReward;
    redeemed_at: string; //Could be date?
}

interface SubscriptionPayloadEvent extends WebsocketPayloadEvent {
    tier: string;
    is_gift: boolean;
}

interface SubscriptionGiftPayloadEvent extends WebsocketPayloadEvent {
    total: number;
    tier: string;
    cumulative_total: number | undefined;
    is_anonymous: boolean;
}

interface RewardRedemptionPayloadReward {
    id: string;
    title: string;
    cost: number;
    prompt: string;
}

interface RaidPayloadEvent {
    viewers: number;
    from_broadcaster_user_id: string,
    from_broadcaster_user_login: string,
    from_broadcaster_user_name: string,
    to_broadcaster_user_id: string,
    to_broadcaster_user_login: string,
    to_broadcaster_user_name: string,
}

interface CheerPayloadEvent extends WebsocketPayloadEvent {
    bits: number;
    message: string;
    is_anonymous: boolean; //Is this necessary now that it's deprecated?
}

class Twocket {
    private TWITCH_USER_ID: string;
    private TWITCH_CLIENT_ID: string;
    private TWITCH_ACCESS_TOKEN: string;
    private ws: WebSocket | undefined;
    private TWITCH_SOCKET_ID: string | undefined;
    private scopes: string[] | [];

    private VALID_SCOPES = ["channel.channel_points_custom_reward_redemption.add", "channel.raid","channel.cheer","channel.follow", "channel.subscribe", "channel.subscription.gift" ];

    private onFollowEvent = (eventData: FollowPayloadEvent) => {
        console.log("On Follow Event Receieved");
    };

    private onRaidEvent = (eventData: RaidPayloadEvent) => {
        console.log("On Raid Event Receieved");
    };

    private onSubscriptionGiftEvent = (eventData: SubscriptionGiftPayloadEvent) => {
        console.log("On Subscribe Gift Event Received");
    };

    private onChannelPointRewardRedeem = (eventData: RewardRedemptionPayloadEvent) => {
        console.log("On Channel Point Reward Redeem Event Received");
    }

    private onSubscribeEvent = (eventData: SubscriptionPayloadEvent) => {
        console.log("On Subscribe Event Received");
    };

    private onCheerEvent = (eventData: CheerPayloadEvent) => {
        console.log("On Cheer Event Received");
    };
    
    constructor(twitchUserId: string, twitchClientId: string, twitchAccessToken: string, scopesToRegister: string[]) {
        this.TWITCH_USER_ID = twitchUserId;
        this.TWITCH_CLIENT_ID = twitchClientId;
        this.TWITCH_ACCESS_TOKEN = twitchAccessToken;
        this.scopes = scopesToRegister;
    }   

    protected setTwitchSocketId(socketId: string) {
        this.TWITCH_SOCKET_ID = socketId;
    }

    private registerScopes() {
        //Register Events for given scopes
        if(this.scopes.length < 1) {
            this.ws?.close();
            throw new Error('Scopes cannot be 0, ensure you are adding this to the constructor!');
        } else {
            this.scopes.forEach(scope => {
                //register
                this.sendSubscriptionRequestToTwitch(scope);
            });
        }
    }

    start() {
        //Do websocket things
        this.ws = new WebSocket("wss://eventsub-beta.wss.twitch.tv/ws");

        this.ws.on('message', (data: RawData) => {       
            let parsedData = JSON.parse(data.toString());

            switch (parsedData.metadata["message_type"]) {
                case ("session_welcome"):
                    this.setTwitchSocketId(parsedData.payload.session.id);

                    this.registerScopes();
                break;

                case ("session_reconnect"):
                    //Do reconnect things
                    console.log("Reconnecting");

                    this.registerScopes();
                break;

                case ("notification"):

                    if(this.VALID_SCOPES.includes(parsedData.metadata["subscription_type"])) {
                        switch(parsedData.metadata["subscription_type"]) {
                            case "channel.follow":
                                this.onFollowEvent(parsedData.payload.event);
                            break;

                            case "channel.subscription.gift":
                                this.onSubscriptionGiftEvent(parsedData.payload.event);
                            break;

                            case "channel.raid":
                                this.onRaidEvent(parsedData.payload.event);
                            break;

                            case "channel.cheer":
                                this.onCheerEvent(parsedData.payload.event);
                            break;
    
                            case "channel.subscribe":
                                this.onSubscribeEvent(parsedData.payload.event);
                            break;

                            case "channel.channel_points_custom_reward_redemption.add":
                                this.onChannelPointRewardRedeem(parsedData.payload.event);
                            break;
    
                            default:
                                console.log(parsedData.metadata["subscription_type"] + " event handler missing!");
                            break;
                        }
                    } else {
                        //Error - not valid scope found
                        throw new Error('Incorrect Scope Found!');
                    } 
                break;
            }
        });
    }

    stop() {
        this.ws?.close();
    }

    getSubscriptionList() {
        //TODO
    }

    private async sendSubscriptionRequestToTwitch(requestType: String) {
        const options = {
            method: 'POST',
            body: `{"type":"${requestType}","version":"1","condition":{"broadcaster_user_id":"${this.TWITCH_USER_ID}"},"transport":{"method":"websocket","session_id":"${this.TWITCH_SOCKET_ID}"}}` ,
            headers: {
                Authorization: `Bearer ${this.TWITCH_ACCESS_TOKEN}`,
                'Client-Id': this.TWITCH_CLIENT_ID,
                'Content-Type':'application/json' 
            }
        };
        
        let response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', options);   

        if(!response.ok) {
           throw new Error("Error creating subscription - " + response.status);
        } else {
            //TODO Maybe do verbose logging of creating connections?
            console.log(requestType + " subscription created");
        }
    }

    //Handler handlers.
    setOnChannelPointRewardRedeem(newHandler: (eventData: RewardRedemptionPayloadEvent) => void) {
        this.onChannelPointRewardRedeem = newHandler;
    }

    setOnFollowEvent(newHandler: (eventData: FollowPayloadEvent) => void) {
        this.onFollowEvent = newHandler;
    }

    setOnSubscribeEvent(newHandler: (eventData: SubscriptionPayloadEvent) => void) {
        this.onSubscribeEvent = newHandler;
    }

    setOnRaidEvent(newHandler: (eventData: RaidPayloadEvent) => void) {
        this.onRaidEvent = newHandler;
    }

    setOnCheerEvent(newHandler: (eventData: CheerPayloadEvent) => void) {
        this.onCheerEvent = newHandler;
    }

    setOnGiftSubscribeEvent(newHandler: (eventData: SubscriptionGiftPayloadEvent) => void) {
        this.onSubscriptionGiftEvent = newHandler;
    }
}

export {
    SubscriptionGiftPayloadEvent,
    CheerPayloadEvent,
    RaidPayloadEvent,
    SubscriptionPayloadEvent,
    RewardRedemptionPayloadReward,
    RewardRedemptionPayloadEvent,
    FollowPayloadEvent,
    Twocket
}
